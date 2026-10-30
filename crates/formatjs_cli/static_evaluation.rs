use std::cell::RefCell;
use std::collections::{HashMap, HashSet};

use oxc::ast_visit::{Visit, walk};
use oxc::semantic::{Semantic, SemanticBuilder};
use oxc_allocator::{Allocator, GetAllocator};
use oxc_ast::{
    AstKind,
    ast::*,
    builder::{AstBuilder, GetAstBuilder},
};
use oxc_ecmascript::{
    ConstantValue, GlobalContext, ToBoolean, ToJsString, ValueType,
    constant_evaluation::{ConstantEvaluation, ConstantEvaluationCtx},
    side_effects::{MayHaveSideEffects, MayHaveSideEffectsContext, PropertyReadSideEffects},
};
use oxc_parser::Parser;
use oxc_span::{GetSpan, SourceType};
use oxc_syntax::{operator::LogicalOperator, reference::ReferenceId, symbol::SymbolId};

pub struct EvaluatedString {
    pub start: u32,
    pub end: u32,
    pub value: String,
}

struct EvaluationContext<'a, 's> {
    allocator: &'a Allocator,
    builder: AstBuilder<'a>,
    semantic: &'s Semantic<'a>,
    resolving: RefCell<HashSet<SymbolId>>,
    values: RefCell<HashMap<SymbolId, Option<ConstantValue<'a>>>>,
}

impl<'a> GetAllocator<'a> for EvaluationContext<'a, '_> {
    fn allocator(&self) -> &'a Allocator {
        self.allocator
    }
}

impl<'a> GetAstBuilder<'a> for EvaluationContext<'a, '_> {
    type Builder = AstBuilder<'a>;
    fn builder(&self) -> &AstBuilder<'a> {
        &self.builder
    }
}

impl<'a> GlobalContext<'a> for EvaluationContext<'a, '_> {
    fn is_global_reference(&self, reference: &IdentifierReference<'a>) -> bool {
        self.semantic.is_reference_to_global_variable(reference)
    }

    fn get_constant_value_for_reference_id(
        &self,
        reference_id: ReferenceId,
    ) -> Option<ConstantValue<'a>> {
        let scoping = self.semantic.scoping();
        let reference = scoping.get_reference(reference_id);
        let symbol = reference.symbol_id()?;
        if !scoping.symbol_flags(symbol).is_const_variable()
            || scoping
                .get_resolved_references(symbol)
                .any(|reference| reference.is_write())
            || !scoping.symbol_redeclarations(symbol).is_empty()
        {
            return None;
        }
        let AstKind::VariableDeclarator(declaration) =
            self.semantic.symbol_declaration(symbol).kind()
        else {
            return None;
        };
        if !matches!(declaration.id, BindingPattern::BindingIdentifier(_))
            || self
                .semantic
                .nodes()
                .get_node(reference.node_id())
                .span()
                .start
                < declaration.span.end
        {
            return None;
        }
        if let Some(value) = self.values.borrow().get(&symbol) {
            return value.clone();
        }
        let initializer = declaration.init.as_ref()?;
        {
            let mut resolving = self.resolving.borrow_mut();
            if resolving.len() >= 100 || !resolving.insert(symbol) {
                return None;
            }
        }
        let value = self.evaluate(initializer);
        self.resolving.borrow_mut().remove(&symbol);
        self.values.borrow_mut().insert(symbol, value.clone());
        value
    }

    fn value_type_for_reference_id(&self, reference_id: ReferenceId) -> Option<ValueType> {
        self.get_constant_value_for_reference_id(reference_id)
            .map(|value| match value {
                ConstantValue::String(_) => ValueType::String,
                ConstantValue::Number(_) => ValueType::Number,
                ConstantValue::Boolean(_) => ValueType::Boolean,
                ConstantValue::BigInt(_) => ValueType::BigInt,
                ConstantValue::Null => ValueType::Null,
                ConstantValue::Undefined => ValueType::Undefined,
            })
    }
}

impl<'a> MayHaveSideEffectsContext<'a> for EvaluationContext<'a, '_> {
    fn annotations(&self) -> bool {
        false
    }
    fn manual_pure_functions(&self, _: &Expression) -> bool {
        false
    }
    fn property_read_side_effects(&self) -> PropertyReadSideEffects {
        PropertyReadSideEffects::All
    }
    fn unknown_global_side_effects(&self) -> bool {
        true
    }
}
impl<'a> ConstantEvaluationCtx<'a> for EvaluationContext<'a, '_> {}

