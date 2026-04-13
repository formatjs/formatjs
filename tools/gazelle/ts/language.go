// Package ts implements a Gazelle language extension for formatjs TypeScript packages.
// It manages deps and project_references on formatjs_library and formatjs_test targets
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
			Symbols: []string{KindFormatjsLibrary},
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
// Both formatjs_library and ts_compile rules provide their package path so other
// packages can resolve #packages/* imports to project_references.
func (l *tsLang) Imports(c *config.Config, r *rule.Rule, f *rule.File) []resolve.ImportSpec {
	if r.Kind() != KindFormatjsLibrary && r.Kind() != KindTsCompile {
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

// GenerateRules scans TypeScript files and creates or updates formatjs_library
// and formatjs_test rules. Rules are auto-created when TypeScript source or test
// files exist, unless disabled via the formatjs_enabled directive.
// Gazelle's merge handles preserving manually-set attrs (visibility, package_json, etc.).
func (l *tsLang) GenerateRules(args language.GenerateArgs) language.GenerateResult {
	cfg, ok := args.Config.Exts[languageName].(*tsConfig)
	if !ok || !cfg.enabled {
		return language.GenerateResult{}
	}

	// Collect TypeScript files from args.RegularFiles (provided by gazelle).
	var sourceImports, testImports []ImportStatement

	for _, f := range args.RegularFiles {
		if !isTypeScriptFile(f) {
			continue
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

	libSrcs, testSrcs := collectSrcs(args.RegularFiles)

	if len(libSrcs) == 0 && len(testSrcs) == 0 {
		return language.GenerateResult{}
	}

	var genRules []*rule.Rule
	var genImports []interface{}

	// Generate formatjs_library if source files exist.
	// Gazelle merges with existing rule if present, preserving manual attrs.
	if len(libSrcs) > 0 {
		newRule := rule.NewRule(KindFormatjsLibrary, "dist")
		newRule.SetAttr("srcs", libSrcs)
		newRule.SetAttr("visibility", []string{"//visibility:public"})
		genRules = append(genRules, newRule)
		genImports = append(genImports, ImportData{
			Imports: sourceImports,
		})
	}

	// Generate formatjs_test if test files exist.
	if len(testSrcs) > 0 {
		newRule := rule.NewRule(KindFormatjsTest, "unit_test")
		newRule.SetAttr("srcs", testSrcs)
		genRules = append(genRules, newRule)
		genImports = append(genImports, ImportData{
			TestImports: testImports,
		})
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

// collectSrcs partitions RegularFiles into source and test file lists.
// Test srcs include TypeScript files, JSON data files, and fixture files under tests/.
// The formatjs_test macro separates fixtures from test srcs internally.
func collectSrcs(regularFiles []string) (srcFiles, testFiles []string) {
	for _, f := range regularFiles {
		if isTestFile(f) {
			if isTypeScriptFile(f) || strings.HasSuffix(f, ".json") {
				testFiles = append(testFiles, f)
			}
		} else if isTypeScriptFile(f) {
			srcFiles = append(srcFiles, f)
		}
	}
	sort.Strings(srcFiles)
	sort.Strings(testFiles)
	return
}

