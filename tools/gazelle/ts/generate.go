// generate.go implements the GenerateRules phase of Gazelle's pipeline.
//
// For each directory, it:
//  1. Checks if the plugin is enabled for this directory
//  2. Scans all .ts/.tsx files and extracts import statements via the oxc subprocess
//  3. Partitions files into source files and test files
//  4. Generates formatjs_library rule (if source files exist) with srcs + visibility
//  5. Generates formatjs_test rule (if test files exist) with srcs
//  6. Attaches ImportData to each generated rule for later resolution in Resolve()
package ts

import (
	"path/filepath"
	"sort"
	"strings"

	"github.com/bazelbuild/bazel-gazelle/language"
	"github.com/bazelbuild/bazel-gazelle/rule"
)

// ImportData carries parsed import statements from GenerateRules to Resolve.
// Gazelle's architecture requires this two-phase approach because GenerateRules
// runs during the directory walk (before the full RuleIndex is built), while
// Resolve runs after all directories have been scanned and the RuleIndex is complete.
//
// The separation of Imports vs TestImports matters because:
//   - Source imports become deps + project_references on formatjs_library
//   - Test imports become deps on formatjs_test
//   - Source imports are also passed to formatjs_test so @formatjs_generated/* deps
//     can be added (js_library doesn't transitively link npm packages)
type ImportData struct {
	Imports     []ImportStatement // Source file imports
	TestImports []ImportStatement // Test file imports
}

// GenerateRules is called by Gazelle for each directory during the "generate" phase.
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
	var tsFiles []string
	for _, f := range args.RegularFiles {
		if isTypeScriptFile(f) {
			tsFiles = append(tsFiles, filepath.Join(args.Dir, f))
		}
	}

	var sourceImports, testImports []ImportStatement
	if len(tsFiles) > 0 {
		allImports, _ := l.extractImportsBatch(tsFiles)
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

	// Phase 3: Generate rules.
	var genRules []*rule.Rule
	var genImports []interface{}

	if len(libSrcs) > 0 {
		newRule := rule.NewRule(KindFormatjsLibrary, "dist")
		newRule.SetAttr("srcs", libSrcs)
		newRule.SetAttr("visibility", []string{"//visibility:public"})
		genRules = append(genRules, newRule)
		genImports = append(genImports, ImportData{
			Imports: sourceImports,
		})
	}

	if len(testSrcs) > 0 {
		newRule := rule.NewRule(KindFormatjsTest, "unit_test")
		newRule.SetAttr("srcs", testSrcs)
		genRules = append(genRules, newRule)
		genImports = append(genImports, ImportData{
			Imports:     sourceImports,
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
