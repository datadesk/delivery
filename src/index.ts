// native
import { EventEmitter } from 'events';
import { createReadStream, promises as fs } from 'fs';
import { Agent } from 'https';
import { join, relative } from 'path';

// packages
import S3 from 'aws-sdk/clients/s3';
import mime from 'mime';

// local
import { longLiveCache, requireRevalidation } from './cache-headers';
import {
  customTypeMap,
  defaultShouldBeCached,
  findFiles,
  md5FromFile,
  outputFile,
  resolvePath,
} from './utils';

/**
 * A helper type to cover cases where either nullable is valid.
 *
 * @private
 */
type Optional = null | undefined;

/** What downloadFile and downloadFiles returns. */
export interface DownloadOutput {
  /** The file's path on S3. */
  Key: string;
  /** Whether the file was identical on S3 or locally and was skipped. */
  isIdentical: boolean;
}

/** What uploadFile and uploadFiles returns. */
export interface UploadOutput {
  /** The file's ETag. */
  ETag: string;
  /** The file's path on S3. */
  Key: string;
  /** Whether the file was identical on S3 or locally and was skipped. */
  isIdentical: boolean;
  /** This file was made public on upload. */
  isPublic: boolean;
  /** The size of the uploaded file in bytes. */
  size: number;
}

// add some custom extensions to mime library
mime.define(customTypeMap);

/**
 * The base class for @datagraphics/delivery. Create an instance of Delivery to set
 * an interface with S3.
 *
 * @param options
 * @param options.bucket The bucket on S3 to interact with
 * @param options.basePath A pre-defined base path for all interactions with S3.
 *                         Useful for establishing the slug or prefix of an upload.
 * @param options.useAccelerateEndpoint If true, use the Accelerate endpoint
 * @param options.shouldBeCached A function used to determine whether a file
 *                               should receive long-lived cache headers.
 * @example
 * const delivery = new Delivery({
 *  bucket: 'apps.thebignews.com',
 *  basePath: 'our-great-project',
 * });
 */
export class Delivery extends EventEmitter {
  declare s3: S3;
  declare bucket: string;
  declare basePath: string;
  declare shouldBeCached: (path: string) => boolean;

  constructor({
    bucket,
    basePath = '',
    useAccelerateEndpoint = false,
    shouldBeCached = defaultShouldBeCached,
  }: {
    bucket: string;
    basePath?: string;
    useAccelerateEndpoint?: boolean;
    shouldBeCached?: (path: string) => boolean;
  }) {
    super();

    // instantiate the s3 instance
    this.s3 = new S3({
      httpOptions: {
        agent: new Agent({
          keepAlive: true,
          maxSockets: 50,
        }),
      },
      useAccelerateEndpoint,
    });

    this.bucket = bucket;
    this.basePath = basePath;
    this.shouldBeCached = shouldBeCached;
  }

  /**
   * Uploads a single file to S3.
   *
   * @param file The path to the file to upload
   * @param path Where to upload the file relative to the base path
   * @param options
   * @param options.isPublic Whether a file should be made public or not on upload
   * @param options.shouldCache Whether a file should have cache headers applied
   * @param options.cacheControlOverride A custom Cache-Control value that will
   *                                     override the built-in lookup if
   *                                     shouldCache is true
   * @example
   * const result = await delivery.uploadFile(
   *   './data/counties.json', // path to the file on local drive
   *   'counties.json', // the key to give the file in S3, combined with `basePath`
   *   {
   *     isPublic: true,
   *   }
   * );
   */
  async uploadFile(
    file: string,
    path: string,
    {
      isPublic = false,
      shouldCache = false,
      cacheControlOverride,
    }: {
      isPublic?: boolean;
      shouldCache?: boolean;
      cacheControlOverride?: string;
    } = {}
  ): Promise<UploadOutput> {
    // prepare the Key to the file on S3
    const Key = join(this.basePath, path);

    // get ready to read the file as a stream
    const Body = createReadStream(file);

    // grab the size of the file
    const { size } = await fs.stat(file);

    // determine the content type of the file
    const ContentType = mime.getType(file) || 'application/octet-stream';

    // decide whether it should be a public file or not
    const ACL = isPublic ? 'public-read' : 'private';

    // determine the content hash for the file
    const ETag = await md5FromFile(file);

    // we check to see if the file already exists on S3 and if it is identical
    const s3ETag = await this.getS3ObjectETag(Key);
    const isIdentical = this.isFileIdenticaltoS3File(ETag, s3ETag);

    // if they were the same, no need to upload
    if (!isIdentical) {
      const params: S3.PutObjectRequest = {
        Bucket: this.bucket,
        ACL,
        Body,
        ContentType,
        Key,
      };

      if (shouldCache) {
        // we received a custom override
        if (cacheControlOverride) {
          params.CacheControl = cacheControlOverride;
        } else {
          // otherwise figure it out
          if (ContentType === 'text/html') {
            params.CacheControl = requireRevalidation;
          } else if (this.shouldBeCached(path)) {
            params.CacheControl = longLiveCache;
          }
        }
      }

      try {
        await this.s3.putObject(params).promise();
      } catch (err) {
        throw err;
      }
    }

    const output: UploadOutput = {
      ETag,
      Key,
      isIdentical,
      isPublic,
      size,
    };

    /**
     * @event Delivery#upload
     * @type {UploadOutput}
     */
    this.emit('upload', output);

    return output;
  }

