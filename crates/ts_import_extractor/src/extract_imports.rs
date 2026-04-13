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
    Ok(extract_imports(path, &source_text))
}

/// Extract all import paths from TypeScript/TSX source code.
pub fn extract_imports(path: &str, source_text: &str) -> Vec<String> {
    let allocator = Allocator::default();
    let source_type = SourceType::from_path(path)
        .unwrap_or_default()
        .with_jsx(true);

    let ret = Parser::new(&allocator, source_text, source_type).parse();

    let mut visitor = ImportVisitor::new();
    visitor.visit_program(&ret.program);
    visitor.into_imports()
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
        assert_eq!(extract_imports("test.ts", ""), Vec::<String>::new());
    }

    #[test]
    fn static_imports() {
        let imports = extract_imports("test.ts", r#"
            import foo from 'foo';
            import { bar } from 'bar';
            import * as baz from 'baz';
        "#);
        assert_eq!(imports, vec!["foo", "bar", "baz"]);
    }

    #[test]
    fn side_effect_import() {
        let imports = extract_imports("test.ts", "import 'polyfill';");
        assert_eq!(imports, vec!["polyfill"]);
    }

    #[test]
    fn type_imports() {
        let imports = extract_imports("test.ts", r#"
            import type { Foo } from 'foo';
            import { type Bar } from 'bar';
        "#);
        assert_eq!(imports, vec!["foo", "bar"]);
    }

    #[test]
    fn export_from() {
        let imports = extract_imports("test.ts", r#"
            export { x } from 'foo';
            export * from 'bar';
            export type { Baz } from 'baz';
        "#);
        assert_eq!(imports, vec!["foo", "bar", "baz"]);
    }

    #[test]
    fn dynamic_import() {
        let imports = extract_imports("test.ts", "const m = await import('lazy');");
        assert_eq!(imports, vec!["lazy"]);
    }

    #[test]
    fn tsx_file() {
        let imports = extract_imports("test.tsx", r#"
            import React from 'react';
            export function App() { return <div />; }
        "#);
        assert_eq!(imports, vec!["react"]);
    }

    #[test]
    fn deduplicates() {
        let imports = extract_imports("test.ts", r#"
            import { a } from 'foo';
            import { b } from 'foo';
        "#);
        assert_eq!(imports, vec!["foo"]);
    }

    #[test]
    fn subpath_imports() {
        let imports = extract_imports("test.ts", r#"
            import { x } from '#packages/ecma402-abstract/types/number.js';
        "#);
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
        "#);
        assert_eq!(imports, vec![
            "react",
            "#packages/ecma402-abstract/GetOption.js",
            "#packages/ecma402-abstract/types/number.js",
            "./utils.js",
            "lazy-module",
        ]);
    }
}
