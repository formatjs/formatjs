// resolve.go converts parsed TypeScript imports into Bazel dependency labels.
//
// This file implements the Resolve phase of Gazelle's pipeline. By this point:
//   - GenerateRules has already scanned files and attached ImportData to rules
//   - The RuleIndex has been built from all Imports() calls across the repo
//
// Resolve handles three categories of TypeScript imports:
//
//  1. Internal #packages/* imports → project_references (TypeScript project references)
//  2. Node.js built-in modules → //:node_modules/@types/node
//  3. npm package imports → //:node_modules/<pkg> (+ auto @types/<pkg> if exists)
package ts

import (
	"encoding/json"
	"os"
	"sort"
	"strings"

	"github.com/bazelbuild/bazel-gazelle/config"
	"github.com/bazelbuild/bazel-gazelle/label"
	"github.com/bazelbuild/bazel-gazelle/repo"
	"github.com/bazelbuild/bazel-gazelle/resolve"
	"github.com/bazelbuild/bazel-gazelle/rule"
)

// nodeBuiltinModules lists Node.js built-in modules that should resolve to
// @types/node instead of npm packages.
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

// packageJSON represents the fields we read from the root package.json.
type packageJSON struct {
	Imports              map[string]string `json:"imports"`
	Dependencies         map[string]string `json:"dependencies"`
	DevDependencies      map[string]string `json:"devDependencies"`
	OptionalDependencies map[string]string `json:"optionalDependencies"`
}

// resolvedDeps holds the two categories of resolved Bazel dependencies.
type resolvedDeps struct {
	internal []string // //packages/* labels → project_references
	external []string // //:node_modules/* labels → deps
}

// Resolve is called by Gazelle after GenerateRules for every generated rule.
// It reads the ImportData attached during GenerateRules and converts each import
// statement into a Bazel label, then sets the appropriate attributes on the rule.
func (l *tsLang) Resolve(
	c *config.Config,
	ix *resolve.RuleIndex,
	rc *repo.RemoteCache,
	r *rule.Rule,
	rawImportData interface{},
	from label.Label,
) {
	importData, ok := rawImportData.(ImportData)
	if !ok {
		return
	}

	kind := r.Kind()

	switch kind {
	case KindFormatjsLibrary:
		resolved := l.resolveImportsToDeps(importData.Imports, from, ix)

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
		testResolved := l.resolveImportsToDeps(importData.TestImports, from, ix)
		allDeps := append(testResolved.external, testResolved.internal...)

		if len(allDeps) > 0 {
			r.SetAttr("deps", deduplicateAndSort(allDeps))
		} else {
			r.DelAttr("deps")
		}
	}
}

// resolveImportsToDeps converts a list of import statements into categorized Bazel labels.
func (l *tsLang) resolveImportsToDeps(imports []ImportStatement, from label.Label, ix *resolve.RuleIndex) resolvedDeps {
	result := resolvedDeps{}
	seen := make(map[string]bool)

	for _, imp := range imports {
		if seen[imp.ImportPath] {
			continue
		}
		seen[imp.ImportPath] = true

		importPath := imp.ImportPath

		// Skip relative imports.
		if strings.HasPrefix(importPath, ".") {
			continue
		}

		// Handle Node.js subpath imports (#packages/* convention).
		if strings.HasPrefix(importPath, "#") {
			target := l.resolveSubpathImport(importPath, from, ix)
			if target != "" {
				result.internal = append(result.internal, target)
			}
			continue
		}

		// Handle @formatjs_generated/* imports (Bazel-linked generated packages).
		// These are not in the pnpm lockfile so resolveNpmImport won't find them.
		if strings.HasPrefix(importPath, "@formatjs_generated/") {
			parts := strings.SplitN(importPath, "/", 3) // @formatjs_generated, pkg, file
			if len(parts) >= 2 {
				result.external = append(result.external, "//:node_modules/@formatjs_generated/"+parts[1])
			}
			continue
		}

		// Handle Node.js built-in modules.
		modulePath := strings.TrimPrefix(importPath, "node:")
		baseModule := strings.Split(modulePath, "/")[0]
		if nodeBuiltinModules[baseModule] {
			result.external = append(result.external, "//:node_modules/@types/node")
			continue
		}

		// Handle npm package imports.
		npmLabel := l.resolveNpmImport(importPath)
		if npmLabel != "" {
			result.external = append(result.external, npmLabel)

			pkgName := strings.TrimPrefix(npmLabel, "//:node_modules/")
			if typesLabel := l.getTypesPackage(pkgName); typesLabel != "" {
				result.external = append(result.external, typesLabel)
			}
		}
	}

	result.internal = deduplicateAndSort(result.internal)
	result.external = deduplicateAndSort(result.external)
	return result
}

