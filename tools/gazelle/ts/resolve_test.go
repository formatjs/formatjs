package ts

import (
	"sort"
	"testing"

	"github.com/bazelbuild/bazel-gazelle/label"
)

// newTestLang creates a tsLang with the given packageDeps for testing.
func newTestLang(deps map[string]bool) *tsLang {
	return &tsLang{
		packageDeps:       deps,
		subpathImportsMap: make(map[string]string),
	}
}

func TestResolveNpmImport(t *testing.T) {
	l := newTestLang(map[string]bool{
		"react":                              true,
		"@types/react":                       true,
		"@formatjs/intl":                     true,
		"@formatjs/icu-messageformat-parser": true,
		"@formatjs/icu-skeleton-parser":      true,
		"lodash-es":                          true,
		"@types/lodash-es":                   true,
		"typescript":                         true,
		"eslint":                             true,
	})

	tests := []struct {
		name     string
		input    string
		expected string
	}{
		{
			name:     "regular package",
			input:    "react",
			expected: "//:node_modules/react",
		},
		{
			name:     "scoped package",
			input:    "@formatjs/intl",
			expected: "//:node_modules/@formatjs/intl",
		},
		{
			name:     "scoped package with subpath",
			input:    "@formatjs/intl/server",
			expected: "//:node_modules/@formatjs/intl",
		},
		{
			name:     "regular package with subpath",
			input:    "lodash-es/debounce",
			expected: "//:node_modules/lodash-es",
		},
		{
			name:     "unknown package returns empty",
			input:    "nonexistent-pkg",
			expected: "",
		},
		{
			name:     "scoped with only 1 part",
			input:    "@solo",
			expected: "",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := l.resolveNpmImport(tt.input)
			if got != tt.expected {
				t.Errorf("resolveNpmImport(%q) = %q, want %q", tt.input, got, tt.expected)
			}
		})
	}
}

func TestGetTypesPackage(t *testing.T) {
	l := newTestLang(map[string]bool{
		"react":                                true,
		"@types/react":                         true,
		"lodash-es":                            true,
		"@types/node":                          true,
		"@formatjs/intl":                       true,
		"@babel/core":                          true,
		"@types/babel__core":                   true,
		"@babel/helper-plugin-utils":           true,
		"@types/babel__helper-plugin-utils":    true,
	})

	tests := []struct {
		name     string
		input    string
		expected string
	}{
		{
			name:     "has @types",
			input:    "react",
			expected: "//:node_modules/@types/react",
		},
		{
			name:     "no @types",
			input:    "lodash-es",
			expected: "",
		},
		{
			name:     "scoped package with @types (DefinitelyTyped convention)",
			input:    "@babel/core",
			expected: "//:node_modules/@types/babel__core",
		},
		{
			name:     "scoped package with @types double-barrel",
			input:    "@babel/helper-plugin-utils",
			expected: "//:node_modules/@types/babel__helper-plugin-utils",
		},
		{
			name:     "scoped package without @types",
			input:    "@formatjs/intl",
			expected: "",
		},
		{
			name:     "@types package itself skipped",
			input:    "@types/react",
			expected: "",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := l.getTypesPackage(tt.input)
			if got != tt.expected {
				t.Errorf("getTypesPackage(%q) = %q, want %q", tt.input, got, tt.expected)
			}
		})
	}
}

func TestResolveImportsToDeps_Categories(t *testing.T) {
	l := newTestLang(map[string]bool{
		"react":                              true,
		"@types/react":                       true,
		"@formatjs/icu-messageformat-parser": true,
		"@formatjs/icu-skeleton-parser":      true,
	})

	imports := []ImportStatement{
		{ImportPath: "./relative", SourceFile: "index.ts"},
		{ImportPath: "../parent", SourceFile: "index.ts"},
		{ImportPath: "react", SourceFile: "index.ts"},
		{ImportPath: "@formatjs/icu-skeleton-parser", SourceFile: "index.ts"},
		{ImportPath: "node:path", SourceFile: "index.ts"},
		{ImportPath: "fs", SourceFile: "index.ts"},
		{ImportPath: "node:fs/promises", SourceFile: "index.ts"},
	}

	from := label.Label{Pkg: "packages/intl-messageformat"}
	result := l.resolveImportsToDeps(imports, from, nil)

	expectedExt := []string{
		"//:node_modules/@formatjs/icu-skeleton-parser",
		"//:node_modules/@types/node",
		"//:node_modules/@types/react",
		"//:node_modules/react",
	}
	sort.Strings(result.external)
	if len(result.external) != len(expectedExt) {
		t.Errorf("external deps: got %d, want %d\ngot:  %v\nwant: %v",
			len(result.external), len(expectedExt), result.external, expectedExt)
	} else {
		for i, exp := range expectedExt {
			if result.external[i] != exp {
				t.Errorf("external[%d]: got %q, want %q", i, result.external[i], exp)
			}
		}
	}

	if len(result.internal) != 0 {
		t.Errorf("internal deps: got %v, want empty (no RuleIndex)", result.internal)
	}
}