  /**
   * Upload a directory of files to S3.
   *
   * @param dir The directory to upload to S3
   * @param options
   * @param options.prefix The prefix to add to the uploaded file's path
   * @param options.isPublic Whether all files uploaded should be made public
   * @param options.shouldCache Whether all files uploaded should get cache headers
   * @param options.cacheControlOverride A custom Cache-Control value that will
   *                                     override the built-in lookup if
   *                                     shouldCache is true
   * @example
   * const result = await delivery.uploadFiles(
   *   './dist/', // path to the directory on local drive to upload
   *   {
   *     isPublic: true,
   *     prefix: 'output', // the key prefix to combine with `basePath`
   *   }
   * );
   */
  async uploadFiles(
    dir: string,
    {
      prefix = '',
      isPublic = false,
      shouldCache = false,
      cacheControlOverride,
    }: {
      prefix?: string;
      isPublic?: boolean;
      shouldCache?: boolean;
      cacheControlOverride?: string;
    } = {}
  ) {
    const files = await findFiles(dir);

    const uploadedFiles = await Promise.all(
      files.map(({ file, dest }: { file: string; dest: string }) =>
        this.uploadFile(file, join(prefix, dest), {
          isPublic,
          shouldCache,
          cacheControlOverride,
        })
      )
    );

    this.emit('upload:all', uploadedFiles);
    return uploadedFiles;
  }

  /**
   * Downloads a file from S3 to the local disk.
   *
   * @param path The path to the file to download
   * @param dest Where to put the file on the local disk
   * @param options
   * @param options.s3ETag If the ETag from S3 is already known, it can be provided here
   * @example
   * const result = await delivery.downloadFile(
   *   'output/data.json', // key of file on S3 to download
   *   './downloaded/data.json', // where to download the file to the local drive
   * );
   */
  async downloadFile(
    path: string,
    dest: string,
    { s3ETag }: { s3ETag?: string } = {}
  ) {
    const Key = join(this.basePath, path);
    // downloadFiles already has this and passes it on, but if this is used
    // by itself it needs to retrieve the s3ETag on its own
    if (!s3ETag) {
      s3ETag = await this.getS3ObjectETag(Key);
    }

    // we check to see if we already have the same exact file locally
    let isIdentical;

    try {
      const hash = await md5FromFile(dest);
      isIdentical = this.isFileIdenticaltoS3File(hash, s3ETag);
    } catch (err) {
      // the file doesn't exist locally, and that's fine
      if (err.code === 'ENOENT') {
        isIdentical = false;
      } else {
        throw err;
      }
    }

    if (!isIdentical) {
      const params: S3.GetObjectRequest = {
        Bucket: this.bucket,
        Key,
      };

      const data = await this.s3.getObject(params).promise();
      await outputFile(dest, data.Body);
    }

    const output: DownloadOutput = { Key, isIdentical };

    this.emit('download', output);
    return output;
  }

  /**
   * Downloads multiple files from a prefix on S3.
   *
   * @param prefix The prefix to the directory on S3 to download from
   * @param dir Where to put all the files on the local disk
   * @example
   * const result = await delivery.downloadFiles(
   *   'production', // the key of the directory on S3 to download from
   *   './downloaded/', // where to download the files to the local drive
   * );
   */
  async downloadFiles(prefix: string, dir: string) {
    const dest = resolvePath(dir);

    const Prefix = join(this.basePath, prefix);
    const params: S3.ListObjectsV2Request = { Bucket: this.bucket, Prefix };

    const { Contents } = await this.s3.listObjectsV2(params).promise();

    const downloadedFiles: DownloadOutput[] = [];

    if (Contents) {
      await Promise.all(
        Contents.map(async (obj) => {
          if (obj.Key == null) return;

          const Key = relative(this.basePath, obj.Key);
          const s3ETag = obj.ETag;

          downloadedFiles.push(
            await this.downloadFile(Key, join(dest, relative(prefix, Key)), {
              s3ETag,
            })
          );
        })
      );
    }

    this.emit('download:all', downloadedFiles);
    return downloadedFiles;
  }

  /**
   * Retrieves the ETag of a file on S3.
   *
   * @private
   * @param Key The key of the file on S3 to get the Etag for
   */
  async getS3ObjectETag(Key: string) {
    const params: S3.HeadObjectRequest = {
      Bucket: this.bucket,
      Key,
    };

    try {
      const { ETag } = await this.s3.headObject(params).promise();

      return ETag;
    } catch (err) {
      // the file didn't exist and that's fine
      if (err.code === 'NotFound') {
        return undefined;
      }

      // other wise throw the error, it was something else
      throw err;
    }
  }

  /**
   * Compares the ETag of a local file with an ETag of a file on S3. Tweaks
   * the value of the local ETag to match the format of the S3 ETag.
   *
   * @private
   * @param localETag the ETag of the local file being compared
   * @param s3ETag the Etag of the file on S3 being compared
   */
  isFileIdenticaltoS3File(
    localETag: string | Optional,
    s3ETag: string | Optional
  ) {
    // the AWS API returns this with a extra quotes for some reason, so make
    // sure this follows suit
    localETag = `"${localETag}"`;

    // if either file didn't exist, don't bother
    if (localETag == null || s3ETag == null) return false;

    // determine whether they are the same or not
    return localETag === s3ETag;
  }
}
