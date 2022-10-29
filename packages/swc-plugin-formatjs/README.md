# SWC-plugin-formatjs

`SWC-plugin-formatjs`

`swc-plugin-formatjs` is a port of `babel-plugin-formatjs` for the SWC. Transform can be performed either via SWC's wasm-based plugin, or using custom passes in rust side transform chains.

## What does compatible exactly means?

This plugin attempts to mimic most of defined behavior of original plugin's test fixture. However, due to differences of plugin interfaces, as well as known limitations there are numbers of unsupported features with differences. You may able to check the list of github issues, as well as checking test fixtures.

Notably, any dynamic configuration options (`overrideFn`, `onMsg`...) are not supported, and few internal behaviors relying on static evaluation won't work.

**NOTE: Package can have breaking changes without major semver bump**

Given SWC's plugin interface itself is under experimental stage does not gaurantee semver-based major bump yet, this package also does not gaurantee semver compliant breaking changes yet. Please refer changelogs if you're encountering unexpected breaking behavior across versions.

**Also, current implementation is largely unoptimized, and may have performance issues as initial focus was to pass existing test fixtures only.**

# Usage

## Using SWC's wasm-based experimental plugin

First, install package via npm:

```
npm install --save-dev swc-plugin-formatjs
```

Then add plugin into swc's configuration:

```
interface PluginOptions {
  pragma: string;
  removeDefaultMessage: bool,
  idInterpolationPattern?: string,
  ast: bool,
  extractSorceLocation: bool,
  preserveWhitespace: bool,
  additionalFunctionNames: Array<string>,
  additionalComponentNames: Array<string>
}

jsc: {
  ...
  experimental: {
    plugins: [
      ["SWC-plugin-formatjs", {
        //pluginOptions
      }]
    ]
  }
}
```

## Using custom transform pass in rust

There is a single interface exposed to create a visitor for the transform, which you can pass into `before_custom_pass`.

```
create_formatjs_visitor<C: Clone + Comments, S: SourceMapper>(
    source_map: std::sync::Arc<S>,
    comments: C,
    plugin_options: FormatJSPluginOptions,
    filename: &str,
) -> FormatJSVisitor<C, S>
```

# Building / Testing

This package runs slightly modified original plugin's fixture tests against SWC with its wasm plugin & custom transform both. `spec` contains set of the fixtures & unit test to run it, as well as supplimental packages to interop between instrumentation visitor to node.js runtime.

Few npm scripts are supported for wrapping those setups.

- `build:all`: Build all relative packages as debug build.
- `test`: Runs unit test for wasm plugin & custom transform.
