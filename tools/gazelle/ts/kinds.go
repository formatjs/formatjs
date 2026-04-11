package ts

import "github.com/bazelbuild/bazel-gazelle/rule"

const (
	KindFormatjsCompile = "formatjs_compile"
	KindFormatjsTest    = "formatjs_test"
)

var tsKinds = map[string]rule.KindInfo{
	KindFormatjsCompile: {
		NonEmptyAttrs: map[string]bool{"name": true},
		ResolveAttrs: map[string]bool{
			"deps":               true,
			"project_references": true,
		},
	},
	KindFormatjsTest: {
		NonEmptyAttrs: map[string]bool{"name": true},
		ResolveAttrs: map[string]bool{
			"deps":                     true,
			"project_references":       true,
			"test_deps":                true,
			"test_project_references":  true,
		},
	},
}