// resolveSubpathImport resolves a Node.js #-prefixed subpath import to a Bazel label.
func (l *tsLang) resolveSubpathImport(importPath string, from label.Label, ix *resolve.RuleIndex) string {
	var resolvedPath string
	for pattern, target := range l.subpathImportsMap {
		prefix := strings.TrimSuffix(pattern, "*")
		if strings.HasPrefix(importPath, prefix) {
			targetPrefix := strings.TrimSuffix(target, "*")
			targetPrefix = strings.TrimPrefix(targetPrefix, "./")
			resolvedPath = targetPrefix + strings.TrimPrefix(importPath, prefix)
			break
		}
	}
	if resolvedPath == "" {
		return ""
	}

	for _, ext := range []string{".js", ".ts", ".tsx", ".jsx"} {
		resolvedPath = strings.TrimSuffix(resolvedPath, ext)
	}

	parts := strings.Split(resolvedPath, "/")

	for i := len(parts); i > 0; i-- {
		testPath := strings.Join(parts[:i], "/")

		if testPath == from.Pkg {
			return ""
		}

		results := ix.FindRulesByImportWithConfig(
			nil,
			resolve.ImportSpec{Lang: languageName, Imp: testPath},
			languageName,
		)
		if len(results) > 0 {
			return "//" + testPath
		}

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

// resolveNpmImport converts an npm import path to a //:node_modules/<pkg> Bazel label.
func (l *tsLang) resolveNpmImport(importPath string) string {
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

	if l.packageDeps[pkgName] {
		return "//:node_modules/" + pkgName
	}

	// Fallback: check if only @types exists (for type-only imports).
	if !strings.HasPrefix(pkgName, "@") {
		if l.packageDeps["@types/"+pkgName] {
			return "//:node_modules/@types/" + pkgName
		}
	}

	return ""
}

// getTypesPackage returns the @types Bazel label if a DefinitelyTyped package exists.
func (l *tsLang) getTypesPackage(pkgName string) string {
	var typesName string
	if strings.HasPrefix(pkgName, "@") {
		withoutAt := strings.TrimPrefix(pkgName, "@")
		typesName = "@types/" + strings.Replace(withoutAt, "/", "__", 1)
	} else {
		typesName = "@types/" + pkgName
	}
	if l.packageDeps[typesName] {
		return "//:node_modules/" + typesName
	}
	return ""
}

// loadPackageJSONDeps reads the root package.json and populates the struct caches.
func (l *tsLang) loadPackageJSONDeps(repoRoot string) {
	if len(l.packageDeps) > 0 {
		return // already loaded
	}

	data, err := os.ReadFile(repoRoot + "/package.json")
	if err != nil {
		return
	}
	var pkg packageJSON
	if err := json.Unmarshal(data, &pkg); err != nil {
		return
	}
	for dep := range pkg.Dependencies {
		l.packageDeps[dep] = true
	}
	for dep := range pkg.DevDependencies {
		l.packageDeps[dep] = true
	}
	for dep := range pkg.OptionalDependencies {
		l.packageDeps[dep] = true
	}
	for k, v := range pkg.Imports {
		l.subpathImportsMap[k] = v
	}
}

// deduplicateAndSort removes duplicates and sorts a string slice alphabetically.
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
	sort.Strings(result)
	return result
}
