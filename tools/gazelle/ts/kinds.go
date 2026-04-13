// kinds.go defines the Bazel rule types that this gazelle plugin manages
// and how Gazelle's merge engine should handle them.
//
// Gazelle's merge engine uses KindInfo to decide how to reconcile generated
// rules with existing BUILD file content. The three key field types are:
//
//   - NonEmptyAttrs:  attrs that must be non-empty or the rule is deleted
//   - MergeableAttrs: attrs that are merged (union) rather than replaced;
//                     entries marked with "# keep" in the BUILD file are preserved
//   - ResolveAttrs:   attrs that are set by the Resolve phase (replace existing values)
//
// Attrs NOT in any of these sets are left untouched if we don't set them in
// GenerateRules, or overwritten if we do. This is how manually-set attrs like
// entry_points, types, npm_package_name, etc. survive gazelle runs.
package ts

import "github.com/bazelbuild/bazel-gazelle/rule"

const (
	// KindFormatjsLibrary is the main TypeScript compilation rule.
	// Defined in //tools:compile.bzl — handles type checking, transpilation,
	// bundling, and npm packaging for both published and internal packages.
	KindFormatjsLibrary = "formatjs_library"

	// KindFormatjsTest is the test execution rule.
	// Defined in //tools:test.bzl — wraps vitest with auto :lib dependency
	// and fixture discovery.
	KindFormatjsTest = "formatjs_test"

	// KindTsCompile is a legacy internal-only compilation rule.
	// Defined in //tools:index.bzl — used by ecma402-abstract and ecma262-abstract
	// before they were migrated to formatjs_library. We still register it in the
	// RuleIndex so existing ts_compile rules can be found during project_references
	// resolution.
	KindTsCompile = "ts_compile"
)

// tsKinds defines the merge behavior for each rule type.
//
// For formatjs_library:
//   - "name" must be non-empty (otherwise the rule is deleted during merge)
//   - "srcs" is mergeable: gazelle generates the full list, but entries with
//     "# keep" comments in the existing BUILD file are preserved even if gazelle
//     wouldn't have generated them (useful for generated files like *.generated.ts)
//   - "deps" and "project_references" are resolve attrs: they are set by Resolve()
//     after import analysis, completely replacing existing values each run
//
// For formatjs_test:
//   - Same as formatjs_library but only "deps" is resolved (no project_references)
//
// For ts_compile:
//   - Only "name" matters — we register it in the RuleIndex (via Imports())
//     but don't generate or update these rules
var tsKinds = map[string]rule.KindInfo{
	KindFormatjsLibrary: {
		NonEmptyAttrs:  map[string]bool{"name": true},
		MergeableAttrs: map[string]bool{"srcs": true},
		ResolveAttrs: map[string]bool{
			"deps":               true,
			"project_references": true,
		},
	},
	KindFormatjsTest: {
		NonEmptyAttrs:  map[string]bool{"name": true},
		MergeableAttrs: map[string]bool{"srcs": true},
		ResolveAttrs: map[string]bool{
			"deps": true,
		},
	},
	KindTsCompile: {
		NonEmptyAttrs: map[string]bool{"name": true},
	},
}
