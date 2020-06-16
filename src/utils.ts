// native
import { promises as fs } from 'fs';
import { dirname, relative, resolve } from 'path';

// packages
import glob from 'fast-glob';

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

  return files.map(file => {
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
