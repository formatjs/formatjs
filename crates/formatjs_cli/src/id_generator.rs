/// ID generation for messages using interpolation patterns.
///
/// This module handles generating message IDs based on content hashing with
/// configurable patterns like `[sha512:contenthash:base64:6]`.
use anyhow::{Context, Result};
use base64::Engine;
use md5::{Digest, Md5};
use serde_json::Value;
use sha1::Sha1;
use sha2::{Sha224, Sha256, Sha384, Sha512};
use std::path::Path;

/// Base62 character set: 0-9, A-Z, a-z
const BASE62_CHARS: &[u8] = b"0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
enum HashAlgorithm {
    Md5,
    Sha1,
    Sha224,
    Sha256,
    Sha384,
    Sha512,
}

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
enum DigestType {
    ContentHash,
}

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
enum Encoding {
    Base64,
    Base64Url,
    Base62,
    Hex,
}

#[derive(Clone, Debug, PartialEq, Eq)]
struct HashInterpolation {
    hash_algorithm: HashAlgorithm,
    digest_type: DigestType,
    encoding: Encoding,
    length: usize,
}

#[derive(Clone, Debug, PartialEq, Eq)]
enum InterpolationPart {
    Literal(String),
    Hash(HashInterpolation),
    Ext,
    Name,
    Path,
    Folder,
    Query,
}

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
/// Supports loader-utils style interpolation templates, including hash
/// placeholders in the format `[hash:digest:encoding:length]` and file-name
/// placeholders such as `[name]` and `[ext]`.
///
/// # Supported formats:
/// - **Hash algorithms**: `md5`, `sha1`, `sha224`, `sha256`, `sha384`, `sha512`
/// - **Digest types**: `contenthash`, `hash`
/// - **Encodings**: `base64`, `base64url` (URL-safe), `base62`, `hex`
/// - **Length**: Any positive integer
///
/// # Examples:
/// - `[contenthash:5]` - legacy shorthand for a 5-character md5 hex ID
/// - `[sha256:contenthash:hex:5]` - 5-character sha256 hex ID
/// - `[sha512:contenthash:base64:6]` - 6-character base64 ID (standard, may contain +/)
/// - `[sha512:contenthash:base64url:6]` - 6-character URL-safe base64 ID (uses -_ instead of +/)
/// - `[sha512:contenthash:base62:6]` - 6-character base62 ID (alphanumeric only)
/// - `[sha512:contenthash:hex:10]` - 10-character hex ID
///
/// # Arguments:
/// * `pattern` - The interpolation pattern string
/// * `default_message` - The message text to hash
/// * `description` - Optional description that affects the hash
/// * `file_path` - File path for loader-utils file-name placeholders
pub fn generate_id(
    pattern: &str,
    default_message: Option<&str>,
    description: &Option<Value>,
    file_path: Option<&str>,
) -> Result<String> {
    IdGenerator::new(pattern)?.generate(default_message, description, file_path.map(Path::new))
}

/// Parsed ID interpolation pattern for repeated message ID generation.
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct IdGenerator {
    parts: Vec<InterpolationPart>,
}

impl IdGenerator {
    pub fn new(pattern: &str) -> Result<Self> {
        Ok(Self {
            parts: parse_interpolation_pattern(pattern)?,
        })
    }

    pub fn generate(
        &self,
        default_message: Option<&str>,
        description: &Option<Value>,
        file_path: Option<&Path>,
    ) -> Result<String> {
        let content = hash_content(default_message, description);
        let resource_path_parts = ResourcePathParts::from_path(file_path);
        let mut id = String::new();

        for part in &self.parts {
            match part {
                InterpolationPart::Literal(value) => id.push_str(value),
                InterpolationPart::Hash(hash) => id.push_str(&hash.generate(&content)),
                InterpolationPart::Ext => id.push_str(&resource_path_parts.ext),
                InterpolationPart::Name => id.push_str(&resource_path_parts.name),
                InterpolationPart::Path => id.push_str(&resource_path_parts.path),
                InterpolationPart::Folder => id.push_str(&resource_path_parts.folder),
                InterpolationPart::Query => id.push_str(&resource_path_parts.query),
            }
        }

        Ok(id)
    }
}

