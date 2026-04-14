// configure.go implements the Gazelle Configurer interface for the formatjs TS plugin.
//
// This handles per-directory configuration by reading BUILD file directives and
// managing the config inheritance chain. The actual config data struct lives in config.go.
package ts

import (
	"flag"

	"github.com/bazelbuild/bazel-gazelle/config"
	"github.com/bazelbuild/bazel-gazelle/rule"
)

// RegisterFlags is a no-op — we don't support command-line flags.
// All configuration is via BUILD file directives.
func (l *tsLang) RegisterFlags(fs *flag.FlagSet, cmd string, c *config.Config) {}

// CheckFlags is a no-op — no flags to validate.
func (l *tsLang) CheckFlags(fs *flag.FlagSet, c *config.Config) error { return nil }

// KnownDirectives returns the list of BUILD file directives this plugin recognizes.
// Gazelle ignores directives not in this list (they may belong to other plugins).
//
// Supported directives:
//
//	# gazelle:formatjs_enabled true|false
//	    Enable or disable the plugin for this directory and its children.
//	    Default: true (inherited from parent, or true at repo root).
func (l *tsLang) KnownDirectives() []string {
	return []string{
		"formatjs_enabled",
	}
}

// Configure is called by Gazelle for each directory during the walk.
// It builds up per-directory configuration by:
//  1. Cloning the parent directory's config (or creating a new default)
//  2. Applying any BUILD file directives found in this directory
//  3. Storing the result in c.Exts[languageName] for GenerateRules to read
//
// The config inheritance chain means a single directive in a parent BUILD file
// affects all descendant directories until overridden.
//
// At the repo root (rel == ""), this also loads the package.json data
// that is needed for import resolution.
func (l *tsLang) Configure(c *config.Config, rel string, f *rule.File) {
	// Clone parent config or create default.
	var cfg *tsConfig
	if raw, ok := c.Exts[languageName]; ok {
		cfg = raw.(*tsConfig).clone()
	} else {
		cfg = newTsConfig()
	}

	// Apply directives from the BUILD file in this directory.
	if f != nil {
		for _, d := range f.Directives {
			switch d.Key {
			case "formatjs_enabled":
				cfg.enabled = d.Value == "true"
			}
		}
	}

	c.Exts[languageName] = cfg

	// Load package.json data at the repo root for import resolution.
	if rel == "" {
		l.loadPackageJSONDeps(c.RepoRoot)
	}
}
