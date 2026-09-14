//! Argument roles collected from parsed ICU messages.
use crate::MessageFormatElement;
use std::collections::{BTreeMap, BTreeSet};

/// A requirement imposed by an ICU argument occurrence.
#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord)]
pub enum ArgumentKind {
    Value,
    Number,
    DateTime,
    Select,
    Tag,
}

/// Collect every occurrence, including all select/plural branches.
/// Multiple roles for one name must all be satisfied.
pub fn message_arguments(
    ast: &[MessageFormatElement],
) -> BTreeMap<String, BTreeSet<ArgumentKind>> {
    fn visit(ast: &[MessageFormatElement], out: &mut BTreeMap<String, BTreeSet<ArgumentKind>>) {
        for element in ast {
            let (name, kind) = match element {
                MessageFormatElement::Argument(e) => (&e.value, ArgumentKind::Value),
                MessageFormatElement::Number(e) => (&e.value, ArgumentKind::Number),
                MessageFormatElement::Date(e) => (&e.value, ArgumentKind::DateTime),
                MessageFormatElement::Time(e) => (&e.value, ArgumentKind::DateTime),
                MessageFormatElement::Select(e) => {
                    for option in e.options.values() { visit(&option.value, out); }
                    (&e.value, ArgumentKind::Select)
                }
                MessageFormatElement::Plural(e) => {
                    for option in e.options.values() { visit(&option.value, out); }
                    (&e.value, ArgumentKind::Number)
                }
                MessageFormatElement::Tag(e) => {
                    visit(&e.children, out);
                    (&e.value, ArgumentKind::Tag)
                }
                MessageFormatElement::Literal(_) | MessageFormatElement::Pound(_) => continue,
            };
            out.entry(name.clone()).or_default().insert(kind);
        }
    }
    let mut out = BTreeMap::new();
    visit(ast, &mut out);
    out
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::{Parser, ParserOptions};

    #[test]
    fn collects_roles_across_branches_and_escaped_text() {
        let ast = Parser::new(
            "'{escaped}' '<ignored>' {kind, select, other {<b>{n, plural, other {# {n, number}}}</b> {d, date} {d, time} {n}}}",
            ParserOptions::default(),
        ).parse().unwrap();
        let args = message_arguments(&ast);
        assert_eq!(args.len(), 4);
        assert_eq!(args["n"], BTreeSet::from([ArgumentKind::Number, ArgumentKind::Value]));
        assert_eq!(args["d"], BTreeSet::from([ArgumentKind::DateTime]));
        assert_eq!(args["b"], BTreeSet::from([ArgumentKind::Tag]));
        assert_eq!(args["kind"], BTreeSet::from([ArgumentKind::Select]));
    }
}