impl HashInterpolation {
    fn generate(&self, content: &[u8]) -> String {
        let digest = match (self.hash_algorithm, self.digest_type) {
            (HashAlgorithm::Md5, DigestType::ContentHash) => hash_with::<Md5>(content),
            (HashAlgorithm::Sha1, DigestType::ContentHash) => hash_with::<Sha1>(content),
            (HashAlgorithm::Sha224, DigestType::ContentHash) => hash_with::<Sha224>(content),
            (HashAlgorithm::Sha256, DigestType::ContentHash) => hash_with::<Sha256>(content),
            (HashAlgorithm::Sha384, DigestType::ContentHash) => hash_with::<Sha384>(content),
            (HashAlgorithm::Sha512, DigestType::ContentHash) => hash_with::<Sha512>(content),
        };

        encode_digest(&digest, self.encoding)
            .chars()
            .take(self.length)
            .collect()
    }
}

#[derive(Clone, Debug, PartialEq, Eq)]
struct ResourcePathParts {
    ext: String,
    name: String,
    path: String,
    folder: String,
    query: String,
}

impl ResourcePathParts {
    fn from_path(path: Option<&Path>) -> Self {
        let Some(path) = path else {
            return Self::default();
        };

        let ext = path
            .extension()
            .and_then(|ext| ext.to_str())
            .unwrap_or("bin")
            .to_string();
        let name = path
            .file_stem()
            .and_then(|name| name.to_str())
            .unwrap_or("file")
            .to_string();

        let parent = path
            .parent()
            .filter(|parent| !parent.as_os_str().is_empty() && *parent != Path::new("."));
        let mut path = parent
            .map(|parent| normalize_path_separators(&parent.to_string_lossy()))
            .unwrap_or_default();
        if !path.is_empty() && !path.ends_with('/') {
            path.push('/');
        }
        let folder = parent
            .and_then(|parent| parent.file_name())
            .and_then(|folder| folder.to_str())
            .unwrap_or_default()
            .to_string();

        Self {
            ext,
            name,
            path,
            folder,
            query: String::new(),
        }
    }
}

impl Default for ResourcePathParts {
    fn default() -> Self {
        Self {
            ext: "bin".to_string(),
            name: "file".to_string(),
            path: String::new(),
            folder: String::new(),
            query: String::new(),
        }
    }
}

fn normalize_path_separators(path: &str) -> String {
    path.replace('\\', "/").replace("../", "_/")
}

fn parse_interpolation_pattern(pattern: &str) -> Result<Vec<InterpolationPart>> {
    let mut parts = Vec::new();
    let mut rest = pattern;
    let mut has_interpolation = false;

    while let Some(start) = rest.find('[') {
        if start > 0 {
            parts.push(InterpolationPart::Literal(rest[..start].to_string()));
        }

        let after_open = &rest[start + 1..];
        let Some(end) = after_open.find(']') else {
            anyhow::bail!("Invalid ID interpolation pattern: {}", pattern);
        };

        let token = &after_open[..end];
        let (part, is_interpolation) = parse_interpolation_part(token)?;
        has_interpolation |= is_interpolation;
        parts.push(part);
        rest = &after_open[end + 1..];
    }

    if !rest.is_empty() {
        parts.push(InterpolationPart::Literal(rest.to_string()));
    }

    if !has_interpolation {
        anyhow::bail!("Invalid ID interpolation pattern: {}", pattern);
    }

    Ok(parts)
}

fn parse_interpolation_part(token: &str) -> Result<(InterpolationPart, bool)> {
    match token.to_lowercase().as_str() {
        "ext" => Ok((InterpolationPart::Ext, true)),
        "name" => Ok((InterpolationPart::Name, true)),
        "path" => Ok((InterpolationPart::Path, true)),
        "folder" => Ok((InterpolationPart::Folder, true)),
        "query" => Ok((InterpolationPart::Query, true)),
        _ if is_hash_interpolation(token) => {
            Ok((InterpolationPart::Hash(parse_hash_interpolation(token)?), true))
        }
        _ => Ok((InterpolationPart::Literal(format!("[{}]", token)), false)),
    }
}

fn is_hash_interpolation(token: &str) -> bool {
    token
        .split(':')
        .map(|part| part.to_lowercase())
        .any(|part| is_digest_type(&part))
}

