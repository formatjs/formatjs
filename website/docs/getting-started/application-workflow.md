---
id: application-workflow
title: Application Workflow
---

This guide covers typical workflow for a i18n-friendly application in production.

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
