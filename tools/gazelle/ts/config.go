// config.go implements per-directory configuration for the formatjs TS gazelle plugin.
//
// Configuration is inherited from parent directories and can be overridden via
// BUILD file directives. Currently supports one directive:
//
//	# gazelle:formatjs_enabled false
//
// This disables the plugin for a directory and all its subdirectories (unless
// re-enabled by a child directory's directive). Use this for directories that
// have custom build rules and shouldn't get auto-generated formatjs_library
// or formatjs_test targets.
package ts

import (
	"flag"

	"github.com/bazelbuild/bazel-gazelle/config"
	"github.com/bazelbuild/bazel-gazelle/rule"
)

// tsConfig holds per-directory configuration for the formatjs TS gazelle plugin.
// Gazelle calls Configure() for each directory during the walk, building up
// the config by cloning from the parent and applying local directives.
type tsConfig struct {
	// enabled controls whether this plugin generates/updates rules for a directory.
	// Defaults to true. Set to false via: # gazelle:formatjs_enabled false
	enabled bool
}

// newTsConfig creates a default configuration (plugin enabled).
func newTsConfig() *tsConfig {
	return &tsConfig{
		enabled: true,
	}
}

// clone creates a copy of the config for child directories.
// This ensures child directories inherit parent settings but can override them.
func (c *tsConfig) clone() *tsConfig {
	return &tsConfig{
		enabled: c.enabled,
	}
}

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
}
