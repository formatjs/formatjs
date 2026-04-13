// parser.go — TypeScript import extraction entry point.
//
// Uses the oxc-based Rust subprocess (parser_oxc.go) to parse TypeScript files
// and extract import paths. Files are batched per-directory for efficiency —
// one subprocess round-trip per directory instead of per-file.
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

// extractImportsBatch extracts imports from multiple files in a single subprocess call.
// Returns a map from file path to its import statements.
// This is much more efficient than per-file calls because:
//   - One subprocess round-trip instead of N
//   - Rust side uses rayon to parse files in parallel
func extractImportsBatch(filePaths []string) (map[string][]ImportStatement, error) {
	parser := getOxcParser()
	if parser == nil {
		return nil, nil
	}

	result, err := parser.ExtractImports(filePaths)
	if err != nil {
		return nil, err
	}

	imports := make(map[string][]ImportStatement, len(result))
	for file, paths := range result {
		stmts := make([]ImportStatement, 0, len(paths))
		for _, p := range paths {
			stmts = append(stmts, ImportStatement{
				ImportPath: p,
				SourceFile: file,
			})
		}
		imports[file] = stmts
	}
	return imports, nil
}
