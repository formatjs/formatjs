/// ID generation for messages using interpolation patterns.
///
/// This module handles generating message IDs based on content hashing with
/// configurable patterns like `[sha512:contenthash:base64:6]`.

use anyhow::{Context, Result};
use base64::Engine;
use serde_json::Value;
use sha2::{Digest, Sha512};

/// Base62 character set: 0-9, A-Z, a-z
const BASE62_CHARS: &[u8] = b"0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

/// Encode bytes to base62 string
fn encode_base62(bytes: &[u8]) -> String {
    if bytes.is_empty() {
        return String::new();
    }

    // Convert bytes to a big integer representation, then encode
    let mut result = Vec::new();
    let mut num = bytes.to_vec();

    while !num.iter().all(|&b| b == 0) {
        let mut remainder = 0u32;
        for byte in &mut num {
            let value = (remainder << 8) | (*byte as u32);
            *byte = (value / 62) as u8;
            remainder = value % 62;
        }
        result.push(BASE62_CHARS[remainder as usize]);
    }

    // Add leading zeros for leading zero bytes in input
    for &byte in bytes {
        if byte == 0 {
            result.push(BASE62_CHARS[0]);
        } else {
            break;
        }
    }

    result.reverse();
    String::from_utf8(result).unwrap_or_default()
}

/// Generate message ID using interpolation pattern.
///
/// Supports patterns in the format: `[hash:digest:encoding:length]`
///
/// # Supported formats:
/// - **Hash algorithms**: `sha512`
/// - **Digest types**: `contenthash`
/// - **Encodings**: `base64`, `base64url` (URL-safe), `base62`, `hex`
/// - **Length**: Any positive integer
///
/// # Examples:
/// - `[sha512:contenthash:base64:6]` - 6-character base64 ID (standard, may contain +/)
/// - `[sha512:contenthash:base64url:6]` - 6-character URL-safe base64 ID (uses -_ instead of +/)
/// - `[sha512:contenthash:base62:6]` - 6-character base62 ID (alphanumeric only)
/// - `[sha512:contenthash:hex:10]` - 10-character hex ID
///
/// # Arguments:
/// * `pattern` - The interpolation pattern string
/// * `default_message` - The message text to hash
/// * `description` - Optional description that affects the hash
/// * `_file_path` - File path (currently unused, reserved for future use)
pub fn generate_id(
    pattern: &str,
    default_message: Option<&str>,
    description: &Option<Value>,
    _file_path: Option<&str>,
) -> Result<String> {
    // Parse pattern: [hash:digest:encoding:length]
    // Default: [sha512:contenthash:base64:6]

    if !pattern.starts_with('[') || !pattern.ends_with(']') {
        anyhow::bail!("Invalid ID interpolation pattern: {}", pattern);
    }

    let inner = &pattern[1..pattern.len() - 1];
    let parts: Vec<&str> = inner.split(':').collect();

    if parts.len() < 4 {
        anyhow::bail!(
            "Invalid ID interpolation pattern format: {}. Expected [hash:digest:encoding:length]",
            pattern
        );
    }

    let hash_algo = parts[0];
    let digest_type = parts[1];
    let encoding = parts[2];
    let length: usize = parts[3]
        .parse()
        .context("Invalid length in ID interpolation pattern")?;

    // Build content hash input
    let mut content = String::new();
    if let Some(msg) = default_message {
        content.push_str(msg);
    }
    if let Some(desc) = description {
        content.push('#');
        // Extract string value for string types to match TypeScript CLI behavior
        // TypeScript uses: typeof description === 'string' ? description : stringify(description)
        match desc {
            Value::String(s) => content.push_str(s),
            _ => content.push_str(&desc.to_string()),
        }
    }

    // Generate hash
    let hash = match (hash_algo, digest_type) {
        ("sha512", "contenthash") => {
            let mut hasher = Sha512::new();
            hasher.update(content.as_bytes());
            let result = hasher.finalize();
            match encoding {
                "base64" => {
                    // Standard base64 (matches Node's crypto.digest('base64'))
                    base64::engine::general_purpose::STANDARD.encode(&result)
                }
                "base64url" => {
                    // URL-safe base64 without padding (matches Node's crypto.digest('base64url'))
                    base64::engine::general_purpose::URL_SAFE_NO_PAD.encode(&result)
                }
                "base62" => encode_base62(&result),
                "hex" => hex::encode(result),
                _ => anyhow::bail!("Unsupported encoding: {}", encoding),
            }
        }
        _ => anyhow::bail!(
            "Unsupported hash algorithm or digest type: {}:{}",
            hash_algo,
            digest_type
        ),
    };

    // Truncate to specified length
    Ok(hash.chars().take(length).collect())
}

#[cfg(test)]
mod tests {
    use super::*;

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
    fn test_generate_id_with_description_affects_hash() {
        let desc = serde_json::Value::String("Description".to_string());
        let id1 = generate_id(
            "[sha512:contenthash:base64:10]",
            Some("Hello"),
            &None,
            None,
        )
        .unwrap();
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
        let id_base64 =
            generate_id("[sha512:contenthash:base64:10]", Some("Hello World"), &None, None).unwrap();
        let id_base64url =
            generate_id("[sha512:contenthash:base64url:10]", Some("Hello World"), &None, None).unwrap();

        assert_eq!(id_base64, "LHT9F+2v2A");
        assert_eq!(id_base64url, "LHT9F-2v2A");
    }

    #[test]
    fn test_generate_id_base62() {
        let id =
            generate_id("[sha512:contenthash:base62:10]", Some("Test message"), &None, None).unwrap();
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
        let result = generate_id(
            "[sha512:contenthash:base32:10]",
            Some("Test"),
            &None,
            None,
        );
        assert!(result.is_err());
        assert!(result
            .unwrap_err()
            .to_string()
            .contains("Unsupported encoding"));
    }

    #[test]
    fn test_generate_id_invalid_hash_algorithm() {
        let result = generate_id("[md5:contenthash:base64:10]", Some("Test"), &None, None);
        assert!(result.is_err());
        assert!(result
            .unwrap_err()
            .to_string()
            .contains("Unsupported hash algorithm"));
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
}
