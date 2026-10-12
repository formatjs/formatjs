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
    Content,
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
/// placeholders in the format `[hash:digest:encoding:length]`, file-name
/// placeholders such as `[name]` and `[ext]`, as well as `[content]` for the
/// unhashed message content.
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
/// - `[content]` - the default message (plus #description, if present) with no hashing
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
        let content = message_content(default_message, description);
        let resource_path_parts = ResourcePathParts::from_path(file_path);
        let mut id = String::new();

        for part in &self.parts {
            match part {
                InterpolationPart::Literal(value) => id.push_str(value),
                InterpolationPart::Hash(hash) => id.push_str(&hash.generate(content.as_bytes())),
                InterpolationPart::Content => id.push_str(&content),
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
        "content" => Ok((InterpolationPart::Content, true)),
        _ if is_hash_interpolation(token) => Ok((
            InterpolationPart::Hash(parse_hash_interpolation(token)?),
            true,
        )),
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

fn message_content(default_message: Option<&str>, description: &Option<Value>) -> String {
    let mut content = String::new();
    if let Some(msg) = default_message {
        content.push_str(msg);
    }
    if let Some(desc) = description {
        if desc.as_str() == Some("") {
            return content;
        }
        content.push('#');
        // Extract string value for string types to match TypeScript CLI behavior.
        // TypeScript uses: typeof description === 'string' ? description : stringify(description)
        match desc {
            Value::String(s) => content.push_str(s),
            _ => content.push_str(&desc.to_string()),
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
