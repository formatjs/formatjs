// Package ts implements a Gazelle language extension for formatjs TypeScript packages.
// It manages deps and project_references on formatjs_compile and formatjs_test targets
// by parsing TypeScript imports and resolving them to Bazel labels.
package ts

import (
	"path/filepath"
	"strings"

	"github.com/bazelbuild/bazel-gazelle/config"
	"github.com/bazelbuild/bazel-gazelle/label"
	"github.com/bazelbuild/bazel-gazelle/language"
	"github.com/bazelbuild/bazel-gazelle/resolve"
	"github.com/bazelbuild/bazel-gazelle/rule"
)

const languageName = "formatjs_ts"

// tsLang implements language.Language for formatjs TypeScript packages.
type tsLang struct{}

// NewLanguage creates a new formatjs TypeScript language extension.
func NewLanguage() language.Language {
	return &tsLang{}
}

func (l *tsLang) Name() string { return languageName }

func (l *tsLang) Kinds() map[string]rule.KindInfo {
	return tsKinds
}

// Loads declares the .bzl files that provide the rule kinds.
func (l *tsLang) Loads() []rule.LoadInfo {
	return []rule.LoadInfo{
		{
			Name:    "//tools:compile.bzl",
			Symbols: []string{KindFormatjsCompile},
		},
		{
			Name:    "//tools:test.bzl",
			Symbols: []string{KindFormatjsTest},
		},
	}
}

// Fix performs post-processing on BUILD files. Currently a no-op.
func (l *tsLang) Fix(c *config.Config, f *rule.File) {}

// ImportData carries parsed imports from GenerateRules to Resolve.
type ImportData struct {
	Imports     []ImportStatement // Source file imports
	TestImports []ImportStatement // Test file imports
}

// Imports returns the import specs that a rule provides, used to build the RuleIndex.
// Each formatjs_compile rule provides its package path so other packages can depend on it.
func (l *tsLang) Imports(c *config.Config, r *rule.Rule, f *rule.File) []resolve.ImportSpec {
	if r.Kind() != KindFormatjsCompile {
		return nil
	}

	pkg := f.Pkg
	return []resolve.ImportSpec{
		{Lang: languageName, Imp: pkg},
		{Lang: languageName, Imp: pkg + "/*"},
	}
}

// Embeds returns empty — TypeScript doesn't use embedding.
func (l *tsLang) Embeds(r *rule.Rule, from label.Label) []label.Label { return nil }

// GenerateRules scans TypeScript files and attaches import data to existing rules.
// It does NOT create new rules — it only updates deps on existing formatjs_compile
// and formatjs_test targets.
func (l *tsLang) GenerateRules(args language.GenerateArgs) language.GenerateResult {
	cfg, ok := args.Config.Exts[languageName].(*tsConfig)
	if !ok || !cfg.enabled {
		return language.GenerateResult{}
	}

	// Only operate under packages/ directory
	if !isUnderPackagesDir(args.Rel) {
		return language.GenerateResult{}
	}

	// Collect TypeScript files
	var sourceFiles, testFiles []string
	for _, f := range args.RegularFiles {
		if !isTypeScriptFile(f) {
			continue
		}
		if isTestFile(f) {
			testFiles = append(testFiles, f)
		} else {
			sourceFiles = append(sourceFiles, f)
		}
	}

	// Also check subdirectories for test files (tests/ directory)
	for _, d := range args.Subdirs {
		if d == "tests" || d == "test" {
			walkTestDir(filepath.Join(args.Dir, d), d, &testFiles)
		}
	}

	if len(sourceFiles) == 0 && len(testFiles) == 0 {
		return language.GenerateResult{}
	}

	// Parse imports from source files
	var sourceImports []ImportStatement
	for _, f := range sourceFiles {
		fullPath := filepath.Join(args.Dir, f)
		imps, err := extractImportsFromFile(fullPath)
		if err != nil {
			continue
		}
		sourceImports = append(sourceImports, imps...)
	}

	// Parse imports from test files
	var testImports []ImportStatement
	for _, f := range testFiles {
		fullPath := filepath.Join(args.Dir, f)
		imps, err := extractImportsFromFile(fullPath)
		if err != nil {
			continue
		}
		testImports = append(testImports, imps...)
	}

	// Find existing rules in the BUILD file
	var genRules []*rule.Rule
	var genImports []interface{}

	if args.File != nil {
		for _, r := range args.File.Rules {
			switch r.Kind() {
			case KindFormatjsCompile:
				genRules = append(genRules, r)
				genImports = append(genImports, ImportData{
					Imports: sourceImports,
				})

			case KindFormatjsTest:
				if !cfg.skipTest {
					genRules = append(genRules, r)
					genImports = append(genImports, ImportData{
						Imports:     sourceImports,
						TestImports: testImports,
					})
				}
			}
		}
	}

	return language.GenerateResult{
		Gen:     genRules,
		Imports: genImports,
	}
}

func isTypeScriptFile(name string) bool {
	return strings.HasSuffix(name, ".ts") || strings.HasSuffix(name, ".tsx")
}

func isTestFile(name string) bool {
	return strings.Contains(name, ".test.ts") ||
		strings.Contains(name, ".test.tsx") ||
		strings.HasPrefix(name, "tests/") ||
		strings.HasPrefix(name, "test/")
}

// walkTestDir recursively finds .ts/.tsx files in a test directory.
func walkTestDir(dir string, relPrefix string, testFiles *[]string) {
	entries, err := filepath.Glob(filepath.Join(dir, "*"))
	if err != nil {
		return
	}
	for _, entry := range entries {
		base := filepath.Base(entry)
		relPath := relPrefix + "/" + base

		// Check if directory
		info, err := filepath.Abs(entry)
		if err != nil {
			continue
		}
		_ = info

		if isTypeScriptFile(base) {
			*testFiles = append(*testFiles, relPath)
		}

		// Recurse into subdirectories
		subEntries, err := filepath.Glob(filepath.Join(entry, "*"))
		if err == nil && len(subEntries) > 0 {
			walkTestDir(entry, relPath, testFiles)
		}
	}
}
