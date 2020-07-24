---
id: application-workflow
title: Application Workflow
---

While our [Installation](./installation.md) guide can help you get started, most production-ready i18n applications require a translation pipeline and workflow. This guide will give you an idea of how to build one.

## Project Structure

A minimal i18n-friendly project can have the following structure:

```
projectRoot
|-- src
|   |-- App.js
|-- lang
|   |-- strings_en-US.json
|   |-- strings_fr.json
|-- package.json
|-- .eslintrc.js
```

where `lang` folder is where the aggregated strings file from your application would live. Integration with 3rd-party translation vendor can consume the `string_en-US.json` file and produce `strings_fr.json` or other locale files accordingly.

## Pipeline

A generic translation pipeline looks something like this:

![Pipeline](/img/workflow.svg)

1. **Extraction**: This step aggregates all `defaultMessage`s from your application into a single JSON file along with `description`, ready to be translated.
2. **Upload Messages**: This step uploads the JSON file to your translation vendor.
3. **Download Translations**: This step either polls your translation vendor or hook into your vendor to download translated messages in the set of locales that you configured.
4. **Commit**: This commits back translation messages to the codebase.

## Where formatjs comes in

The goal of this project is not to provide a solution for the whole pipeline, but rather focus on Developer Experience via tooling and best practices so devs are i18n-aware. This includes:

1. Declaring i18n-friendly messages
2. Linter that enforces such messages
3. CLI for extraction & compilation
4. Polyfills for a stable i18n runtime environments
5. Bundler plugin for compiling TypeScript/JavaScript
