package ts

import (
	"encoding/json"
	"fmt"
	"os"
	"strings"
	"sync"

	"github.com/bazelbuild/bazel-gazelle/config"
	"github.com/bazelbuild/bazel-gazelle/label"
	"github.com/bazelbuild/bazel-gazelle/repo"
	"github.com/bazelbuild/bazel-gazelle/resolve"
	"github.com/bazelbuild/bazel-gazelle/rule"
)

// Cached package.json dependencies, loaded once per run.
var (
	packageDeps     map[string]bool
	packageDepsOnce sync.Once
)

// nodeBuiltinModules that resolve to @types/node instead of npm packages.
var nodeBuiltinModules = map[string]bool{
	"assert": true, "buffer": true, "child_process": true, "cluster": true,
	"crypto": true, "dgram": true, "dns": true, "events": true, "fs": true,
	"http": true, "http2": true, "https": true, "module": true, "net": true,
	"os": true, "path": true, "process": true, "querystring": true,
	"readline": true, "stream": true, "string_decoder": true, "timers": true,
	"tls": true, "tty": true, "url": true, "util": true, "v8": true,
	"vm": true, "worker_threads": true, "zlib": true, "console": true,
	"perf_hooks": true, "async_hooks": true, "diagnostics_channel": true,
	"inspector": true, "test": true, "trace_events": true, "wasi": true,
}

type packageJSON struct {
	Dependencies         map[string]string `json:"dependencies"`
	DevDependencies      map[string]string `json:"devDependencies"`
	OptionalDependencies map[string]string `json:"optionalDependencies"`
}

// resolvedDeps holds separated internal and external dependencies.
type resolvedDeps struct {
	internal []string // //packages/* labels → project_references
	external []string // //:node_modules/* labels → deps
}

// Resolve converts imports into Bazel dependency labels.
func (l *tsLang) Resolve(
	c *config.Config,
	ix *resolve.RuleIndex,
	rc *repo.RemoteCache,
	r *rule.Rule,
	rawImportData interface{},
	from label.Label,
) {
	loadPackageJSONDeps(c.RepoRoot)

	importData, ok := rawImportData.(ImportData)
	if !ok {
		return
	}

	kind := r.Kind()

	switch kind {
	case KindFormatjsLibrary:
		// Resolve source imports into deps + project_references
		resolved := resolveImportsToDeps(importData.Imports, from, ix)

		if len(resolved.external) > 0 {
			r.SetAttr("deps", deduplicateAndSort(resolved.external))
		} else {
			r.DelAttr("deps")
		}

		if len(resolved.internal) > 0 {
			r.SetAttr("project_references", deduplicateAndSort(resolved.internal))
		} else {
			r.DelAttr("project_references")
		}

	case KindFormatjsTest:
		// Resolve test imports into a single deps attr.
		// Source deps are provided transitively via :lib.
		testResolved := resolveImportsToDeps(importData.TestImports, from, ix)
		allDeps := append(testResolved.external, testResolved.internal...)

		if len(allDeps) > 0 {
			r.SetAttr("deps", deduplicateAndSort(allDeps))
		} else {
			r.DelAttr("deps")
		}
	}
}

// resolveImportsToDeps converts import statements to labeled deps.
func resolveImportsToDeps(imports []ImportStatement, from label.Label, ix *resolve.RuleIndex) resolvedDeps {
	result := resolvedDeps{}
	seen := make(map[string]bool)

	for _, imp := range imports {
		if seen[imp.ImportPath] {
			continue
		}
		seen[imp.ImportPath] = true

		importPath := imp.ImportPath

		// Skip relative imports
		if strings.HasPrefix(importPath, ".") {
			continue
		}

		// Handle #packages/* imports (Node.js subpath imports)
		if strings.HasPrefix(importPath, "#packages/") {
			target := resolvePackagesImport(importPath, from, ix)
			if target != "" {
				result.internal = append(result.internal, target)
			}
			continue
		}

		// Handle node: builtins
		modulePath := strings.TrimPrefix(importPath, "node:")
		baseModule := strings.Split(modulePath, "/")[0]
		if nodeBuiltinModules[baseModule] {
			result.external = append(result.external, "//:node_modules/@types/node")
			continue
		}

		// Handle npm package imports
		npmLabel := resolveNpmImport(importPath)
		if npmLabel != "" {
			result.external = append(result.external, npmLabel)

			// Auto-add @types if exists
			pkgName := strings.TrimPrefix(npmLabel, "//:node_modules/")
			if typesLabel := getTypesPackage(pkgName); typesLabel != "" {
				result.external = append(result.external, typesLabel)
			}
		}
	}

	result.internal = deduplicateAndSort(result.internal)
	result.external = deduplicateAndSort(result.external)
	return result
}

