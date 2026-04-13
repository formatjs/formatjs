// parser.go — TypeScript import extraction entry point.
//
// Uses the oxc-based Rust subprocess (parser_oxc.go) to parse TypeScript files
// and extract import paths. The oxc parser handles all import forms:
//
//   - import { foo } from 'module'       (named import)
//   - import * as foo from 'module'      (namespace import)
//   - import foo from 'module'           (default import)
//   - import 'module'                    (side-effect import)
//   - export { foo } from 'module'       (re-export)
//   - export * from 'module'             (wildcard re-export)
//   - import('module')                   (dynamic import)
//   - import type { Foo } from 'module'  (type-only import)
//
// The parser extracts the raw import path (e.g., "react", "#packages/ecma402-abstract/types/number.js")
// without any resolution. Resolution happens later in resolve.go.
package ts

// ImportStatement represents a single import found in a TypeScript file.
// Both the import path and source file are tracked so that error messages
// can point to the exact file that introduced a dependency.
type ImportStatement struct {
	ImportPath string // The module specifier (e.g., "react", "#packages/ecma402-abstract/types/number.js")
	SourceFile string // The file containing this import (e.g., "packages/intl-locale/src/index.ts")
}

// extractImportsFromFile extracts all import paths from a TypeScript file
// using the oxc-based Rust subprocess.
func extractImportsFromFile(filePath string) ([]ImportStatement, error) {
	return extractImportsOxc(filePath)
}
