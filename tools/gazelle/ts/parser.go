// parser.go extracts import statements from TypeScript files using tree-sitter.
//
// Tree-sitter is used instead of regex because TypeScript imports can appear in
// many forms that are hard to match reliably with patterns:
//
//   - import { foo } from 'module'       (named import)
//   - import * as foo from 'module'      (namespace import)
//   - import foo from 'module'           (default import)
//   - import 'module'                    (side-effect import)
//   - export { foo } from 'module'       (re-export)
//   - export * from 'module'             (wildcard re-export)
//   - import('module')                   (dynamic import)
//   - import type { Foo } from 'module'  (type-only import — still needs deps for type checking)
//
// All of these are handled by walking the tree-sitter AST and looking for
// import_statement, export_statement, and call_expression nodes that contain
// string literals representing module paths.
//
// The parser extracts the raw import path (e.g., "react", "#packages/ecma402-abstract/types/number.js")
// without any resolution. Resolution happens later in resolve.go.
package ts

import (
	"context"
	"os"

	sitter "github.com/smacker/go-tree-sitter"
	"github.com/smacker/go-tree-sitter/typescript/typescript"
)

// ImportStatement represents a single import found in a TypeScript file.
// Both the import path and source file are tracked so that error messages
// can point to the exact file that introduced a dependency.
type ImportStatement struct {
	ImportPath string // The module specifier (e.g., "react", "#packages/ecma402-abstract/types/number.js")
	SourceFile string // The file containing this import (e.g., "packages/intl-locale/src/index.ts")
}

// extractImportsFromFile reads a TypeScript file and returns all import paths found in it.
// Returns an error if the file can't be read (the caller typically ignores this and skips the file).
func extractImportsFromFile(filePath string) ([]ImportStatement, error) {
	data, err := os.ReadFile(filePath)
	if err != nil {
		return nil, err
	}
	return extractImports(data, filePath), nil
}

// extractImports parses TypeScript source code with tree-sitter and extracts all import paths.
// It creates a fresh parser for each file (tree-sitter parsers are lightweight).
// The seen map prevents duplicate imports within the same file.
func extractImports(source []byte, sourceFile string) []ImportStatement {
	parser := sitter.NewParser()
	parser.SetLanguage(typescript.GetLanguage())

	tree, err := parser.ParseCtx(context.Background(), nil, source)
	if err != nil {
		return nil
	}
	defer tree.Close()

	root := tree.RootNode()
	var imports []ImportStatement
	seen := make(map[string]bool)

	collectImports(root, source, sourceFile, &imports, seen)
	return imports
}

// collectImports recursively walks the tree-sitter AST and collects import/export
// source strings. It handles three AST node types:
//
//  1. import_statement: covers all static import forms
//     - import { foo } from 'module'
//     - import * as foo from 'module'
//     - import 'module' (side-effect)
//     - import type { Foo } from 'module'
//     The module path is always the string child of the import_statement node.
//
//  2. export_statement: covers re-exports
//     - export { foo } from 'module'
//     - export * from 'module'
//     Same structure — the module path is the string child.
//
//  3. call_expression: covers dynamic imports
//     - import('module')
//     The "function" child is "import" and the first argument is the module path.
//     Only string literal arguments are handled — template literals and variables
//     are ignored (these are rare and usually for code splitting).
func collectImports(node *sitter.Node, source []byte, sourceFile string, imports *[]ImportStatement, seen map[string]bool) {
	nodeType := node.Type()

	switch nodeType {
	case "import_statement":
		// import ... from 'module' OR import 'module'
		if src := findChildByType(node, "string"); src != nil {
			addImport(src, source, sourceFile, imports, seen)
		}

	case "export_statement":
		// export ... from 'module'
		if src := findChildByType(node, "string"); src != nil {
			addImport(src, source, sourceFile, imports, seen)
		}

	case "call_expression":
		// import('module') — dynamic import
		// We check that the "function" child is the "import" keyword (not a regular
		// function call) and that the first argument is a string literal.
		fn := node.ChildByFieldName("function")
		if fn != nil && fn.Type() == "import" {
			args := node.ChildByFieldName("arguments")
			if args != nil && args.NamedChildCount() > 0 {
				arg := args.NamedChild(0)
				if arg.Type() == "string" {
					addImport(arg, source, sourceFile, imports, seen)
				}
			}
		}
	}

	// Recurse into all children. We visit every node because imports can appear
	// anywhere in the file (inside functions, conditionals, etc.).
	for i := 0; i < int(node.ChildCount()); i++ {
		child := node.Child(i)
		collectImports(child, source, sourceFile, imports, seen)
	}
}

// findChildByType finds the first direct child node of a specific type.
// Used to locate the string literal (module path) within import/export statements.
func findChildByType(node *sitter.Node, childType string) *sitter.Node {
	for i := 0; i < int(node.ChildCount()); i++ {
		child := node.Child(i)
		if child.Type() == childType {
			return child
		}
	}
	return nil
}

// addImport extracts the module path from a tree-sitter string node and appends it
// to the imports list. String nodes include their surrounding quotes ('module' or
// "module"), which are stripped to get the raw import path.
//
// Deduplication is per-file via the seen map — the same import path appearing
// multiple times in one file only produces one ImportStatement.
func addImport(strNode *sitter.Node, source []byte, sourceFile string, imports *[]ImportStatement, seen map[string]bool) {
	// String node content includes quotes, e.g., "'react'" or "\"react\""
	content := strNode.Content(source)
	if len(content) < 2 {
		return
	}
	// Strip surrounding quotes (' or ")
	importPath := content[1 : len(content)-1]
	if importPath == "" || seen[importPath] {
		return
	}
	seen[importPath] = true
	*imports = append(*imports, ImportStatement{
		ImportPath: importPath,
		SourceFile: sourceFile,
	})
}
