// imports.go determines what each rule provides to the RuleIndex.
//
// This is called during the "index" phase for every rule in every BUILD file.
// The returned ImportSpecs are stored in a reverse index that maps import paths
// to Bazel labels. Later, during Resolve(), we query this index to find which
// rule provides a given import.
package ts

import (
	"github.com/bazelbuild/bazel-gazelle/config"
	"github.com/bazelbuild/bazel-gazelle/resolve"
	"github.com/bazelbuild/bazel-gazelle/rule"
)

// Imports returns the import specs that a rule provides, used to build the RuleIndex.
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

	pkg := f.Pkg
	return []resolve.ImportSpec{
		{Lang: languageName, Imp: pkg},
		{Lang: languageName, Imp: pkg + "/*"},
	}
}
