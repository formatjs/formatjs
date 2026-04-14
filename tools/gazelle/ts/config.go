// config.go defines the per-directory configuration data struct for the formatjs TS plugin.
//
// The Gazelle interface methods (RegisterFlags, CheckFlags, KnownDirectives, Configure)
// that populate this config live in configure.go.
package ts

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
