use formatjs_icu_messageformat_parser::{ArgumentKind, message_arguments};
use formatjs_icu_messageformat_parser::{Parser, ParserOptions};
use std::collections::BTreeSet;

#[test]
fn collects_roles_across_branches_and_escaped_text() {
    let ast = Parser::new(
        "'{escaped}' '<ignored>' {kind, select, other {<b>{n, plural, other {# {n, number}}}</b> {d, date} {d, time} {n}}}",
        ParserOptions::default(),
    ).parse().unwrap();
    let args = message_arguments(&ast);
    assert_eq!(args.len(), 4);
    assert_eq!(
        args["n"],
        BTreeSet::from([ArgumentKind::Number, ArgumentKind::Value])
    );
    assert_eq!(args["d"], BTreeSet::from([ArgumentKind::DateTime]));
    assert_eq!(args["b"], BTreeSet::from([ArgumentKind::Tag]));
    assert_eq!(args["kind"], BTreeSet::from([ArgumentKind::Select]));
}
