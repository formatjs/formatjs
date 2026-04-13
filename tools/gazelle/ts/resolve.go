// resolve.go converts parsed TypeScript imports into Bazel dependency labels.
//
// This file implements the Resolve phase of Gazelle's pipeline. By this point:
//   - GenerateRules has already scanned files and attached ImportData to rules
//   - The RuleIndex has been built from all Imports() calls across the repo
//
// Resolve handles three categories of TypeScript imports:
//
//  1. Internal #packages/* imports → project_references (TypeScript project references)
//     Example: #packages/ecma402-abstract/types/number.js → //packages/ecma402-abstract/types
//
//  2. Node.js built-in modules → //:node_modules/@types/node
//     Example: import fs from 'node:fs'
//
//  3. npm package imports → //:node_modules/<pkg> (+ auto @types/<pkg> if exists)
//     Example: import React from 'react' → //:node_modules/react + //:node_modules/@types/react
//
// Import resolution relies on the root package.json for:
//   - "imports" field: maps #packages/* to ./packages/* (Node.js subpath imports)
//   - "dependencies" / "devDependencies": validates that npm packages exist before adding deps
package ts

import (
	"encoding/json"
	"os"
	"sort"
	"strings"
	"sync"

	"github.com/bazelbuild/bazel-gazelle/config"
	"github.com/bazelbuild/bazel-gazelle/label"
	"github.com/bazelbuild/bazel-gazelle/repo"
	"github.com/bazelbuild/bazel-gazelle/resolve"
	"github.com/bazelbuild/bazel-gazelle/rule"
)

// Package-level caches, loaded once per gazelle run via sync.Once.
// These are populated from the root package.json on first access.
var (
	// packageDeps is a set of all npm package names found in the root package.json
	// (dependencies + devDependencies + optionalDependencies). Used to validate
	// that an npm import actually has a corresponding Bazel target before adding it.
	packageDeps map[string]bool

	// subpathImportsMap stores the "imports" field from root package.json.
	// Maps patterns like "#packages/*" → "./packages/*" for resolving internal imports.
	subpathImportsMap map[string]string

	packageDepsOnce sync.Once
)

// nodeBuiltinModules lists Node.js built-in modules that should resolve to
// @types/node instead of npm packages. Both bare (e.g., "fs") and prefixed
// (e.g., "node:fs") forms are handled — the "node:" prefix is stripped before lookup.
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
// They map to different rule attributes:
//   - internal → project_references on formatjs_library (TypeScript project references)
//   - external → deps on both formatjs_library and formatjs_test (npm packages)
//
// For formatjs_test, both internal and external go into a single deps attr
// because the test macro handles the distinction internally.
type resolvedDeps struct {
	internal []string // //packages/* labels → project_references
	external []string // //:node_modules/* labels → deps
}

// Resolve is called by Gazelle after GenerateRules for every generated rule.
// It reads the ImportData attached during GenerateRules and converts each import
// statement into a Bazel label, then sets the appropriate attributes on the rule.
//
// For formatjs_library rules:
//   - Source imports are split into deps (npm) and project_references (internal)
//   - If no deps/project_references, the attr is deleted to keep BUILD files clean
//
// For formatjs_test rules:
//   - All test imports (both npm and internal) go into a single deps attr
//   - Source deps come transitively via :lib (the formatjs_test macro auto-depends on it)
func (l *tsLang) Resolve(
	c *config.Config,
	ix *resolve.RuleIndex,
	rc *repo.RemoteCache,
	r *rule.Rule,
	rawImportData interface{},
	from label.Label,
) {
	// Load package.json data on first call (cached for subsequent calls).
	loadPackageJSONDeps(c.RepoRoot)

	importData, ok := rawImportData.(ImportData)
	if !ok {
		return
	}

	kind := r.Kind()

	switch kind {
	case KindFormatjsLibrary:
		// Resolve source imports into two separate attrs:
		// - deps: external npm packages (//:node_modules/*)
		// - project_references: internal packages (//packages/*)
		//
		// This separation matters because formatjs_library passes both to ts_project
		// but only project_references become TypeScript project references in tsconfig.
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
		// Both internal and external deps are combined because the formatjs_test
		// macro treats them uniformly — source deps are already provided
		// transitively via the :lib dependency (which the macro auto-adds).
		testResolved := resolveImportsToDeps(importData.TestImports, from, ix)
		allDeps := append(testResolved.external, testResolved.internal...)

		if len(allDeps) > 0 {
			r.SetAttr("deps", deduplicateAndSort(allDeps))
		} else {
			r.DelAttr("deps")
		}
	}
}

