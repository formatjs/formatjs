import {Opts, compile} from './compile';
import {join, basename} from 'path';
import {outputFile} from 'fs-extra';
export default async function compileFolder(
  files: string[],
  outFolder: string,
  opts: Opts = {}
) {
  const results = await Promise.all(files.map(f => compile([f], opts)));
  const outFiles = files.map(f => join(outFolder, basename(f)));

  return Promise.all(
    outFiles.map((outFile, i) => outputFile(outFile, results[i]))
  );
}
