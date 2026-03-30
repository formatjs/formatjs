import path from 'node:path'
import fs from 'node:fs'

function getWorkspaceRoot() {
  if (process.env.BUILD_WORKSPACE_DIRECTORY) {
    return process.env.BUILD_WORKSPACE_DIRECTORY
  }
  if (process.env.JS_BINARY__EXECROOT && process.env.BAZEL_BINDIR) {
    return path.join(process.env.JS_BINARY__EXECROOT, process.env.BAZEL_BINDIR)
  }
  if (process.env.JS_BINARY__RUNFILES && process.env.JS_BINARY__WORKSPACE) {
    return path.join(
      process.env.JS_BINARY__RUNFILES,
      process.env.JS_BINARY__WORKSPACE
    )
  }
  return process.cwd()
}

export default {
  plugins: [
    {
      name: 'workspace-resolve',
      setup(build) {
        const workspaceRoot = getWorkspaceRoot()

        // Resolve #path/to/module imports to workspace-root-relative paths.
        // The # prefix maps to the repo root, so #foo/bar → <workspaceRoot>/foo/bar
        build.onResolve({filter: /^#/}, args => {
          const stripped = args.path.slice(1) // remove '#'
          const resolved = path.resolve(workspaceRoot, stripped)
          if (fs.existsSync(resolved)) {
            return {path: resolved}
          }
          const tsPath = resolved.replace(/\.js$/, '.ts')
          if (fs.existsSync(tsPath)) {
            return {path: tsPath}
          }
          throw new Error(
            `Cannot resolve '${args.path}': neither ${resolved} nor ${tsPath} exists`
          )
        })
      },
    },
  ],
}