// resolveImportsToDeps converts a list of import statements into categorized Bazel labels.
//
// It processes imports in priority order:
//  1. Relative imports (./foo) → skipped (same-package, not a dep)
//  2. Subpath imports (#packages/*) → internal project_references
//  3. Node builtins (node:fs, fs) → //:node_modules/@types/node
//  4. npm packages (react, @babel/core) → //:node_modules/<pkg> + optional @types
//
// Deduplication happens at two levels:
//   - Per-import: seen map prevents processing the same import path twice
//   - Per-result: deduplicateAndSort on the final lists
func resolveImportsToDeps(imports []ImportStatement, from label.Label, ix *resolve.RuleIndex) resolvedDeps {
	result := resolvedDeps{}
	seen := make(map[string]bool)

	for _, imp := range imports {
		if seen[imp.ImportPath] {
			continue
		}
		seen[imp.ImportPath] = true

		importPath := imp.ImportPath

		// Skip relative imports — they reference files within the same Bazel package
		// and don't create cross-package dependencies.
		if strings.HasPrefix(importPath, ".") {
			continue
		}

		// Handle Node.js subpath imports (#packages/* convention).
		// These are internal monorepo imports defined in the root package.json "imports"
		// field. They resolve to Bazel project_references (TypeScript project references).
		//
		// Example: #packages/ecma402-abstract/types/number.js
		//   → resolves via "#packages/*" → "./packages/*"
		//   → walks up to find //packages/ecma402-abstract/types in RuleIndex
		//   → becomes project_references = ["//packages/ecma402-abstract/types"]
		if strings.HasPrefix(importPath, "#") {
			target := resolveSubpathImport(importPath, from, ix)
			if target != "" {
				result.internal = append(result.internal, target)
			}
			continue
		}

		// Handle Node.js built-in modules.
		// Both "node:fs" and bare "fs" are supported. These resolve to @types/node
		// for type checking (the runtime doesn't need a dep since Node provides them).
		modulePath := strings.TrimPrefix(importPath, "node:")
		baseModule := strings.Split(modulePath, "/")[0]
		if nodeBuiltinModules[baseModule] {
			result.external = append(result.external, "//:node_modules/@types/node")
			continue
		}

		// Handle npm package imports.
		// Only adds a dep if the package exists in the root package.json — this prevents
		// generating references to non-existent Bazel targets.
		npmLabel := resolveNpmImport(importPath)
		if npmLabel != "" {
			result.external = append(result.external, npmLabel)

			// Auto-add @types/<pkg> if it exists in package.json.
			// Many npm packages ship without types and need a separate @types package.
			// Example: react → also add @types/react
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

// resolveSubpathImport resolves a Node.js #-prefixed subpath import to a Bazel label.
//
// The resolution works in three steps:
//
// Step 1: Pattern matching against package.json "imports" field.
// The root package.json defines: { "imports": { "#packages/*": "./packages/*" } }
// So "#packages/ecma402-abstract/types/number.js" becomes "packages/ecma402-abstract/types/number"
//
// Step 2: Strip file extensions (.js/.ts/.tsx/.jsx).
// TypeScript imports use .js extensions (for ESM compatibility) but the Bazel package
// path doesn't include extensions.
//
// Step 3: Walk up the path hierarchy to find the owning Bazel package.
// Starting from the most specific path and walking up, we check the RuleIndex
// for both exact and wildcard matches:
//
//	"packages/ecma402-abstract/types/number" → not found
//	"packages/ecma402-abstract/types"        → found! (has formatjs_library rule)
//
// Self-references are skipped — if the resolved path matches the current package,
// it's a same-package import and doesn't need a dep.
func resolveSubpathImport(importPath string, from label.Label, ix *resolve.RuleIndex) string {
	// Step 1: Find matching subpath import pattern.
	// Iterate over patterns from package.json "imports" field.
	// Example: "#packages/*" → "./packages/*"
	//   prefix = "#packages/"
	//   targetPrefix = "packages/"
	//   resolvedPath = "packages/" + "ecma402-abstract/types/number.js"
	var resolvedPath string
	for pattern, target := range subpathImportsMap {
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

	// Step 2: Strip file extensions.
	// TypeScript uses .js extensions in imports for ESM compatibility
	// (rewriteRelativeImportExtensions in tsconfig), but Bazel package paths
	// don't include extensions.
	for _, ext := range []string{".js", ".ts", ".tsx", ".jsx"} {
		resolvedPath = strings.TrimSuffix(resolvedPath, ext)
	}

	parts := strings.Split(resolvedPath, "/")

	// Step 3: Walk up from most specific to least specific path.
	// For "packages/ecma402-abstract/types/number", we try:
	//   1. "packages/ecma402-abstract/types/number"  → no rule
	//   2. "packages/ecma402-abstract/types"          → found! → //packages/ecma402-abstract/types
	//
	// We check both exact match and wildcard ("path/*") because Imports()
	// registers both forms for each rule.
	for i := len(parts); i > 0; i-- {
		testPath := strings.Join(parts[:i], "/")

		// Skip self-references — importing from your own package isn't a dep.
		if testPath == from.Pkg {
			return ""
		}

		// Check RuleIndex for exact match.
		results := ix.FindRulesByImportWithConfig(
			nil,
			resolve.ImportSpec{Lang: languageName, Imp: testPath},
			languageName,
		)
		if len(results) > 0 {
			return "//" + testPath
		}

		// Check wildcard match — rules register "path/*" for subpath imports.
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
//
// It handles both scoped and unscoped packages:
//   - "react"           → pkgName = "react"         → //:node_modules/react
//   - "@babel/core"     → pkgName = "@babel/core"   → //:node_modules/@babel/core
//   - "react/jsx-runtime" → pkgName = "react"       → //:node_modules/react
//   - "@babel/core/lib" → pkgName = "@babel/core"   → //:node_modules/@babel/core
//
// Returns "" if the package is not found in the root package.json, to avoid
// generating deps on non-existent Bazel targets.
//
// Special case: if the package itself isn't in package.json but @types/<pkg> is,
// return the @types label. This handles packages that are only used for their types
// (e.g., import type patterns).
func resolveNpmImport(importPath string) string {
	// Extract the npm package name from the import path.
	// Scoped packages have the form @scope/name, so we need the first two segments.
	var pkgName string
	if strings.HasPrefix(importPath, "@") {
		// Scoped: @babel/core/lib → ["@babel", "core", "lib"] → "@babel/core"
		parts := strings.SplitN(importPath, "/", 3)
		if len(parts) < 2 {
			return ""
		}
		pkgName = parts[0] + "/" + parts[1]
	} else {
		// Unscoped: react/jsx-runtime → ["react", "jsx-runtime"] → "react"
		parts := strings.SplitN(importPath, "/", 2)
		pkgName = parts[0]
	}

	if packageDeps[pkgName] {
		return "//:node_modules/" + pkgName
	}

	// Fallback: check if only @types exists (for type-only imports).
	// This handles cases where a package is used only for its type definitions.
	if !strings.HasPrefix(pkgName, "@") {
		if packageDeps["@types/"+pkgName] {
			return "//:node_modules/@types/" + pkgName
		}
	}

	// Package not found in package.json — skip to avoid generating
	// references to non-existent Bazel targets.
	return ""
}

// getTypesPackage returns the @types Bazel label if a DefinitelyTyped package exists.
//
// DefinitelyTyped naming conventions:
//   - Unscoped: react       → @types/react
//   - Scoped:   @babel/core → @types/babel__core  (@ stripped, / replaced with __)
//
// Returns "" if no @types package exists in the root package.json.
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

// loadPackageJSONDeps reads the root package.json and caches its contents.
// Called once per gazelle run (guarded by sync.Once).
//
// It populates two caches:
//   - packageDeps: set of all npm package names (dependencies + devDependencies + optional)
//   - subpathImportsMap: the "imports" field (e.g., "#packages/*" → "./packages/*")
//
// The root package.json is the single source of truth for:
//   - Which npm packages have corresponding Bazel targets (//:node_modules/*)
//   - How #-prefixed subpath imports resolve to filesystem paths
func loadPackageJSONDeps(repoRoot string) {
	packageDepsOnce.Do(func() {
		packageDeps = make(map[string]bool)
		subpathImportsMap = make(map[string]string)
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
		for k, v := range pkg.Imports {
			subpathImportsMap[k] = v
		}
	})
}

// deduplicateAndSort removes duplicates and sorts a string slice alphabetically.
// Returns nil for empty input to avoid setting empty list attrs in BUILD files.
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
