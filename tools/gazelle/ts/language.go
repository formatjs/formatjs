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
//  1. GenerateRules (this file): Scan .ts/.tsx files, extract imports, create/update rules
//  2. Imports (this file):       Register rules in the RuleIndex so other packages can find them
//  3. Resolve (resolve.go):      Convert parsed imports into Bazel dep labels
//
// The plugin uses tree-sitter (parser.go) to parse TypeScript files and extract import
// statements, which are then resolved to Bazel labels in the Resolve phase.
//
// Configuration is per-directory via BUILD file directives (config.go):
//
//	# gazelle:formatjs_enabled false   ← disable plugin for a directory
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

// languageName is the unique identifier for this Gazelle extension.
// It is used as the key in config.Config.Exts and in resolve.ImportSpec.Lang
// so that Gazelle can route import resolution to the correct plugin.
const languageName = "formatjs_ts"

// tsLang implements the language.Language interface from Gazelle.
// It is stateless — all per-directory state lives in tsConfig (config.go)
// and all per-run state lives in package-level vars (resolve.go).
type tsLang struct{}

// NewLanguage creates a new formatjs TypeScript language extension.
// Called once by Gazelle at startup when the plugin is loaded.
func NewLanguage() language.Language {
	return &tsLang{}
}

func (l *tsLang) Name() string { return languageName }

// Kinds tells Gazelle which rule types this plugin manages and how to merge them.
// See kinds.go for the KindInfo definitions that control merge behavior.
func (l *tsLang) Kinds() map[string]rule.KindInfo {
	return tsKinds
}

// Loads declares the .bzl files that provide the rule kinds we generate.
// Gazelle uses this to add the correct load() statements at the top of BUILD files
// when it creates new rules. For example, if we generate a formatjs_library rule,
// Gazelle adds: load("//tools:compile.bzl", "formatjs_library")
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

// Fix performs post-processing on BUILD files after merge. Currently a no-op.
// This could be used for validation or cleanup after Gazelle merges generated
// rules with existing BUILD file content.
func (l *tsLang) Fix(c *config.Config, f *rule.File) {}

// ImportData carries parsed import statements from GenerateRules to Resolve.
// Gazelle's architecture requires this two-phase approach because GenerateRules
// runs during the directory walk (before the full RuleIndex is built), while
// Resolve runs after all directories have been scanned and the RuleIndex is complete.
//
// The separation of Imports vs TestImports matters because:
//   - Source imports become deps + project_references on formatjs_library
//   - Test imports become deps on formatjs_test (source deps are transitive via :lib)
type ImportData struct {
	Imports     []ImportStatement // Source file imports
	TestImports []ImportStatement // Test file imports
}

// Imports returns the import specs that a rule provides, used to build the RuleIndex.
//
// This is called during the "index" phase for every rule in every BUILD file.
// The returned ImportSpecs are stored in a reverse index that maps import paths
// to Bazel labels. Later, during Resolve(), we query this index to find which
// rule provides a given import.
//
// For a rule at //packages/ecma402-abstract/NumberFormat, we register:
//   - "packages/ecma402-abstract/NumberFormat"   (exact match)
//   - "packages/ecma402-abstract/NumberFormat/*"  (wildcard for subpath imports)
//
// This allows imports like:
//   - #packages/ecma402-abstract/NumberFormat/ToRawFixed.js → //packages/ecma402-abstract/NumberFormat
//   - #packages/ecma402-abstract/NumberFormat               → //packages/ecma402-abstract/NumberFormat
//
// Only formatjs_library and ts_compile rules provide imports — formatjs_test
// rules don't export reusable modules.
func (l *tsLang) Imports(c *config.Config, r *rule.Rule, f *rule.File) []resolve.ImportSpec {
	if r.Kind() != KindFormatjsLibrary && r.Kind() != KindTsCompile {
		return nil
	}

	// f.Pkg is the full Bazel package path (e.g., "packages/ecma402-abstract/NumberFormat").
	// We register both exact and wildcard specs so that deep imports like
	// #packages/ecma402-abstract/NumberFormat/ToRawFixed.js resolve correctly
	// via the walk-up logic in resolveSubpathImport (resolve.go).
	pkg := f.Pkg
	return []resolve.ImportSpec{
		{Lang: languageName, Imp: pkg},
		{Lang: languageName, Imp: pkg + "/*"},
	}
}

// Embeds returns empty — TypeScript doesn't use Bazel's rule embedding mechanism.
// Embedding allows one rule to inherit the imports of another; we handle dependencies
// through TypeScript's import system instead.
func (l *tsLang) Embeds(r *rule.Rule, from label.Label) []label.Label { return nil }

