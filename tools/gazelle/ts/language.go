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

// GenerateRules scans TypeScript files and attaches import data to existing rules.
// It does NOT create new rules — it only updates deps on existing formatjs_library
// and formatjs_test targets.
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

	if args.File == nil {
		return language.GenerateResult{}
	}

	// Create new rules that match existing ones, so gazelle's merge can
	// properly preserve # keep entries in the existing BUILD file.
	var genRules []*rule.Rule
	var genImports []interface{}

	libSrcs, testSrcs := collectSrcs(args.RegularFiles)

	for _, r := range args.File.Rules {
		switch r.Kind() {
		case KindFormatjsLibrary:
			newRule := rule.NewRule(r.Kind(), r.Name())
			if len(libSrcs) > 0 {
				newRule.SetAttr("srcs", libSrcs)
			}
			genRules = append(genRules, newRule)
			genImports = append(genImports, ImportData{
				Imports: sourceImports,
			})

		case KindFormatjsTest:
			{
				newRule := rule.NewRule(r.Kind(), r.Name())
				// Exclude files already covered by the fixtures attr.
				filtered := excludeFixtures(testSrcs, r)
				if len(filtered) > 0 {
					newRule.SetAttr("srcs", filtered)
				}
				genRules = append(genRules, newRule)
				genImports = append(genImports, ImportData{
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
	return strings.HasSuffix(name, ".ts") || strings.HasSuffix(name, ".tsx")
}

func isTestFile(name string) bool {
	return strings.Contains(name, ".test.ts") ||
		strings.Contains(name, ".test.tsx") ||
		strings.HasPrefix(name, "tests/") ||
		strings.HasPrefix(name, "test/")
}

// collectSrcs partitions RegularFiles into source and test file lists.
// Test srcs include both TypeScript files and JSON data files under tests/.
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

// excludeFixtures removes files from srcs that are covered by the
// existing rule's "fixtures" attribute to avoid duplicates.
func excludeFixtures(testSrcs []string, existingRule *rule.Rule) []string {
	fixturesGlob, ok := rule.ParseGlobExpr(existingRule.Attr("fixtures"))
	if !ok {
		return testSrcs
	}
	var result []string
	for _, f := range testSrcs {
		matched := false
		for _, p := range fixturesGlob.Patterns {
			if m, _ := filepath.Match(p, f); m {
				matched = true
				break
			}
		}
		if !matched {
			result = append(result, f)
		}
	}
	return result
}

