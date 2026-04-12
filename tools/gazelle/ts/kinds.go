package ts

import "github.com/bazelbuild/bazel-gazelle/rule"

const (
	KindFormatjsCompile = "formatjs_compile"
	KindFormatjsTest    = "formatjs_test"
	KindTsCompile       = "ts_compile"
)

var tsKinds = map[string]rule.KindInfo{
	KindFormatjsCompile: {
		NonEmptyAttrs:  map[string]bool{"name": true},
		MergeableAttrs: map[string]bool{"srcs": true},
		ResolveAttrs: map[string]bool{
			"deps":               true,
			"project_references": true,
		},
	},
	KindFormatjsTest: {
		NonEmptyAttrs: map[string]bool{"name": true},
		ResolveAttrs: map[string]bool{
			"deps":                    true,
			"project_references":      true,
			"test_deps":               true,
			"test_project_references": true,
		},
	},
	// ts_compile rules are internal-only packages (ecma402-abstract, ecma262-abstract).
	// We register them so they appear in the RuleIndex for project_references resolution.
	KindTsCompile: {
		NonEmptyAttrs: map[string]bool{"name": true},
	},
}
