---
id: application-workflow
title: Application Workflow
---

While our [Installation](./installation.md) guide can help you get started, this guide gives you an overview how your daily translation workflow might look like.

There are 2 types of translations tools and services:

- Tools that work locally on your computer - just like your IDE.
- Cloud translation services that require an upload of your translation files. These require a translation pipeline with a complex workflow.

This guide will give you an idea of how to work with both types of tools.

## Simple application workflow with a local translation tool

```
projectRoot
|-- src
|   |-- App.js
|-- extracted
|   |-- en.json
|-- lang
|   |-- fr.json
|   |-- de.json
|-- package.json
|-- .eslintrc.js
```

The extracted translation files live in the `extracted` folder since they have a different internal structure (e.g. they contain additional information like the comments). The translation files produced during the translation process are stored in the `lang` folder.

### The workflow

The workflow looks like this:

![Pipeline](/img/simple-workflow.svg)

1. **Extraction**: This step aggregates all `defaultMessage`s from your application into a single JSON file along with `description`, ready to be translated.
2. **Edit**: Edit the translations, save when done.
3. The changes immediately show up in your build

## Complex application workflow with a cloud based translation service

### Project Structure

A minimal i18n-friendly project can have the following structure:

```
projectRoot
|-- src
|   |-- App.js
|-- lang
|   |-- en-US.json
|   |-- fr.json
|-- package.json
|-- .eslintrc.js
```

where `lang` folder is where the aggregated strings file from your application would live. Integration with 3rd-party translation vendor can consume the `en-US.json` file and produce `fr.json` or other locale files accordingly.

### Pipeline

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
