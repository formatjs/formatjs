use formatjs_cli::id_generator::*;
use serde_json::Value;

#[test]
fn test_generate_id_sha512_base64() {
    let id = generate_id(
        "[sha512:contenthash:base64:6]",
        Some("Hello World"),
        &None,
        None,
    )
    .unwrap();
    // Standard base64 (may contain + and /)
    assert_eq!(id, "LHT9F+");
}

#[test]
fn test_generate_id_sha512_base64url() {
    let id = generate_id(
        "[sha512:contenthash:base64url:6]",
        Some("Hello World"),
        &None,
        None,
    )
    .unwrap();
    assert_eq!(id, "LHT9F-");
}

#[test]
fn test_generate_id_with_description() {
    let desc = serde_json::Value::String("A greeting".to_string());
    let id = generate_id(
        "[sha512:contenthash:base64:8]",
        Some("Hello"),
        &Some(desc),
        None,
    )
    .unwrap();
    // Hash of "Hello#A greeting" (without JSON quotes around description)
    // This matches TypeScript CLI behavior
    assert_eq!(id, "tYLiH0T9");
}

#[test]
fn test_generate_id_hex() {
    let id = generate_id("[sha512:contenthash:hex:10]", Some("Test"), &None, None).unwrap();
    assert_eq!(id, "c6ee9e33cf");
}

#[test]
fn test_generate_id_loader_utils_file_placeholders() {
    let id = generate_id(
        "[name].[ext]_[sha512:contenthash:base64:6]",
        Some("Hello"),
        &None,
        Some("a.ts"),
    )
    .unwrap();
    assert_eq!(id, "a.ts_NhX4DJ");
}

#[test]
fn test_generate_id_content() {
    let id = generate_id("[content]", Some("Hello [name]"), &None, Some("a.ts")).unwrap();
    assert_eq!(id, "Hello [name]");
}

#[test]
fn test_generate_id_content_with_description() {
    let desc = Value::String("A greeting".to_string());
    let id = generate_id("[content]", Some("Hello"), &Some(desc), None).unwrap();
    assert_eq!(id, "Hello#A greeting");

    let empty = Value::String(String::new());
    let id = generate_id("[content]", Some("Hello"), &Some(empty), None).unwrap();
    assert_eq!(id, "Hello");
}

#[test]
fn test_generate_id_content_with_other_placeholders() {
    let id = generate_id(
        "[name]:[CONTENT]:[sha512:contenthash:base64:6]",
        Some("Hello"),
        &None,
        Some("a.ts"),
    )
    .unwrap();
    assert_eq!(id, "a:Hello:NhX4DJ");
}

#[test]
fn test_generate_id_legacy_contenthash_shorthand() {
    let id = generate_id("[contenthash:5]", Some("Hello World"), &None, None).unwrap();
    assert_eq!(id, "b10a8");
}

#[test]
fn test_generate_id_hash_alias_shorthand() {
    let id = generate_id("[hash:5]", Some("Hello World"), &None, None).unwrap();
    assert_eq!(id, "b10a8");
}

#[test]
fn test_generate_id_sha1() {
    let id = generate_id(
        "[sha1:contenthash:base64:6]",
        Some("Hello World"),
        &None,
        None,
    )
    .unwrap();
    assert_eq!(id, "Ck1VqN");
}

#[test]
fn test_generate_id_sha256() {
    let id = generate_id(
        "[sha256:contenthash:hex:5]",
        Some("Hello World"),
        &None,
        None,
    )
    .unwrap();
    assert_eq!(id, "a591a");
}

#[test]
fn test_generate_id_sha224_and_sha384() {
    let sha224 = generate_id("[sha224:contenthash:hex:10]", Some("Test"), &None, None).unwrap();
    let sha384 = generate_id("[sha384:contenthash:hex:10]", Some("Test"), &None, None).unwrap();

    assert_eq!(sha224, "3606346815");
    assert_eq!(sha384, "7b8f465407");
}

#[test]
fn test_generate_id_hash_digest_alias() {
    let id = generate_id("[sha256:hash:hex:5]", Some("Hello World"), &None, None).unwrap();
    assert_eq!(id, "a591a");
}

#[test]
fn test_generate_id_invalid_pattern() {
    let result = generate_id("invalid", Some("Test"), &None, None);
    assert!(result.is_err());
}

#[test]
fn test_generate_id_different_lengths() {
    // Test various lengths
    for length in [4, 6, 8, 10, 16, 32] {
        let pattern = format!("[sha512:contenthash:base64:{}]", length);
        let id = generate_id(&pattern, Some("Test message"), &None, None).unwrap();
        assert_eq!(id.len(), length, "ID should be {} characters", length);
    }
}

#[test]
fn test_generate_id_deterministic() {
    // Same input should always produce the same ID
    let id1 = generate_id(
        "[sha512:contenthash:base64:10]",
        Some("Hello World"),
        &None,
        None,
    )
    .unwrap();
    let id2 = generate_id(
        "[sha512:contenthash:base64:10]",
        Some("Hello World"),
        &None,
        None,
    )
    .unwrap();
    assert_eq!(id1, "LHT9F+2v2A");
    assert_eq!(id2, "LHT9F+2v2A");
    assert_eq!(id1, id2, "Same input should produce same ID");
}

#[test]
fn test_generate_id_different_messages() {
    // Different messages should produce different IDs
    let id1 = generate_id(
        "[sha512:contenthash:base64:10]",
        Some("Message 1"),
        &None,
        None,
    )
    .unwrap();
    let id2 = generate_id(
        "[sha512:contenthash:base64:10]",
        Some("Message 2"),
        &None,
        None,
    )
    .unwrap();
    assert_eq!(id1, "ePueQ5h1ce");
    assert_eq!(id2, "fTO7rwuRCr");
    assert_ne!(id1, id2, "Different messages should produce different IDs");
}

