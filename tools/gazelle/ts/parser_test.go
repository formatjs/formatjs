package ts

import (
	"os"
	"path/filepath"
	"testing"
)

func TestExtractImports(t *testing.T) {
	tests := []struct {
		name     string
		source   string
		expected []string
	}{
		{
			name: "standard import",
			source: `import {Foo} from '@formatjs/intl'
import * as React from 'react'`,
			expected: []string{"@formatjs/intl", "react"},
		},
		{
			name:     "side-effect import",
			source:   `import '@formatjs/intl-pluralrules/polyfill.js'`,
			expected: []string{"@formatjs/intl-pluralrules/polyfill.js"},
		},
		{
			name:     "type-only import",
			source:   `import type {NumberFormatOptions} from '#packages/ecma402-abstract/types/number.js'`,
			expected: []string{"#packages/ecma402-abstract/types/number.js"},
		},
		{
			name: "re-export",
			source: `export {createIntl} from '#packages/react-intl/components/createIntl.js'
export * from '@formatjs/intl'`,
			expected: []string{"#packages/react-intl/components/createIntl.js", "@formatjs/intl"},
		},
		{
			name:     "dynamic import",
			source:   `const mod = import('lodash-es')`,
			expected: []string{"lodash-es"},
		},
		{
			name: "relative imports captured by parser",
			source: `import {foo} from './utils'
import {bar} from '../common'`,
			expected: []string{"./utils", "../common"},
		},
		{
			name: "mixed imports",
			source: `import {type Foo} from '#packages/ecma402-abstract/types/number.js'
import * as React from 'react'
import './styles.css'
import {bar} from '@formatjs/icu-skeleton-parser'
export type {Baz} from '#packages/react-intl/types.js'`,
			expected: []string{
				"#packages/ecma402-abstract/types/number.js",
				"react",
				"./styles.css",
				"@formatjs/icu-skeleton-parser",
				"#packages/react-intl/types.js",
			},
		},
		{
			name: "node builtin",
			source: `import path from 'node:path'
import {readFileSync} from 'fs'`,
			expected: []string{"node:path", "fs"},
		},
		{
			name: "deduplication",
			source: `import {a} from 'react'
import {b} from 'react'`,
			expected: []string{"react"},
		},
	}

	// The oxc parser reads files from disk, so write temp files.
	tmpDir := t.TempDir()

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			tmpFile := filepath.Join(tmpDir, "test.ts")
			if err := os.WriteFile(tmpFile, []byte(tt.source), 0644); err != nil {
				t.Fatalf("write temp file: %v", err)
			}

			allImports, err := extractImportsBatch([]string{tmpFile})
			if err != nil {
				t.Fatalf("extractImportsBatch: %v", err)
			}

			imports := allImports[tmpFile]
			paths := make([]string, len(imports))
			for i, imp := range imports {
				paths[i] = imp.ImportPath
			}
			if len(paths) != len(tt.expected) {
				t.Errorf("expected %d imports, got %d: %v", len(tt.expected), len(paths), paths)
				return
			}
			for i, exp := range tt.expected {
				if paths[i] != exp {
					t.Errorf("import[%d]: expected %q, got %q", i, exp, paths[i])
				}
			}
		})
	}
}
