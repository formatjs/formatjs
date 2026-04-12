// Package ts implements a Gazelle language extension for formatjs TypeScript packages.
// It manages deps and project_references on formatjs_compile and formatjs_test targets
// by parsing TypeScript imports and resolving them to Bazel labels.
package ts

import (
	"path/filepath"
	"sort"
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
		{
			Name:    "//tools:index.bzl",
			Symbols: []string{KindTsCompile},
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
// Both formatjs_compile and ts_compile rules provide their package path so other
// packages can resolve #packages/* imports to project_references.
func (l *tsLang) Imports(c *config.Config, r *rule.Rule, f *rule.File) []resolve.ImportSpec {
	if r.Kind() != KindFormatjsCompile && r.Kind() != KindTsCompile {
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

	// Collect TypeScript files and imports from args.RegularFiles (provided by gazelle).
	var sourceFiles, testFiles []string
	var sourceImports, testImports []ImportStatement

	for _, f := range args.RegularFiles {
		if !isTypeScriptFile(f) {
			continue
		}

		if isTestFile(f) {
			testFiles = append(testFiles, f)
		} else {
			sourceFiles = append(sourceFiles, f)
		}

		fullPath := filepath.Join(args.Dir, f)
		imps, err := extractImportsFromFile(fullPath)
		if err != nil {
			continue
		}

		if isTestFile(f) {
			testImports = append(testImports, imps...)
		} else {
			sourceImports = append(sourceImports, imps...)
		}
	}

	if args.File == nil {
		return language.GenerateResult{}
	}

	// Sort file lists for deterministic output.
	sort.Strings(sourceFiles)
	sort.Strings(testFiles)

	// Create new rules that match existing ones, so gazelle's merge can
	// properly preserve # keep entries in the existing BUILD file.
	var genRules []*rule.Rule
	var genImports []interface{}

	for _, r := range args.File.Rules {
		switch r.Kind() {
		case KindFormatjsCompile:
			newRule := rule.NewRule(r.Kind(), r.Name())
			if len(sourceFiles) > 0 {
				newRule.SetAttr("srcs", sourceFiles)
			}
			genRules = append(genRules, newRule)
			genImports = append(genImports, ImportData{
				Imports: sourceImports,
			})

		case KindFormatjsTest:
			if !cfg.skipTest {
				newRule := rule.NewRule(r.Kind(), r.Name())
				genRules = append(genRules, newRule)
				genImports = append(genImports, ImportData{
					Imports:     sourceImports,
					TestImports: testImports,
				})
			}
		}
	}

	return language.GenerateResult{
		Gen:     genRules,
		Imports: genImports,
	}
}


func isTypeScriptFile(name string) bool {
	if !strings.HasSuffix(name, ".ts") && !strings.HasSuffix(name, ".tsx") {
		return false
	}
	// Exclude type-definition test files (*.test-d.ts) — these use special
	// tsconfig settings and are tested via tsd, not vitest.
	if strings.HasSuffix(name, ".test-d.ts") || strings.HasSuffix(name, ".test-d.tsx") {
		return false
	}
	return true
}

func isTestFile(name string) bool {
	return strings.Contains(name, ".test.ts") ||
		strings.Contains(name, ".test.tsx") ||
		strings.HasPrefix(name, "tests/") ||
		strings.HasPrefix(name, "test/")
}