#[test]
fn test_generate_id_empty_description_matches_missing_description() {
    for description in [None, Some(Value::String(String::new()))] {
        let id = generate_id(
            "[sha512:contenthash:base64:6]",
            Some("My message with empty description"),
            &description,
            None,
        )
        .unwrap();
        assert_eq!(id, "L91vdv");
    }
    assert_eq!(
        generate_id(
            "[content]",
            Some("Hello"),
            &Some(Value::String(" ".into())),
            None
        )
        .unwrap(),
        "Hello# "
    );
}

#[test]
fn test_generate_id_with_description_affects_hash() {
    let desc = serde_json::Value::String("Description".to_string());
    let id1 = generate_id("[sha512:contenthash:base64:10]", Some("Hello"), &None, None).unwrap();
    let id2 = generate_id(
        "[sha512:contenthash:base64:10]",
        Some("Hello"),
        &Some(desc),
        None,
    )
    .unwrap();
    assert_eq!(id1, "NhX4DJ0pPt");
    // Hash of "Hello#Description" (without JSON quotes around description)
    // This matches TypeScript CLI behavior
    assert_eq!(id2, "WgDsrbylG9");
    assert_ne!(
        id1, id2,
        "Adding description should change the generated ID"
    );
}

#[test]
fn test_generate_id_hex_vs_base64() {
    let id_hex = generate_id("[sha512:contenthash:hex:10]", Some("Test"), &None, None).unwrap();
    let id_base64 =
        generate_id("[sha512:contenthash:base64:10]", Some("Test"), &None, None).unwrap();

    assert_eq!(id_hex, "c6ee9e33cf");
    assert_eq!(id_base64, "xu6eM89cZx");
}

#[test]
fn test_generate_id_base64_vs_base64url() {
    let id_base64 = generate_id(
        "[sha512:contenthash:base64:10]",
        Some("Hello World"),
        &None,
        None,
    )
    .unwrap();
    let id_base64url = generate_id(
        "[sha512:contenthash:base64url:10]",
        Some("Hello World"),
        &None,
        None,
    )
    .unwrap();

    assert_eq!(id_base64, "LHT9F+2v2A");
    assert_eq!(id_base64url, "LHT9F-2v2A");
}

#[test]
fn test_generate_id_base62() {
    let id = generate_id(
        "[sha512:contenthash:base62:10]",
        Some("Test message"),
        &None,
        None,
    )
    .unwrap();
    assert_eq!(id, "Gm8I0LBX6B");
}

#[test]
fn test_generate_id_base62_deterministic() {
    let id1 = generate_id(
        "[sha512:contenthash:base62:10]",
        Some("Hello World"),
        &None,
        None,
    )
    .unwrap();
    let id2 = generate_id(
        "[sha512:contenthash:base62:10]",
        Some("Hello World"),
        &None,
        None,
    )
    .unwrap();
    assert_eq!(id1, "AJxnki7plR");
    assert_eq!(id2, "AJxnki7plR");
}

#[test]
fn test_generate_id_base62_different_from_base64() {
    let id_base62 =
        generate_id("[sha512:contenthash:base62:10]", Some("Test"), &None, None).unwrap();
    let id_base64 =
        generate_id("[sha512:contenthash:base64:10]", Some("Test"), &None, None).unwrap();

    assert_eq!(id_base62, "kBedeOfsNe");
    assert_eq!(id_base64, "xu6eM89cZx");
}

#[test]
fn test_generate_id_base62_various_lengths() {
    // Test that truncation works correctly for various lengths
    for length in [4, 6, 8, 10, 16, 32] {
        let pattern = format!("[sha512:contenthash:base62:{}]", length);
        let id = generate_id(&pattern, Some("Test message for base62"), &None, None).unwrap();
        assert_eq!(id.len(), length);
    }
}

#[test]
fn test_generate_id_invalid_encoding() {
    let result = generate_id("[sha512:contenthash:base32:10]", Some("Test"), &None, None);
    assert!(result.is_err());
    assert!(
        result
            .unwrap_err()
            .to_string()
            .contains("Unsupported encoding")
    );
}

#[test]
fn test_generate_id_invalid_hash_algorithm() {
    let result = generate_id("[sha3:contenthash:base64:10]", Some("Test"), &None, None);
    assert!(result.is_err());
    assert!(
        result
            .unwrap_err()
            .to_string()
            .contains("Unsupported hash algorithm")
    );
}

#[test]
fn test_generate_id_invalid_format() {
    // Missing parts
    let result = generate_id("[sha512:contenthash]", Some("Test"), &None, None);
    assert!(result.is_err());

    // Invalid length
    let result = generate_id("[sha512:contenthash:base64:abc]", Some("Test"), &None, None);
    assert!(result.is_err());

    // Missing brackets
    let result = generate_id("sha512:contenthash:base64:10", Some("Test"), &None, None);
    assert!(result.is_err());
}

// https://github.com/formatjs/formatjs/issues/6009
#[test]
fn test_generate_id_matches_typescript_cli() {
    // This test verifies that the Rust CLI produces the same hash as the TypeScript CLI
    // for the exact test case from issue #6009
    let desc = serde_json::Value::String("Test component message".to_string());
    let id = generate_id(
        "[sha512:contenthash:base64:6]",
        Some("This is a test message."),
        &Some(desc),
        None,
    )
    .unwrap();

    // TypeScript CLI produces "rFvuOJ" for this input
    // Previously, Rust CLI incorrectly produced "8qN7+5" because it was
    // including JSON quotes around the description string
    assert_eq!(id, "rFvuOJ", "Hash should match TypeScript CLI output");
}
