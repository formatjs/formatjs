/**
 * Ensure that project references in tsconfig.json of packages is in sync with Yarn workspace dependencies.
 */

import * as ts from 'typescript';
import path from 'path';
import {execSync} from 'child_process';
import {existsSync} from 'fs';

const REPO_ROOT = path.resolve(__dirname, '..');

const workspaceInfo = JSON.parse(
  execSync('yarn -s workspaces info').toString()
);

for (const workspaceName of Object.keys(workspaceInfo)) {
  // Not a TS project.
  if (workspaceName === 'formatjs-website') {
    continue;
  }

  const {location, workspaceDependencies} = workspaceInfo[workspaceName];
  const packageLocation = path.resolve(REPO_ROOT, location);
  const tsConfig = path.resolve(packageLocation, 'tsconfig.json');
  if (!existsSync(tsConfig)) {
    continue;
  }

  test(`${workspaceName}: tsconfig.json project reference is in sync with \`yarn workspaces info\``, () => {
    const tsconfigData = ts.readConfigFile(tsConfig, ts.sys.readFile).config;
    expect(tsconfigData).toBeDefined();

    if (workspaceDependencies.length === 0) {
      expect(tsconfigData.references || []).toEqual([]);
    } else {
      const expectedReferences = workspaceDependencies.map(
        (depWorkspaceName: string) => {
          const depLocation = workspaceInfo[depWorkspaceName].location;
          const depFolderName = path.basename(depLocation);
          return {path: `../${depFolderName}`};
        }
      );
      expect(tsconfigData.references).toEqual(
        expect.arrayContaining(expectedReferences)
      );
      expect(tsconfigData.references || []).toHaveLength(
        expectedReferences.length
      );
    }
  });
}
