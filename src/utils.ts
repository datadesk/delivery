// native
import { promises as fs } from 'fs';
import { dirname, relative, resolve } from 'path';

// packages
import glob from 'fast-glob';

// types
import type { TypeMap } from 'mime';

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

export async function outputFile(dest: string, data: any) {
  // get the file's directory
  const dir = dirname(dest);

  // ensure the directory exists
  await fs.mkdir(dir, { recursive: true });

  // attempt to write the file
  try {
    await fs.writeFile(dest, data);
  } catch (e) {
    throw e;
  }
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
