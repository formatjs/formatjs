# Script Conventions

## CLI Script Pattern

All TypeScript CLI scripts in `tools/` and `packages/*/scripts/` follow a consistent pattern:

### 1. Typed Args Interface

Define an `Args` interface extending `minimist.ParsedArgs` with typed fields for all CLI arguments:

```typescript
import minimist from 'minimist'

interface Args extends minimist.ParsedArgs {
  out: string
  format?: string
  external?: string | string[] // use union for --flag that can repeat
}
```

### 2. Main Function

Extract logic into a `main(args: Args)` function:

```typescript
function main(args: Args) {
  const {out, format} = args
  // ...
}
```

Use `async function main(args: Args)` if the script uses `await`.

### 3. Entry Point Guard

Use `import.meta.filename` to guard the entry point:

```typescript
if (import.meta.filename === process.argv[1]) {
  main(minimist<Args>(process.argv.slice(2)))
}
```

### 4. Array Arguments

For CLI flags that can repeat (e.g., `--external foo --external bar`), use `[].concat(args.flag || [])` to normalize:

```typescript
const externals: string[] = [].concat(args.external || [])
```

### Example

See `tools/generate-supported-locales.ts` for the canonical minimal example, or `tools/rolldown-bundle.ts` for a more complex one.
