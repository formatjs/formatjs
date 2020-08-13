---
id: advanced-usage
title: Advanced Usage
---

`react-intl` is optimized for both runtime & compile time rendering. Below are a few guidelines you can follow if you have a strict performance budget.

## Pre-parsing messages

You can also pre-parse all messages into `AST` using [`@formatjs/cli`](../tooling/cli.md) `compile` command and pass that into `IntlProvider`. This is especially faster since it saves us time parsing `string` into `AST`. The use cases for this support are:

1. Server-side rendering or pre-parsing where you can cache the AST and don't have to pay compilation costs multiple time.
2. Desktop apps using Electron or CEF where you can preload/precompile things in advanced before runtime.

:::caution Caching Since this approach uses `AST` as the data source, changes to `intl-messageformat-parser`'s `AST` will require cache invalidation. ::: :::caution Asset Size `AST` is also slightly larger in size than regular `string` messages but can be efficiently compressed. :::

In the future, we'll gear towards making this the default behavior.

## Imperative APIs

Imperative APIs (e.g `formatMessage`...) are generally faster than `Formatted` component since it does not create extra `ReactElement` nodes. They should have the exact same capabilities as `Formatted` components.

## More examples

Head over to https://github.com/formatjs/formatjs/tree/main/packages/react-intl/examples for more examples on how to use our libraries.
