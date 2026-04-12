// Package ts implements a Gazelle language extension for formatjs TypeScript packages.
// It manages deps and project_references on formatjs_compile and formatjs_test targets
// by parsing TypeScript imports and resolving them to Bazel labels.
package ts

import (
	"os"
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
type tsLang struct {
	// subdirImports accumulates imports from subdirectories without BUILD files.
	// Key is the nearest parent package path. Gazelle visits children before parents.
	subdirImports     map[string][]ImportStatement
	subdirTestImports map[string][]ImportStatement
}

// NewLanguage creates a new formatjs TypeScript language extension.
func NewLanguage() language.Language {
	return &tsLang{
		subdirImports:     make(map[string][]ImportStatement),
		subdirTestImports: make(map[string][]ImportStatement),
	}
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

	// If this directory has no BUILD file, accumulate imports for the nearest
	// parent package. Gazelle visits children depth-first, so the parent will
	// consume these later.
	if args.File == nil {
		parentPkg := findParentPackage(args.Config.RepoRoot, args.Rel)
		if parentPkg != "" {
			l.subdirImports[parentPkg] = append(l.subdirImports[parentPkg], sourceImports...)
			l.subdirTestImports[parentPkg] = append(l.subdirTestImports[parentPkg], testImports...)
		}
		return language.GenerateResult{}
	}

	// Merge in any imports accumulated from subdirectories.
	if subImps, ok := l.subdirImports[args.Rel]; ok {
		sourceImports = append(sourceImports, subImps...)
		delete(l.subdirImports, args.Rel)
	}
	if subTestImps, ok := l.subdirTestImports[args.Rel]; ok {
		testImports = append(testImports, subTestImps...)
		delete(l.subdirTestImports, args.Rel)
	}

	// Create new rules that match existing ones, so gazelle's merge can
	// properly preserve # keep entries in the existing BUILD file.
	var genRules []*rule.Rule
	var genImports []interface{}

	for _, r := range args.File.Rules {
		switch r.Kind() {
		case KindFormatjsCompile:
			newRule := rule.NewRule(r.Kind(), r.Name())
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
	return strings.HasSuffix(name, ".ts") || strings.HasSuffix(name, ".tsx")
}

// findParentPackage walks up from rel to find the nearest directory with a BUILD file.
func findParentPackage(repoRoot, rel string) string {
	for rel != "" && rel != "." {
		rel = filepath.Dir(rel)
		for _, name := range []string{"BUILD.bazel", "BUILD"} {
			if _, err := os.Stat(filepath.Join(repoRoot, rel, name)); err == nil {
				return rel
			}
		}
	}
	return ""
}

func isTestFile(name string) bool {
	return strings.Contains(name, ".test.ts") ||
		strings.Contains(name, ".test.tsx") ||
		strings.HasPrefix(name, "tests/") ||
		strings.HasPrefix(name, "test/")
}

