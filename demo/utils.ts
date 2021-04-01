// native
import { createHash } from 'crypto';
import { createReadStream, createWriteStream, promises as fs } from 'fs';
import { dirname, relative, resolve } from 'path';

// packages
import glob from 'fast-glob';

// types
import type { TypeMap } from 'mime';
import type { Readable } from 'stream';

/**
 * Resolves a path relative to the current working directory.
 *
 * @private
 * @param relativePath The relative path to resolve
 */
export function resolvePath(relativePath: string) {
  return resolve(process.cwd(), relativePath);
}

/**
 * Finds all the files in a given directory and resolves them relative to the
 * current working directory.
 *
 * @private
 * @param dir The directory to find all the files within
 */
export async function findFiles(dir: string) {
  const resolvedDir = resolvePath(dir);

  const files = await glob('**/*', {
    absolute: true,
    cwd: dir,
  });

  return files.map((file) => {
    const dest = relative(resolvedDir, file);

    return { file, dest };
  });
}

export function outputFile(dest: string, data: Readable) {
  return new Promise(async (resolve, reject) => {
    // get the file's directory
    const dir = dirname(dest);

    // ensure the directory exists
    await fs.mkdir(dir, { recursive: true });

    data
      .pipe(createWriteStream(dest))
      .on('finish', resolve)
      .on('error', reject);
  });
}

/**
 * Takes the path to a file and calculates its md5.
 *
 * @private
 * @param path The path to a file
 */
export function md5FromFile(path: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const input = createReadStream(path);
    const hash = createHash('md5').setEncoding('hex');

    input
      .on('error', reject)
      .pipe(hash)
      .on('error', reject)
      .on('finish', () => {
        resolve(hash.read());
      });
  });
}

/**
 * A pre-compiled regex for determining if a filename contains an 8-character
 * hexadecimal string. This is typically a sign this file has been hashed.
 *
 * @private
 */
const hashRegExp = new RegExp('\\.[0-9a-f]{8}\\.');

/**
 * The default function delivery uses to determine if a file should receive
 * cache headers.
 *
 * @private
 * @param path The input path
 */
export function defaultShouldBeCached(path: string) {
  return hashRegExp.test(path);
}

/**
 * A custom TypeMap to be passed to the mime library to account for topojson files.
 *
 * @private
 */
export const customTypeMap: TypeMap = { 'application/json': ['topojson'] };
