package ts

import (
	"github.com/bazelbuild/bazel-gazelle/config"
	"github.com/bazelbuild/bazel-gazelle/rule"
)

// Fix performs post-processing on BUILD files after merge. Currently a no-op.
func (l *tsLang) Fix(c *config.Config, f *rule.File) {}
