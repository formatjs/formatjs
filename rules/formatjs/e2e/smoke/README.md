# Smoke Test

This is a minimal end-to-end test that verifies basic functionality of `rules_formatjs`.

## Purpose

This smoke test is included in the release artifact to allow users to quickly verify that the rules work in their environment without needing to set up a complex example.

## What it tests

- Basic message extraction from a React component using `formatjs_extract`
- FormatJS CLI toolchain selection and execution
- Module extension setup and toolchain registration

## Running the test

From this directory:

```bash
bazel build //:extract
```

This should successfully extract messages from `src/Hello.tsx` and produce a `messages.json` file with the extracted internationalization messages.

## Expected output

The build should succeed and produce `bazel-bin/messages.json` containing:

```json
{
  "hello.world": {
    "id": "hello.world",
    "defaultMessage": "Hello, World!",
    "description": "Simple greeting message"
  }
}
```
