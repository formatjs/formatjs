use formatjs_cli::plural_categories::cardinal_categories;

#[test]
fn cardinal_categories_fall_back_to_the_language() {
    assert_eq!(cardinal_categories("ja"), Some(&["other"][..]));
    assert_eq!(
        cardinal_categories("es-419"),
        Some(&["one", "many", "other"][..])
    );
    assert_eq!(
        cardinal_categories("sr-Latn-ME"),
        Some(&["one", "few", "other"][..])
    );
    assert_eq!(
        cardinal_categories("pt_PT"),
        Some(&["one", "many", "other"][..])
    );
    assert_eq!(cardinal_categories("tl"), Some(&["one", "other"][..]));
    assert_eq!(cardinal_categories("qaa"), None);
}
