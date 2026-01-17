/// ID generation for messages using interpolation patterns.
///
/// This module handles generating message IDs based on content hashing with
/// configurable patterns like `[sha512:contenthash:base64:6]`.

use anyhow::{Context, Result};
use base64::Engine;
use serde_json::Value;
use sha2::{Digest, Sha512};

/// Generate message ID using interpolation pattern.
///
/// Supports patterns in the format: `[hash:digest:encoding:length]`
///
/// # Supported formats:
/// - **Hash algorithms**: `sha512`
/// - **Digest types**: `contenthash`
/// - **Encodings**: `base64` (URL-safe), `hex`
/// - **Length**: Any positive integer
///
/// # Examples:
/// - `[sha512:contenthash:base64:6]` - 6-character base64 ID
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
        content.push_str(&desc.to_string());
    }

    // Generate hash
    let hash = match (hash_algo, digest_type) {
        ("sha512", "contenthash") => {
            let mut hasher = Sha512::new();
            hasher.update(content.as_bytes());
            let result = hasher.finalize();
            match encoding {
                "base64" => {
                    let encoded = base64::engine::general_purpose::STANDARD.encode(&result);
                    // base64 URL-safe: replace + with - and / with _
                    encoded.replace('+', "-").replace('/', "_")
                }
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
        assert_eq!(id.len(), 6);
        // Should be URL-safe base64
        assert!(!id.contains('+'));
        assert!(!id.contains('/'));
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
        assert_eq!(id.len(), 8);
    }

    #[test]
    fn test_generate_id_hex() {
        let id = generate_id("[sha512:contenthash:hex:10]", Some("Test"), &None, None).unwrap();
        assert_eq!(id.len(), 10);
        // Should be hex characters
        assert!(id.chars().all(|c| c.is_ascii_hexdigit()));
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
        assert_ne!(
            id1, id2,
            "Adding description should change the generated ID"
        );
    }

    #[test]
    fn test_generate_id_hex_vs_base64() {
        // Same message with different encodings should produce different output
        let id_hex = generate_id("[sha512:contenthash:hex:10]", Some("Test"), &None, None).unwrap();
        let id_base64 =
            generate_id("[sha512:contenthash:base64:10]", Some("Test"), &None, None).unwrap();

        assert_ne!(id_hex, id_base64, "Different encodings should produce different output");

        // Verify character sets
        assert!(
            id_hex.chars().all(|c| c.is_ascii_hexdigit()),
            "Hex should only contain hex digits"
        );
        // Base64 can contain alphanumeric, -, _
        assert!(
            id_base64
                .chars()
                .all(|c| c.is_alphanumeric() || c == '-' || c == '_'),
            "Base64 should be URL-safe"
        );
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
}