impl<'a> EvaluationContext<'a, '_> {
    fn evaluate(&self, expression: &Expression<'a>) -> Option<ConstantValue<'a>> {
        let expression = expression.get_inner_expression();
        if expression.may_have_side_effects(self) {
            return None;
        }
        match expression {
            Expression::TemplateLiteral(template) => {
                let mut value = String::new();
                for (index, quasi) in template.quasis.iter().enumerate() {
                    value.push_str(quasi.value.cooked.as_ref()?.as_str()?);
                    if let Some(expression) = template.expressions.get(index) {
                        value.push_str(&self.evaluate(expression)?.to_js_string(self)?);
                    }
                }
                Some(ConstantValue::String(value.into()))
            }
            // OXC skips binary expressions with a Boolean target. Evaluate first.
            Expression::LogicalExpression(logical) => {
                let left = self.evaluate(&logical.left)?;
                let use_right = match logical.operator {
                    LogicalOperator::And => left.to_boolean(self)?,
                    LogicalOperator::Or => !left.to_boolean(self)?,
                    LogicalOperator::Coalesce => {
                        matches!(left, ConstantValue::Null | ConstantValue::Undefined)
                    }
                };
                if use_right {
                    self.evaluate(&logical.right)
                } else {
                    Some(left)
                }
            }
            Expression::ConditionalExpression(conditional) => {
                let branch = if self.evaluate(&conditional.test)?.to_boolean(self)? {
                    &conditional.consequent
                } else {
                    &conditional.alternate
                };
                self.evaluate(branch)
            }
            _ => expression.evaluate_value(self),
        }
    }
}

struct StringVisitor<'a, 's> {
    context: EvaluationContext<'a, 's>,
    requests: HashMap<(u32, u32), (u32, u32)>,
    values: Vec<EvaluatedString>,
}

impl<'a> Visit<'a> for StringVisitor<'a, '_> {
    fn visit_expression(&mut self, expression: &Expression<'a>) {
        let span = expression.span();
        if let Some(&(start, end)) = self.requests.get(&(span.start, span.end)) {
            if let Some(ConstantValue::String(value)) = self.context.evaluate(expression) {
                self.values.push(EvaluatedString {
                    start,
                    end,
                    value: value.into_owned(),
                });
            }
        }
        walk::walk_expression(self, expression);
    }
}

/// Requests and results use JavaScript UTF-16 offsets; OXC uses UTF-8 byte offsets.
pub fn evaluate_strings(
    source: &str,
    filename: &str,
    requests: &[(u32, u32)],
) -> anyhow::Result<Vec<EvaluatedString>> {
    let allocator = Allocator::default();
    let source_type = SourceType::from_path(filename).unwrap_or_else(|_| SourceType::tsx());
    let source_type = if source_type.is_typescript() {
        source_type
    } else {
        source_type.with_jsx(true)
    };
    let parsed = Parser::new(&allocator, source, source_type).parse();
    anyhow::ensure!(
        parsed.diagnostics.is_empty(),
        "Unable to parse {filename} for static evaluation"
    );
    let result = SemanticBuilder::new()
        .with_build_nodes(true)
        .build(&parsed.program);
    let boundaries: HashSet<u32> = requests
        .iter()
        .flat_map(|&(start, end)| [start, end])
        .collect();
    let mut offsets = HashMap::new();
    let mut utf16 = 0;
    for (byte, character) in source.char_indices() {
        if boundaries.contains(&utf16) {
            offsets.insert(utf16, byte as u32);
        }
        utf16 += character.len_utf16() as u32;
    }
    offsets.insert(utf16, source.len() as u32);
    let requests = requests
        .iter()
        .filter_map(|&(start, end)| {
            Some(((*offsets.get(&start)?, *offsets.get(&end)?), (start, end)))
        })
        .collect();
    let mut visitor = StringVisitor {
        context: EvaluationContext {
            allocator: &allocator,
            builder: AstBuilder::new(&allocator),
            semantic: &result.semantic,
            resolving: RefCell::new(HashSet::new()),
            values: RefCell::new(HashMap::new()),
        },
        requests,
        values: Vec::new(),
    };
    visitor.visit_program(&parsed.program);
    Ok(visitor.values)
}
