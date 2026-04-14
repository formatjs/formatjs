// lifecycle.go manages the parser subprocess lifecycle.
//
// The lifeCycleManager implements Gazelle's LifecycleManager interface to
// properly start and stop the Rust subprocess (crates/ts_import_extractor)
// that parses TypeScript files. This replaces the previous global singleton
// pattern (sync.Once) with proper lifecycle hooks.
//
// Timeline:
//   - Before():              Spawns the Rust subprocess
//   - GenerateRules():       Uses the subprocess to parse files (via l.parser)
//   - DoneGeneratingRules(): Shuts down the subprocess
//   - AfterResolvingDeps():  No-op
package ts

import (
	"context"
	"log"

	"github.com/bazelbuild/bazel-gazelle/language"
)

// lifeCycleManager manages the parser subprocess lifecycle.
// It embeds BaseLifecycleManager for forward compatibility with new hooks.
type lifeCycleManager struct {
	language.BaseLifecycleManager
	parser *OxcParser
}

// Before is called once at plugin startup. It spawns the Rust subprocess.
func (l *lifeCycleManager) Before(ctx context.Context) {
	p, err := newOxcParser()
	if err != nil {
		log.Printf("formatjs_ts: oxc parser unavailable: %v", err)
		return
	}
	l.parser = p
}

// DoneGeneratingRules is called after all directories have been scanned.
// It shuts down the Rust subprocess.
func (l *lifeCycleManager) DoneGeneratingRules() {
	if l.parser != nil {
		if err := l.parser.Close(); err != nil {
			log.Printf("formatjs_ts: oxc parser shutdown error: %v", err)
		}
		l.parser = nil
	}
}

// AfterResolvingDeps is called after all dependencies have been resolved. No-op.
func (l *lifeCycleManager) AfterResolvingDeps(ctx context.Context) {}
