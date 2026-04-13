package ts

import (
	"flag"
	"path/filepath"
	"strings"

	"github.com/bazelbuild/bazel-gazelle/config"
	"github.com/bazelbuild/bazel-gazelle/rule"
)

// tsConfig holds per-directory configuration for the formatjs TS gazelle plugin.
type tsConfig struct {
	enabled     bool   // Whether this plugin is active for this directory
	packageType string // "internal" (default) or "npm_package"
	skipTest    bool   // Whether to skip test generation
}

func newTsConfig() *tsConfig {
	return &tsConfig{
		enabled:     true,
		packageType: "internal",
		skipTest:    false,
	}
}

func (c *tsConfig) clone() *tsConfig {
	return &tsConfig{
		enabled:     c.enabled,
		packageType: c.packageType,
		skipTest:    c.skipTest,
	}
}

// RegisterFlags implements language.Language.
func (l *tsLang) RegisterFlags(fs *flag.FlagSet, cmd string, c *config.Config) {}

// CheckFlags implements language.Language.
func (l *tsLang) CheckFlags(fs *flag.FlagSet, c *config.Config) error { return nil }

// KnownDirectives implements language.Language.
func (l *tsLang) KnownDirectives() []string {
	return []string{
		"formatjs_enabled",
		"formatjs_package_type",
		"formatjs_skip_test",
	}
}

// Configure implements language.Language.
func (l *tsLang) Configure(c *config.Config, rel string, f *rule.File) {
	// Get or create config for this directory
	var cfg *tsConfig
	if raw, ok := c.Exts[languageName]; ok {
		cfg = raw.(*tsConfig).clone()
	} else {
		cfg = newTsConfig()
	}

	if f != nil {
		for _, d := range f.Directives {
			switch d.Key {
			case "formatjs_enabled":
				cfg.enabled = d.Value == "true"
			case "formatjs_package_type":
				cfg.packageType = d.Value
			case "formatjs_skip_test":
				cfg.skipTest = d.Value == "true"
			}
		}
	}

	c.Exts[languageName] = cfg
}

// isUnderPackagesDir checks if a relative path is under the packages/ directory.
func isUnderPackagesDir(rel string) bool {
	return strings.HasPrefix(rel, "packages/") || strings.HasPrefix(filepath.ToSlash(rel), "packages/")
}
