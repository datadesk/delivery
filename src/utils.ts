// native
import { relative, resolve } from 'path';

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