// GenerateRules is called by Gazelle for each directory during the "generate" phase.
//
// This is the main entry point for the plugin. For each directory, it:
//  1. Checks if the plugin is enabled for this directory (via formatjs_enabled directive)
//  2. Scans all .ts/.tsx files and extracts import statements using tree-sitter
//  3. Partitions files into source files and test files
//  4. Generates formatjs_library rule (if source files exist) with srcs + visibility
//  5. Generates formatjs_test rule (if test files exist) with srcs
//  6. Attaches ImportData to each generated rule for later resolution in Resolve()
//
// The generated rules are merged with existing BUILD file content by Gazelle's merge
// engine. The merge behavior is controlled by KindInfo in kinds.go:
//   - MergeableAttrs (srcs):             merged with existing, preserving "# keep" entries
//   - ResolveAttrs (deps, project_refs): set by Resolve(), replacing existing values
//   - Other attrs (visibility, etc.):    set here, overwriting existing values
//   - Unset attrs:                       preserved from existing BUILD file
//
// This means manually-set attrs like entry_points, types, npm_package_name, etc.
// survive gazelle runs because we don't set them on the generated rule.
func (l *tsLang) GenerateRules(args language.GenerateArgs) language.GenerateResult {
	cfg, ok := args.Config.Exts[languageName].(*tsConfig)
	if !ok || !cfg.enabled {
		return language.GenerateResult{}
	}

	// Phase 1: Collect all TypeScript files and partition into source/test srcs.
	libSrcs, testSrcs := collectSrcs(args.RegularFiles)

	// Phase 2: Batch-parse all TypeScript files in one subprocess call.
	// This is much more efficient than per-file calls: one round-trip to the
	// Rust subprocess, which uses rayon to parse files in parallel.
	var tsFiles []string
	for _, f := range args.RegularFiles {
		if isTypeScriptFile(f) {
			tsFiles = append(tsFiles, filepath.Join(args.Dir, f))
		}
	}

	var sourceImports, testImports []ImportStatement
	if len(tsFiles) > 0 {
		allImports, _ := extractImportsBatch(tsFiles)
		for _, f := range args.RegularFiles {
			if !isTypeScriptFile(f) {
				continue
			}
			fullPath := filepath.Join(args.Dir, f)
			imps := allImports[fullPath]
			if isTestFile(f) {
				testImports = append(testImports, imps...)
			} else {
				sourceImports = append(sourceImports, imps...)
			}
		}
	}

	// Early return if no TypeScript files at all — don't generate empty rules.
	if len(libSrcs) == 0 && len(testSrcs) == 0 {
		return language.GenerateResult{}
	}

	// Phase 3: Generate rules. We always generate the rules we want and let
	// Gazelle's merge handle reconciliation with existing BUILD file content.
	// This is simpler than iterating existing rules — the merge engine handles:
	//   - Matching generated rules to existing rules by kind + name
	//   - Preserving "# keep" entries in MergeableAttrs (srcs)
	//   - Keeping attrs we don't set (entry_points, types, npm_package_name, etc.)
	var genRules []*rule.Rule
	var genImports []interface{}

	// Generate formatjs_library for source files.
	// All formatjs_library rules are public since any package in the monorepo
	// may depend on any other via #packages/* imports.
	if len(libSrcs) > 0 {
		newRule := rule.NewRule(KindFormatjsLibrary, "dist")
		newRule.SetAttr("srcs", libSrcs)
		newRule.SetAttr("visibility", []string{"//visibility:public"})
		genRules = append(genRules, newRule)
		genImports = append(genImports, ImportData{
			Imports: sourceImports,
		})
	}

	// Generate formatjs_test for test files.
	// The formatjs_test macro auto-depends on :lib from the same package's
	// formatjs_library, so test code gets source deps transitively.
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

// isTypeScriptFile returns true for .ts and .tsx files.
func isTypeScriptFile(name string) bool {
	return strings.HasSuffix(name, ".ts") || strings.HasSuffix(name, ".tsx")
}

// isTestFile returns true for files that should be treated as test code.
// Test files are partitioned separately from source files because:
//   - Their imports go into formatjs_test deps (not formatjs_library deps)
//   - The formatjs_test macro provides source deps transitively via :lib
//
// A file is a test file if it:
//   - Contains ".test.ts" or ".test.tsx" in its name (e.g., utils.test.ts)
//   - Lives under a "tests/" or "test/" directory (e.g., tests/format.test.ts)
func isTestFile(name string) bool {
	return strings.Contains(name, ".test.ts") ||
		strings.Contains(name, ".test.tsx") ||
		strings.HasPrefix(name, "tests/") ||
		strings.HasPrefix(name, "test/")
}

// collectSrcs partitions args.RegularFiles into source and test file lists.
//
// Source files: .ts/.tsx files that aren't test files.
// Test files:   .ts/.tsx files AND .json files under tests/ directories.
//               JSON files are included because tests often import locale data
//               fixtures (e.g., tests/locale-data/en.json).
//
// The formatjs_test macro internally separates fixture files from test srcs,
// so we include all test-directory files here and let the macro sort them out.
//
// Both lists are sorted for deterministic BUILD file output.
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
