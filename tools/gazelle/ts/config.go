package ts

import (
	"flag"

	"github.com/bazelbuild/bazel-gazelle/config"
	"github.com/bazelbuild/bazel-gazelle/rule"
)

// tsConfig holds per-directory configuration for the formatjs TS gazelle plugin.
type tsConfig struct {
	enabled bool // Whether this plugin is active for this directory
}

func newTsConfig() *tsConfig {
	return &tsConfig{
		enabled: true,
	}
}

func (c *tsConfig) clone() *tsConfig {
	return &tsConfig{
		enabled: c.enabled,
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
			}
		}
	}

	c.Exts[languageName] = cfg
}
