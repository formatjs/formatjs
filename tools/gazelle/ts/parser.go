package ts

import (
	"context"
	"os"

	sitter "github.com/smacker/go-tree-sitter"
	"github.com/smacker/go-tree-sitter/typescript/typescript"
)

// ImportStatement represents a single import found in a TypeScript file.
type ImportStatement struct {
	ImportPath string
	SourceFile string
}

// extractImportsFromFile reads a file and extracts all import paths.
func extractImportsFromFile(filePath string) ([]ImportStatement, error) {
	data, err := os.ReadFile(filePath)
	if err != nil {
		return nil, err
	}
	return extractImports(data, filePath), nil
}

// extractImports parses TypeScript source with tree-sitter and extracts import paths.
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

// collectImports walks the AST and collects import/export source strings.
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

	// Recurse into children
	for i := 0; i < int(node.ChildCount()); i++ {
		child := node.Child(i)
		collectImports(child, source, sourceFile, imports, seen)
	}
}

// findChildByType finds the first child node of a specific type.
func findChildByType(node *sitter.Node, childType string) *sitter.Node {
	for i := 0; i < int(node.ChildCount()); i++ {
		child := node.Child(i)
		if child.Type() == childType {
			return child
		}
	}
	return nil
}

// addImport extracts the string content from a tree-sitter string node and adds it.
func addImport(strNode *sitter.Node, source []byte, sourceFile string, imports *[]ImportStatement, seen map[string]bool) {
	// String node content includes quotes, strip them
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
