var result = {webAssembly: typeof WebAssembly, executable: false}
if (typeof WebAssembly === 'object') {
  var bytes = new Uint8Array([
    0, 97, 115, 109, 1, 0, 0, 0, 1, 5, 1, 96, 0, 1, 127, 3, 2, 1, 0, 7, 7, 1, 3,
    114, 117, 110, 0, 0, 10, 6, 1, 4, 0, 65, 42, 11,
  ])
  result.executable =
    new WebAssembly.Instance(new WebAssembly.Module(bytes)).exports.run() === 42
  if (!result.executable)
    throw new Error('WASM capability probe returned wrong result')
}
print(JSON.stringify(result))
