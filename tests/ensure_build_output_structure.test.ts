/**
 * Tests to ensure that `dist` or `lib` mirrors the source file tree.
 */

import {existsSync, readdirSync, readJsonSync} from 'fs-extra';
import glob from 'glob';
import path from 'path';

const PACKAGES_DIR = path.resolve(__dirname, '../packages');

function checkBuildFolderStructure(
  buildOutputFolder: string,
  sourceFilesRelativeToSrcFolder: readonly string[]
) {
  expect(readdirSync(buildOutputFolder)).not.toContain('src');
  expect(readdirSync(buildOutputFolder)).not.toContain('tests');

  for (const file of sourceFilesRelativeToSrcFolder) {
    if (file.endsWith('.d.ts')) {
      continue;
    }
    const builtFile = file.replace(/\.tsx?$/, '.js');
    expect(existsSync(path.resolve(buildOutputFolder, builtFile))).toBe(true);
  }
}

for (const packageJsonPath of glob.sync(`${PACKAGES_DIR}/*/package.json`)) {
  const packageJson = readJsonSync(packageJsonPath);
  const packagePath = path.dirname(packageJsonPath);

  test(`${packageJson.name}: the build output matches the source file tree`, () => {
    const mainEntry: string = packageJson.main;
    const moduleEntry: string | undefined = packageJson.module;

    const sourceFiles = glob.sync('**/*.ts{,x}', {
      cwd: path.resolve(packagePath, 'src'),
    });

    // Assumes the main field value is like `lib/index.js` or `dist/index.js`.
    const mainEntryPath = path.resolve(packagePath, mainEntry);
    const distFolder = path.dirname(mainEntryPath);

    checkBuildFolderStructure(distFolder, sourceFiles);

    if (moduleEntry) {
      const moduleEntryPath = path.resolve(packagePath, moduleEntry);
      const moduleDistFolder = path.dirname(moduleEntryPath);
      checkBuildFolderStructure(moduleDistFolder, sourceFiles);
    }
  });
}
