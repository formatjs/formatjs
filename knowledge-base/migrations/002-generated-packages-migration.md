# Migration: #formatjs_generated Packages

Status: complete.

Generated TypeScript data now uses path-shaped subpath imports that mirror the Bazel output location:

```typescript
import links from '#formatjs_generated/packages/intl-datetimeformat/links.js'
import {S_UNICODE_REGEX} from '#formatjs_generated/packages/generated/unicode/regex.js'
```

Consumers depend directly on the generated `js_library` target that owns the output path. There is no generated npm package and no `node_modules/#formatjs_generated/*` link layer.

See `knowledge-base/011-generated-packages.md` for the current architecture.