func TestResolveImportsToDeps_NodeBuiltins(t *testing.T) {
	l := newTestLang(map[string]bool{})

	imports := []ImportStatement{
		{ImportPath: "node:path", SourceFile: "index.ts"},
		{ImportPath: "fs", SourceFile: "index.ts"},
		{ImportPath: "node:crypto", SourceFile: "index.ts"},
		{ImportPath: "stream/promises", SourceFile: "index.ts"},
		{ImportPath: "node:http2", SourceFile: "index.ts"},
	}

	from := label.Label{Pkg: "packages/cli-lib"}
	result := l.resolveImportsToDeps(imports, from, nil)

	if len(result.external) != 1 {
		t.Errorf("expected 1 external dep (@types/node), got %d: %v",
			len(result.external), result.external)
	}
	if len(result.external) > 0 && result.external[0] != "//:node_modules/@types/node" {
		t.Errorf("expected //:node_modules/@types/node, got %q", result.external[0])
	}
}

func TestResolveImportsToDeps_Deduplication(t *testing.T) {
	l := newTestLang(map[string]bool{
		"react":        true,
		"@types/react": true,
	})

	imports := []ImportStatement{
		{ImportPath: "react", SourceFile: "a.ts"},
		{ImportPath: "react", SourceFile: "b.ts"},
		{ImportPath: "react", SourceFile: "c.ts"},
	}

	from := label.Label{Pkg: "packages/react-intl"}
	result := l.resolveImportsToDeps(imports, from, nil)

	expected := []string{"//:node_modules/@types/react", "//:node_modules/react"}
	if len(result.external) != len(expected) {
		t.Errorf("expected %d deps, got %d: %v", len(expected), len(result.external), result.external)
	}
}

func TestResolveImportsToDeps_SkipsRelative(t *testing.T) {
	l := newTestLang(map[string]bool{})

	imports := []ImportStatement{
		{ImportPath: "./utils", SourceFile: "index.ts"},
		{ImportPath: "../common/errors", SourceFile: "index.ts"},
		{ImportPath: "./components/Button", SourceFile: "index.ts"},
	}

	from := label.Label{Pkg: "packages/react-intl"}
	result := l.resolveImportsToDeps(imports, from, nil)

	if len(result.external) != 0 {
		t.Errorf("relative imports should be skipped, got external: %v", result.external)
	}
	if len(result.internal) != 0 {
		t.Errorf("relative imports should be skipped, got internal: %v", result.internal)
	}
}

func TestResolveImportsToDeps_TypesOnlyPackage(t *testing.T) {
	l := newTestLang(map[string]bool{
		"@types/estree-jsx": true,
	})

	imports := []ImportStatement{
		{ImportPath: "estree-jsx", SourceFile: "index.ts"},
	}

	from := label.Label{Pkg: "packages/eslint-plugin-formatjs"}
	result := l.resolveImportsToDeps(imports, from, nil)

	if len(result.external) != 1 {
		t.Errorf("expected 1 dep, got %d: %v", len(result.external), result.external)
	}
	if len(result.external) > 0 && result.external[0] != "//:node_modules/@types/estree-jsx" {
		t.Errorf("expected @types fallback, got %q", result.external[0])
	}
}

func TestDeduplicateAndSort(t *testing.T) {
	tests := []struct {
		name     string
		input    []string
		expected []string
	}{
		{
			name:     "empty",
			input:    nil,
			expected: nil,
		},
		{
			name:     "already sorted unique",
			input:    []string{"a", "b", "c"},
			expected: []string{"a", "b", "c"},
		},
		{
			name:     "duplicates",
			input:    []string{"c", "a", "b", "a", "c"},
			expected: []string{"a", "b", "c"},
		},
		{
			name:     "bazel labels",
			input:    []string{"//:node_modules/react", "//packages/ecma402-abstract", "//:node_modules/react"},
			expected: []string{"//:node_modules/react", "//packages/ecma402-abstract"},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := deduplicateAndSort(tt.input)
			if len(got) != len(tt.expected) {
				t.Errorf("len: got %d, want %d\ngot:  %v\nwant: %v",
					len(got), len(tt.expected), got, tt.expected)
				return
			}
			for i, exp := range tt.expected {
				if got[i] != exp {
					t.Errorf("[%d]: got %q, want %q", i, got[i], exp)
				}
			}
		})
	}
}

func TestIsTestFile(t *testing.T) {
	tests := []struct {
		name     string
		input    string
		expected bool
	}{
		{"test file", "foo.test.ts", true},
		{"test tsx file", "foo.test.tsx", true},
		{"tests dir", "tests/foo.ts", true},
		{"test dir", "test/foo.ts", true},
		{"source file", "index.ts", false},
		{"source tsx", "Component.tsx", false},
		{"rules dir", "rules/foo.ts", false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := isTestFile(tt.input)
			if got != tt.expected {
				t.Errorf("isTestFile(%q) = %v, want %v", tt.input, got, tt.expected)
			}
		})
	}
}

func TestIsTypeScriptFile(t *testing.T) {
	tests := []struct {
		name     string
		input    string
		expected bool
	}{
		{"ts", "index.ts", true},
		{"tsx", "App.tsx", true},
		{"js", "index.js", false},
		{"json", "package.json", false},
		{"css", "styles.css", false},
		{"d.ts", "types.d.ts", true},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := isTypeScriptFile(tt.input)
			if got != tt.expected {
				t.Errorf("isTypeScriptFile(%q) = %v, want %v", tt.input, got, tt.expected)
			}
		})
	}
}
