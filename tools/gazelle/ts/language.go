// Package ts implements a Gazelle language extension for formatjs TypeScript packages.
//
// This plugin automatically generates and maintains BUILD files for TypeScript packages
// in the formatjs monorepo. It handles two Bazel rule types:
//
//   - formatjs_library: TypeScript library compilation (source code)
//   - formatjs_test:    Vitest-based test execution (test code)
//
// The plugin operates in Gazelle's three-phase pipeline:
//
//  1. GenerateRules (generate.go): Scan .ts/.tsx files, extract imports, create/update rules
//  2. Imports (imports.go):        Register rules in the RuleIndex so other packages can find them
//  3. Resolve (resolve.go):        Convert parsed imports into Bazel dep labels
//
// Configuration is per-directory via BUILD file directives (configure.go):
//
//	# gazelle:formatjs_enabled false   ← disable plugin for a directory
package ts

import (
	"github.com/bazelbuild/bazel-gazelle/label"
	"github.com/bazelbuild/bazel-gazelle/language"
	"github.com/bazelbuild/bazel-gazelle/rule"
)

// languageName is the unique identifier for this Gazelle extension.
const languageName = "formatjs_ts"

// tsLang implements the language.Language interface from Gazelle.
// It holds the parser subprocess (via lifeCycleManager) and cached
// package.json data needed for import resolution.
type tsLang struct {
	lifeCycleManager

	// packageDeps is a set of all npm package names from the root package.json.
	packageDeps map[string]bool

	// subpathImportsMap stores the "imports" field from root package.json.
	// Maps patterns like "#packages/*" → "./packages/*".
	subpathImportsMap map[string]string
}

// NewLanguage creates a new formatjs TypeScript language extension.
func NewLanguage() language.Language {
	return &tsLang{
		packageDeps:       make(map[string]bool),
		subpathImportsMap: make(map[string]string),
	}
}

func (l *tsLang) Name() string { return languageName }

// Embeds returns empty — TypeScript doesn't use Bazel's rule embedding mechanism.
func (l *tsLang) Embeds(r *rule.Rule, from label.Label) []label.Label { return nil }