fn parse_hash_interpolation(token: &str) -> Result<HashInterpolation> {
    let parts: Vec<&str> = token.split(':').collect();

    if parts.is_empty() || parts.iter().any(|part| part.is_empty()) {
        anyhow::bail!("Invalid ID interpolation pattern: [{}]", token);
    }

    let normalized_parts: Vec<String> = parts.iter().map(|part| part.to_lowercase()).collect();
    let mut index = 0;
    let hash_algorithm = if is_digest_type(&normalized_parts[index]) {
        // loader-utils compatibility: `[contenthash:5]` means md5 + hex + length 5.
        HashAlgorithm::Md5
    } else {
        let algorithm = parse_hash_algorithm(&normalized_parts[index])?;
        index += 1;
        algorithm
    };

    if index >= normalized_parts.len() {
        anyhow::bail!(
            "Invalid ID interpolation pattern format: [{}]. Expected [hash:digest:encoding:length]",
            token
        );
    }

    let digest_type = match normalized_parts[index].as_str() {
        "contenthash" | "hash" => DigestType::ContentHash,
        _ => anyhow::bail!("Unsupported digest type: {}", parts[index]),
    };
    index += 1;

    let encoding = if index < normalized_parts.len()
        && !normalized_parts[index]
            .chars()
            .all(|ch| ch.is_ascii_digit())
    {
        let encoding = parse_encoding(&normalized_parts[index], parts[index])?;
        index += 1;
        encoding
    } else {
        Encoding::Hex
    };

    if index >= normalized_parts.len() {
        anyhow::bail!(
            "Invalid ID interpolation pattern format: [{}]. Expected [hash:digest:encoding:length]",
            token
        );
    }

    let length: usize = parts[index]
        .parse()
        .context("Invalid length in ID interpolation pattern")?;
    if length == 0 {
        anyhow::bail!(
            "Invalid length in ID interpolation pattern: {}",
            parts[index]
        );
    }
    index += 1;

    if index != normalized_parts.len() {
        anyhow::bail!("Invalid ID interpolation pattern: [{}]", token);
    }

    Ok(HashInterpolation {
        hash_algorithm,
        digest_type,
        encoding,
        length,
    })
}

fn is_digest_type(part: &str) -> bool {
    matches!(part, "contenthash" | "hash")
}

fn parse_hash_algorithm(part: &str) -> Result<HashAlgorithm> {
    match part {
        "md5" => Ok(HashAlgorithm::Md5),
        "sha1" => Ok(HashAlgorithm::Sha1),
        "sha224" => Ok(HashAlgorithm::Sha224),
        "sha256" => Ok(HashAlgorithm::Sha256),
        "sha384" => Ok(HashAlgorithm::Sha384),
        "sha512" => Ok(HashAlgorithm::Sha512),
        _ => anyhow::bail!("Unsupported hash algorithm: {}", part),
    }
}

fn parse_encoding(normalized: &str, original: &str) -> Result<Encoding> {
    match normalized {
        "base64" => Ok(Encoding::Base64),
        "base64url" => Ok(Encoding::Base64Url),
        "base62" => Ok(Encoding::Base62),
        "hex" => Ok(Encoding::Hex),
        _ => anyhow::bail!("Unsupported encoding: {}", original),
    }
}

fn hash_content(default_message: Option<&str>, description: &Option<Value>) -> Vec<u8> {
    let mut content = Vec::new();
    if let Some(msg) = default_message {
        content.extend_from_slice(msg.as_bytes());
    }
    if let Some(desc) = description {
        content.push(b'#');
        // Extract string value for string types to match TypeScript CLI behavior.
        // TypeScript uses: typeof description === 'string' ? description : stringify(description)
        match desc {
            Value::String(s) => content.extend_from_slice(s.as_bytes()),
            _ => content.extend_from_slice(desc.to_string().as_bytes()),
        }
    }
    content
}

fn hash_with<D: Digest>(content: &[u8]) -> Vec<u8> {
    let mut hasher = D::new();
    hasher.update(content);
    hasher.finalize().to_vec()
}

fn encode_digest(digest: &[u8], encoding: Encoding) -> String {
    match encoding {
        Encoding::Base64 => {
            // Standard base64 (matches Node's crypto.digest('base64'))
            base64::engine::general_purpose::STANDARD.encode(digest)
        }
        Encoding::Base64Url => {
            // URL-safe base64 without padding (matches Node's crypto.digest('base64url'))
            base64::engine::general_purpose::URL_SAFE_NO_PAD.encode(digest)
        }
        Encoding::Base62 => encode_base62(digest),
        Encoding::Hex => hex::encode(digest),
    }
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
    fn test_generate_id_with_description_affects_hash() {
        let desc = serde_json::Value::String("Description".to_string());
        let id1 =
            generate_id("[sha512:contenthash:base64:10]", Some("Hello"), &None, None).unwrap();
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
}
