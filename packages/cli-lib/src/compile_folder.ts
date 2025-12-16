import * as fsExtra from 'fs-extra'
import {basename, join} from 'path'
import {Opts, compile} from './compile.js'
const {outputFile} = fsExtra;
export default async function compileFolder(
  files: string[],
  outFolder: string,
  opts: Opts = {}
): Promise<void[]> {
  const results = await Promise.all(files.map(f => compile([f], opts)))
  const outFiles = files.map(f => join(outFolder, basename(f)))

  return Promise.all(
    outFiles.map((outFile, i) => outputFile(outFile, results[i]))
  )
}
