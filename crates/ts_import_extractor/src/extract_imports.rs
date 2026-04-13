// extract_imports.rs — oxc-based TypeScript import extractor.
//
// Parses TypeScript/TSX files with oxc and walks the AST to collect all import paths.
// This is the core parsing logic used by the gazelle plugin (tools/gazelle/ts/) to
// determine dependencies between TypeScript packages.
//
// Handles all TypeScript import forms:
//   - import declarations:    import { x } from 'module', import 'module'
//   - export-from:            export { x } from 'module'
//   - export-all:             export * from 'module'
//   - dynamic import:         import('module')  (oxc models this as ImportExpression)
//   - type-only imports:      import type { X } from 'module' (still extracted — needed for type checking)
//
// The extracted paths are raw module specifiers (e.g., "react", "#packages/ecma402-abstract/types/number.js").
// Resolution to Bazel labels happens on the Go side in resolve.go.

use oxc_allocator::Allocator;
use oxc::ast_visit::Visit;
use oxc_ast::ast::*;
use oxc_parser::Parser;
use oxc_span::SourceType;
use std::collections::HashSet;

/// Extract all import paths from a TypeScript/TSX file on disk.
pub fn extract_imports_from_file(path: &str) -> Result<Vec<String>, String> {
    let source_text = std::fs::read_to_string(path)
        .map_err(|e| format!("Failed to read {path}: {e}"))?;
    extract_imports(path, &source_text)
}

/// Extract all import paths from TypeScript/TSX source code.
/// Returns an error if the file has parse errors — we don't extract from
/// partially-recovered ASTs to avoid producing incorrect dependency graphs.
pub fn extract_imports(path: &str, source_text: &str) -> Result<Vec<String>, String> {
    let allocator = Allocator::default();
    let source_type = SourceType::from_path(path)
        .map_err(|e| format!("Unknown file extension for {path}: {e}"))?
        .with_jsx(true);

    let ret = Parser::new(&allocator, source_text, source_type).parse();

    if !ret.errors.is_empty() {
        let errors: Vec<String> = ret
            .errors
            .into_iter()
            .map(|d| d.with_source_code(source_text.to_string()))
            .map(|e| format!("{e:?}"))
            .collect();
        return Err(format!("Parse `{path}` failed:\n{}", errors.join("\n")));
    }

    let mut visitor = ImportVisitor::new();
    visitor.visit_program(&ret.program);
    Ok(visitor.into_imports())
}

/// AST visitor that collects import paths from TypeScript source code.
struct ImportVisitor {
    imports: Vec<String>,
    seen: HashSet<String>,
}

impl ImportVisitor {
    fn new() -> Self {
        Self {
            imports: Vec::new(),
            seen: HashSet::new(),
        }
    }

    fn add(&mut self, path: &str) {
        if !path.is_empty() && self.seen.insert(path.to_string()) {
            self.imports.push(path.to_string());
        }
    }

    fn into_imports(self) -> Vec<String> {
        self.imports
    }
}

impl<'a> Visit<'a> for ImportVisitor {
    // import ... from 'module' | import 'module'
    fn visit_import_declaration(&mut self, decl: &ImportDeclaration<'a>) {
        self.add(decl.source.value.as_str());
    }

    // export { x } from 'module'
    fn visit_export_named_declaration(&mut self, decl: &ExportNamedDeclaration<'a>) {
        if let Some(ref source) = decl.source {
            self.add(source.value.as_str());
        }
    }

    // export * from 'module'
    fn visit_export_all_declaration(&mut self, decl: &ExportAllDeclaration<'a>) {
        self.add(decl.source.value.as_str());
    }

    // import('module') — oxc models dynamic imports as ImportExpression
    fn visit_import_expression(&mut self, expr: &ImportExpression<'a>) {
        if let Expression::StringLiteral(lit) = &expr.source {
            self.add(lit.value.as_str());
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use pretty_assertions::assert_eq;

    #[test]
    fn empty_file() {
        assert_eq!(extract_imports("test.ts", "").unwrap(), Vec::<String>::new());
    }

    #[test]
    fn static_imports() {
        let imports = extract_imports("test.ts", r#"
            import foo from 'foo';
            import { bar } from 'bar';
            import * as baz from 'baz';
        "#).unwrap();
        assert_eq!(imports, vec!["foo", "bar", "baz"]);
    }

    #[test]
    fn side_effect_import() {
        let imports = extract_imports("test.ts", "import 'polyfill';").unwrap();
        assert_eq!(imports, vec!["polyfill"]);
    }

    #[test]
    fn type_imports() {
        let imports = extract_imports("test.ts", r#"
            import type { Foo } from 'foo';
            import { type Bar } from 'bar';
        "#).unwrap();
        assert_eq!(imports, vec!["foo", "bar"]);
    }

    #[test]
    fn export_from() {
        let imports = extract_imports("test.ts", r#"
            export { x } from 'foo';
            export * from 'bar';
            export type { Baz } from 'baz';
        "#).unwrap();
        assert_eq!(imports, vec!["foo", "bar", "baz"]);
    }

    #[test]
    fn dynamic_import() {
        let imports = extract_imports("test.ts", "const m = await import('lazy');").unwrap();
        assert_eq!(imports, vec!["lazy"]);
    }

    #[test]
    fn tsx_file() {
        let imports = extract_imports("test.tsx", r#"
            import React from 'react';
            export function App() { return <div />; }
        "#).unwrap();
        assert_eq!(imports, vec!["react"]);
    }

    #[test]
    fn deduplicates() {
        let imports = extract_imports("test.ts", r#"
            import { a } from 'foo';
            import { b } from 'foo';
        "#).unwrap();
        assert_eq!(imports, vec!["foo"]);
    }

    #[test]
    fn subpath_imports() {
        let imports = extract_imports("test.ts", r#"
            import { x } from '#packages/ecma402-abstract/types/number.js';
        "#).unwrap();
        assert_eq!(imports, vec!["#packages/ecma402-abstract/types/number.js"]);
    }

    #[test]
    fn mixed_imports() {
        let imports = extract_imports("test.ts", r#"
            import React from 'react';
            import { GetOption } from '#packages/ecma402-abstract/GetOption.js';
            import type { NumberFormatOptions } from '#packages/ecma402-abstract/types/number.js';
            export * from './utils.js';
            const lazy = await import('lazy-module');
        "#).unwrap();
        assert_eq!(imports, vec![
            "react",
            "#packages/ecma402-abstract/GetOption.js",
            "#packages/ecma402-abstract/types/number.js",
            "./utils.js",
            "lazy-module",
        ]);
    }

    #[test]
    fn malformed_file_returns_error() {
        let result = extract_imports("test.ts", "@@@import broken syntax");
        assert!(result.is_err());
        assert!(result.unwrap_err().contains("Parse `test.ts` failed"));
    }
}