// resolvePackagesImport resolves #packages/ecma402-abstract/types/number.js
// to //packages/ecma402-abstract/types by walking up the directory tree.
func resolvePackagesImport(importPath string, from label.Label, ix *resolve.RuleIndex) string {
	// Strip #packages/ prefix and .js/.ts extension
	path := strings.TrimPrefix(importPath, "#packages/")
	for _, ext := range []string{".js", ".ts", ".tsx", ".jsx"} {
		path = strings.TrimSuffix(path, ext)
	}

	parts := strings.Split(path, "/")

	// Walk up from most specific to least specific
	for i := len(parts); i > 0; i-- {
		testPath := "packages/" + strings.Join(parts[:i], "/")

		// Skip self-references
		if testPath == from.Pkg {
			return ""
		}

		// Check RuleIndex for exact match
		results := ix.FindRulesByImportWithConfig(
			nil,
			resolve.ImportSpec{Lang: languageName, Imp: testPath},
			languageName,
		)
		if len(results) > 0 {
			return "//" + testPath
		}

		// Check wildcard match
		results = ix.FindRulesByImportWithConfig(
			nil,
			resolve.ImportSpec{Lang: languageName, Imp: testPath + "/*"},
			languageName,
		)
		if len(results) > 0 {
			return "//" + testPath
		}
	}

	return ""
}

// resolveNpmImport converts an import path to a //:node_modules/<pkg> label.
func resolveNpmImport(importPath string) string {
	var pkgName string
	if strings.HasPrefix(importPath, "@") {
		parts := strings.SplitN(importPath, "/", 3)
		if len(parts) < 2 {
			return ""
		}
		pkgName = parts[0] + "/" + parts[1]
	} else {
		parts := strings.SplitN(importPath, "/", 2)
		pkgName = parts[0]
	}

	if packageDeps[pkgName] {
		return "//:node_modules/" + pkgName
	}

	// Check if only @types exists
	if !strings.HasPrefix(pkgName, "@") {
		if packageDeps["@types/"+pkgName] {
			return "//:node_modules/@types/" + pkgName
		}
	}

	// Package not found in package.json — skip to avoid generating
	// references to non-existent Bazel targets.
	return ""
}

// getTypesPackage returns the @types label if it exists for a package.
// For scoped packages like @babel/core, the DefinitelyTyped convention
// is @types/babel__core (scope stripped, / replaced with __).
func getTypesPackage(pkgName string) string {
	var typesName string
	if strings.HasPrefix(pkgName, "@") {
		// @babel/core → @types/babel__core
		withoutAt := strings.TrimPrefix(pkgName, "@")
		typesName = "@types/" + strings.Replace(withoutAt, "/", "__", 1)
	} else {
		typesName = "@types/" + pkgName
	}
	if packageDeps[typesName] {
		return "//:node_modules/" + typesName
	}
	return ""
}

func loadPackageJSONDeps(repoRoot string) {
	packageDepsOnce.Do(func() {
		packageDeps = make(map[string]bool)
		data, err := os.ReadFile(repoRoot + "/package.json")
		if err != nil {
			return
		}
		var pkg packageJSON
		if err := json.Unmarshal(data, &pkg); err != nil {
			return
		}
		for dep := range pkg.Dependencies {
			packageDeps[dep] = true
		}
		for dep := range pkg.DevDependencies {
			packageDeps[dep] = true
		}
		for dep := range pkg.OptionalDependencies {
			packageDeps[dep] = true
		}
	})
}

func toSet(items []string) map[string]bool {
	m := make(map[string]bool, len(items))
	for _, item := range items {
		m[item] = true
	}
	return m
}

func deduplicateAndSort(items []string) []string {
	if len(items) == 0 {
		return nil
	}
	seen := make(map[string]bool)
	result := make([]string, 0, len(items))
	for _, item := range items {
		if !seen[item] {
			result = append(result, item)
			seen[item] = true
		}
	}
	// Sort for deterministic output
	for i := 0; i < len(result); i++ {
		for j := i + 1; j < len(result); j++ {
			if result[j] < result[i] {
				result[i], result[j] = result[j], result[i]
			}
		}
	}
	return result
}

// Unused but kept for debugging.
func debugLog(format string, args ...interface{}) {
	if os.Getenv("FORMATJS_GAZELLE_DEBUG") != "" {
		fmt.Fprintf(os.Stderr, format, args...)
	}
}
