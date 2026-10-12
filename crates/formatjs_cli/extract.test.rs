use anyhow::Result;
use formatjs_cli::extract::*;
use formatjs_cli::formatters::Formatter;
use std::fs;
use std::io::{self};
use std::path::{Path, PathBuf};

#[test]
fn test_read_file_list() {
    let directory = tempfile::tempdir().unwrap();
    let paths: Vec<_> = ["file1.ts", "file2.tsx", "file3.js"]
        .map(|name| directory.path().join(name))
        .into();
    for path in &paths {
        write_source(path).unwrap();
    }
    let list = directory.path().join("inputs.txt");
    fs::write(
        &list,
        format!(
            "{}\n{}\n\n{}\n",
            paths[0].display(),
            paths[1].display(),
            paths[2].display()
        ),
    )
    .unwrap();
    let output = extract_to_string(
        &[],
        None,
        Some(&list),
        "[content]",
        true,
        &[],
        &[],
        &[],
        true,
        None,
        false,
        false,
        true,
    )
    .unwrap();
    let catalog: serde_json::Value = serde_json::from_str(&output).unwrap();
    assert_eq!(catalog.as_object().unwrap().len(), 3);
    for path in paths {
        assert!(catalog.get(path.to_str().unwrap()).is_some());
    }
}

#[test]
fn test_is_supported_file() {
    let directory = tempfile::tempdir().unwrap();
    for extension in [
        "ts", "tsx", "mts", "cts", "js", "jsx", "mjs", "cjs", "rs", "py",
    ] {
        let path = directory.path().join(format!("message.{extension}"));
        let source = match extension {
            "rs" => r#"fn main() { let _ = message_descriptor!(id: "supported", default_message: "Supported"); }"#.to_owned(),
            "py" => "message = define_message(id='supported', default_message='Supported')".into(),
            _ => "defineMessage({id:'supported',defaultMessage:'Supported'})".into(),
        };
        fs::write(&path, source).unwrap();
        let catalog = extract_to_string(
            &[path],
            None,
            None,
            "[content]",
            false,
            &[],
            &[],
            &[],
            true,
            None,
            false,
            false,
            true,
        )
        .unwrap();
        assert!(
            serde_json::from_str::<serde_json::Value>(&catalog)
                .unwrap()
                .get("supported")
                .is_some(),
            "{extension}"
        );
    }
    let unsupported = directory.path().join("message.txt");
    write_source(&unsupported).unwrap();
    assert!(extracted_files(&[unsupported], &[], true, true).is_err());
}

#[test]
fn test_build_component_names() {
    let result = virtual_sources(
        "<><FormattedMessage id='base' defaultMessage='Base'/><CustomMessage id='custom' defaultMessage='Custom'/><T id='short' defaultMessage='Short'/></>",
        &["CustomMessage".into(), "T".into()],
        &[],
        None,
    );
    assert_eq!(result.files[0].messages.len(), 3);
}

#[test]
fn test_build_function_names() {
    let result = virtual_sources(
        "defineMessage({id:'single',defaultMessage:'One'}); defineMessages({m:{id:'many',defaultMessage:'Many'}}); intl.formatMessage({id:'format',defaultMessage:'Format'}); $formatMessage({id:'dollar',defaultMessage:'Dollar'}); $t({id:'t',defaultMessage:'T'}); customFormat({id:'custom',defaultMessage:'Custom'});",
        &[],
        &["customFormat".into()],
        None,
    );
    assert_eq!(result.files[0].messages.len(), 6);
}

#[test]
fn test_extract_pragma() {
    let source = "// @formatjs project:my-app locale:en-US\n// @formatjs region:header";
    let result = virtual_sources(source, &[], &[], Some("@formatjs"));
    let meta = &result.files[0].meta;
    assert_eq!(meta.len(), 3);
    assert_eq!(meta.get("project").map(String::as_str), Some("my-app"));
    assert_eq!(meta.get("locale").map(String::as_str), Some("en-US"));
    assert_eq!(meta.get("region").map(String::as_str), Some("header"));
}

#[test]
fn test_should_ignore() {
    let directory = tempfile::tempdir().unwrap();
    let mut paths = Vec::new();
    for name in ["src/node_modules/foo.ts", "src/app.test.ts", "src/app.ts"] {
        let path = directory.path().join(name);
        fs::create_dir_all(path.parent().unwrap()).unwrap();
        write_source(&path).unwrap();
        paths.push(path);
    }
    let files = extracted_files(
        &paths,
        &["**/node_modules/**".into(), "**/*.test.ts".into()],
        true,
        true,
    )
    .unwrap();
    assert_eq!(files, vec![paths[2].clone()]);
}

#[test]
fn test_resolve_files_with_brace_expansion() {
    let temp_dir = tempfile::tempdir().unwrap();
    let src_dir = temp_dir.path().join("src");
    fs::create_dir_all(&src_dir).unwrap();

    write_source(src_dir.join("app.ts")).unwrap();
    write_source(src_dir.join("app.tsx")).unwrap();
    write_source(src_dir.join("app.js")).unwrap();
    write_source(src_dir.join("app.py")).unwrap();

    let pattern = format!("{}/**/*.{{ts,tsx}}", temp_dir.path().display());
    let globs = vec![PathBuf::from(&pattern)];
    let files = extracted_files(&globs, &[], true, false).unwrap();

    assert_eq!(files.len(), 2);
    let extensions: Vec<String> = files
        .iter()
        .map(|f| f.extension().unwrap().to_string_lossy().to_string())
        .collect();
    assert!(extensions.contains(&"ts".to_string()));
    assert!(extensions.contains(&"tsx".to_string()));
}

#[test]
fn test_extract_brace_expansion_e2e() {
    // End-to-end test reproducing issue #6168:
    // `formatjs extract "src/**/*.{ts,tsx}"` should find both .ts and .tsx files
    let temp_dir = tempfile::tempdir().unwrap();
    let src_dir = temp_dir.path().join("src");
    fs::create_dir_all(&src_dir).unwrap();

    // Create .ts file with a message
    fs::write(
        src_dir.join("utils.ts"),
        r#"
import { defineMessage } from 'react-intl';
const msg = defineMessage({
    id: 'from.ts',
    defaultMessage: 'From TypeScript',
});
"#,
    )
    .unwrap();

    // Create .tsx file with a message
    fs::write(
        src_dir.join("App.tsx"),
        r#"
import { defineMessage } from 'react-intl';
const msg = defineMessage({
    id: 'from.tsx',
    defaultMessage: 'From TSX',
});
"#,
    )
    .unwrap();

    // Create .js file that should NOT be matched by the {ts,tsx} pattern
    fs::write(
        src_dir.join("legacy.js"),
        r#"
import { defineMessage } from 'react-intl';
const msg = defineMessage({
    id: 'from.js',
    defaultMessage: 'From JavaScript',
});
"#,
    )
    .unwrap();

    let output_file = temp_dir.path().join("output.json");

    // Use brace expansion pattern like the issue describes
    let pattern = format!("{}/**/*.{{ts,tsx}}", temp_dir.path().display());
    extract(
        &[PathBuf::from(&pattern)],
        None,
        None,
        Some(&output_file),
        "[sha512:contenthash:base64:6]",
        false,
        &[],
        &[],
        &[],
        false,
        None,
        false,
        false,
        true, // follow links
    )
    .unwrap();

    let output_content = std::fs::read_to_string(&output_file).unwrap();
    let json: serde_json::Value = serde_json::from_str(&output_content).unwrap();

    // Should have exactly 2 messages (from .ts and .tsx, but NOT from .js)
    assert_eq!(json.as_object().unwrap().len(), 2);
    assert!(
        json.get("from.ts").is_some(),
        "Should find message from .ts file"
    );
    assert!(
        json.get("from.tsx").is_some(),
        "Should find message from .tsx file"
    );
    assert!(
        json.get("from.js").is_none(),
        "Should NOT find message from .js file"
    );
}

#[test]
fn test_extract_to_string_returns_serialized_messages() {
    let temp_dir = tempfile::tempdir().unwrap();
    let file = temp_dir.path().join("app.ts");
    fs::write(
        &file,
        r#"
import { defineMessage } from 'react-intl';
const msg = defineMessage({
    id: 'native.extract',
    defaultMessage: 'Extracted by native binding',
});
"#,
    )
    .unwrap();

    let output = extract_to_string(
        &[file],
        None,
        None,
        "[sha512:contenthash:base64:6]",
        false,
        &[],
        &[],
        &[],
        true,
        None,
        false,
        false,
        true,
    )
    .unwrap();
    let json: serde_json::Value = serde_json::from_str(&output).unwrap();

    assert_eq!(
        json["native.extract"]["defaultMessage"],
        "Extracted by native binding"
    );
}

#[test]
fn test_extract_to_string_reads_rust_message_macro() {
    let temp_dir = tempfile::tempdir().unwrap();
    let file = temp_dir.path().join("main.rs");
    fs::write(
        &file,
        r#"
fn main() {
    let descriptor = message_descriptor!(
        default_message: "Hello, {name}!",
        description: "Greeting"
    );
}
"#,
    )
    .unwrap();

    let output = extract_to_string(
        &[file],
        None,
        None,
        "[sha512:contenthash:base64:6]",
        false,
        &[],
        &[],
        &[],
        true,
        None,
        false,
        false,
        true,
    )
    .unwrap();
    let json: serde_json::Value = serde_json::from_str(&output).unwrap();

    assert_eq!(json["EG1xJTTqQy"]["defaultMessage"], "Hello, {name}!");
    assert_eq!(json["EG1xJTTqQy"]["description"], "Greeting");
    assert_eq!(json.as_object().unwrap().len(), 1);
}

#[test]
fn test_extract_to_string_reads_python_message_declaration() {
    let temp_dir = tempfile::tempdir().unwrap();
    let file = temp_dir.path().join("messages.py");
    fs::write(
        &file,
        r#"
from my_app.i18n import define_message

GREETING = define_message(
    id="greeting",
    default_message="Hello, {name}!",
    description="Greeting shown on the home page",
)
"#,
    )
    .unwrap();

    let output = extract_to_string(
        &[file],
        None,
        None,
        "[sha512:contenthash:base64:6]",
        false,
        &[],
        &[],
        &[],
        true,
        None,
        false,
        false,
        true,
    )
    .unwrap();
    let json: serde_json::Value = serde_json::from_str(&output).unwrap();

    assert_eq!(json["greeting"]["defaultMessage"], "Hello, {name}!");
    assert_eq!(
        json["greeting"]["description"],
        "Greeting shown on the home page"
    );
    assert_eq!(json.as_object().unwrap().len(), 1);
}

#[test]
fn test_extract_to_string_reads_python_format_message_call() {
    let temp_dir = tempfile::tempdir().unwrap();
    let file = temp_dir.path().join("messages.py");
    fs::write(
        &file,
        r#"
from intl import Intl

greeting = intl.format_message(
    default_message="Hello, {name}!",
    values={"name": user.name},
)
"#,
    )
    .unwrap();

    let output = extract_to_string(
        &[file],
        None,
        None,
        "[sha512:contenthash:base64:6]",
        false,
        &[],
        &[],
        &[],
        true,
        None,
        false,
        false,
        true,
    )
    .unwrap();
    let json: serde_json::Value = serde_json::from_str(&output).unwrap();

    let message = json.as_object().unwrap().values().next().unwrap();
    assert_eq!(message["defaultMessage"], "Hello, {name}!");
    assert_eq!(json.as_object().unwrap().len(), 1);
}

#[test]
fn test_extract_base_dir() {
    assert_eq!(extract_base_dir("src/**/*.ts"), PathBuf::from("src"));
    assert_eq!(
        extract_base_dir("src/components/**/*.tsx"),
        PathBuf::from("src/components")
    );
    assert_eq!(extract_base_dir("**/*.ts"), PathBuf::from("."));
    assert_eq!(extract_base_dir("*.ts"), PathBuf::from("."));
    assert_eq!(
        extract_base_dir("/absolute/path/**/*.ts"),
        PathBuf::from("/absolute/path")
    );
    // Brace expansion: wildcard is `{`
    assert_eq!(extract_base_dir("src/**/*.{ts,tsx}"), PathBuf::from("src"));
    // Literal path (no wildcards) returns parent dir
    assert_eq!(extract_base_dir("src/app.ts"), PathBuf::from("src"));
    assert_eq!(
        extract_base_dir(r"src\components\*.tsx"),
        PathBuf::from(r"src\components")
    );
    assert_eq!(
        extract_base_dir(r"C:\repo\src\*.tsx"),
        PathBuf::from(r"C:\repo\src")
    );
    assert_eq!(extract_base_dir(r"C:\*.tsx"), PathBuf::from(r"C:\"));
    // Question mark wildcard
    assert_eq!(extract_base_dir("src/?.ts"), PathBuf::from("src"));
    // Bracket wildcard
    assert_eq!(extract_base_dir("src/[abc].ts"), PathBuf::from("src"));
}

#[test]
fn test_resolve_files_with_ignore_patterns() {
    let temp_dir = tempfile::tempdir().unwrap();
    let src_dir = temp_dir.path().join("src");
    let node_modules = src_dir.join("node_modules/pkg");
    fs::create_dir_all(&src_dir).unwrap();
    fs::create_dir_all(&node_modules).unwrap();

    write_source(src_dir.join("app.ts")).unwrap();
    write_source(src_dir.join("app.test.ts")).unwrap();
    write_source(node_modules.join("lib.ts")).unwrap();

    let pattern = format!("{}/**/*.ts", temp_dir.path().display());
    let globs = vec![PathBuf::from(&pattern)];
    let ignore = vec!["**/node_modules/**".to_string(), "**/*.test.ts".to_string()];
    let files = extracted_files(&globs, &ignore, true, false).unwrap();

    assert_eq!(files.len(), 1);
    assert!(files[0].to_string_lossy().contains("app.ts"));
    assert!(!files[0].to_string_lossy().contains("test"));
}

#[test]
fn test_resolve_files_nested_directories() {
    let temp_dir = tempfile::tempdir().unwrap();
    let deep = temp_dir.path().join("a/b/c");
    fs::create_dir_all(&deep).unwrap();

    write_source(temp_dir.path().join("a/top.ts")).unwrap();
    write_source(deep.join("deep.tsx")).unwrap();

    let pattern = format!("{}/**/*.{{ts,tsx}}", temp_dir.path().display());
    let globs = vec![PathBuf::from(&pattern)];
    let files = extracted_files(&globs, &[], true, false).unwrap();

    assert_eq!(files.len(), 2);
    let names: Vec<String> = files
        .iter()
        .map(|f| f.file_name().unwrap().to_string_lossy().to_string())
        .collect();
    assert!(names.contains(&"top.ts".to_string()));
    assert!(names.contains(&"deep.tsx".to_string()));
}

#[test]
fn test_resolve_files_nonexistent_base_dir() {
    let globs = vec![PathBuf::from("/nonexistent/path/**/*.ts")];
    let files = extracted_files(&globs, &[], true, false).unwrap();
    assert!(files.is_empty());
}

#[test]
fn test_resolve_files_nonexistent_base_dir_throws() {
    let globs = vec![PathBuf::from("/nonexistent/path/**/*.ts")];
    let error = extracted_files(&globs, &[], true, true).unwrap_err();

    assert!(
        error
            .to_string()
            .contains("base directory /nonexistent/path does not exist")
    );
}

#[test]
fn test_resolve_files_missing_literal_throws() {
    let temp_dir = tempfile::tempdir().unwrap();
    let missing_file = temp_dir.path().join("missing.tsx");
    let error = extracted_files(&[missing_file.clone()], &[], true, true).unwrap_err();

    assert!(error.to_string().contains(&format!(
        "Failed to resolve input file {}",
        missing_file.display()
    )));
}

#[test]
fn test_resolve_files_unsupported_literal_throws() {
    let temp_dir = tempfile::tempdir().unwrap();
    let unsupported_file = temp_dir.path().join("messages.txt");
    write_source(&unsupported_file).unwrap();
    let error = extracted_files(&[unsupported_file.clone()], &[], true, true).unwrap_err();

    assert_eq!(
        error.to_string(),
        format!(
            "Unsupported input file type: {}",
            unsupported_file.display()
        )
    );
}

#[cfg(unix)]
#[test]
fn test_resolve_files_walk_error_throws() {
    use std::os::unix::fs::symlink;

    let temp_dir = tempfile::tempdir().unwrap();
    symlink(temp_dir.path(), temp_dir.path().join("loop")).unwrap();
    let pattern = format!("{}/**/*.ts", temp_dir.path().display());
    let error = extracted_files(&[PathBuf::from(pattern)], &[], true, true).unwrap_err();

    assert!(error.to_string().contains("Failed to traverse files"));
}

#[test]
fn test_resolve_files_literal_path() {
    // Literal file paths (no glob characters) should also resolve
    let temp_dir = tempfile::tempdir().unwrap();
    let file = temp_dir.path().join("app.ts");
    write_source(&file).unwrap();

    let globs = vec![file.clone()];
    let files = extracted_files(&globs, &[], true, false).unwrap();

    assert_eq!(files.len(), 1);
    assert_eq!(files[0], file);
}

#[test]
fn test_resolve_files_literal_path_containing_glob_metacharacters() {
    let temp_dir = tempfile::tempdir().unwrap();
    let subdir = temp_dir.path().join("messages[prod]");
    fs::create_dir_all(&subdir).unwrap();
    let file = subdir.join("primary.tsx");
    write_source(&file).unwrap();

    let globs = vec![file.clone()];
    let files = extracted_files(&globs, &[], true, false).unwrap();

    assert_eq!(files.len(), 1);
    assert_eq!(files[0], file);
}

#[test]
fn test_extract_sorted_keys() {
    // Create a temporary test file with multiple messages in unsorted order
    let temp_dir = tempfile::tempdir().unwrap();
    let test_file = temp_dir.path().join("test.tsx");
    let output_file = temp_dir.path().join("output.json");

    // Write test file with messages that would naturally be in unsorted order
    let test_content = r#"
import { defineMessages } from 'react-intl';

const messages = defineMessages({
  zebra: {
    id: 'zebra',
    defaultMessage: 'Zebra message',
  },
  apple: {
    id: 'apple',
    defaultMessage: 'Apple message',
  },
  mango: {
    id: 'mango',
    defaultMessage: 'Mango message',
  },
  banana: {
    id: 'banana',
    defaultMessage: 'Banana message',
  },
});
"#;
    std::fs::write(&test_file, test_content).unwrap();

    // Extract messages
    extract(
        &[test_file],
        None,
        None,
        Some(&output_file),
        "[sha512:contenthash:base64:6]",
        false,
        &[],
        &[],
        &[],
        false,
        None,
        false,
        false,
        true, // follow links
    )
    .unwrap();

    // Read the output file and verify exact content
    let output_content = std::fs::read_to_string(&output_file).unwrap();

    // Verify the entire output matches expected sorted JSON with newline
    // The 'id' field should NOT be included in the output (matches TypeScript CLI behavior)
    let expected = r#"{
  "apple": {
    "defaultMessage": "Apple message"
  },
  "banana": {
    "defaultMessage": "Banana message"
  },
  "mango": {
    "defaultMessage": "Mango message"
  },
  "zebra": {
    "defaultMessage": "Zebra message"
  }
}
"#;
    assert_eq!(
        output_content, expected,
        "Output should be sorted with trailing newline"
    );
}

#[test]
fn test_extract_sorted_keys_with_default_formatter() {
    // Create a temporary test file
    let temp_dir = tempfile::tempdir().unwrap();
    let test_file = temp_dir.path().join("test.tsx");
    let output_file = temp_dir.path().join("output.json");

    // Write test file with messages in unsorted order
    let test_content = r#"
import { defineMessages } from 'react-intl';

const messages = defineMessages({
  zulu: {
    id: 'zulu',
    defaultMessage: 'Zulu message',
  },
  alpha: {
    id: 'alpha',
    defaultMessage: 'Alpha message',
  },
  charlie: {
    id: 'charlie',
    defaultMessage: 'Charlie message',
  },
});
"#;
    std::fs::write(&test_file, test_content).unwrap();

    // Extract messages with Default formatter (outputs vendor format with id + defaultMessage)
    extract(
        &[test_file],
        Some(Formatter::Default),
        None,
        Some(&output_file),
        "[sha512:contenthash:base64:6]",
        false,
        &[],
        &[],
        &[],
        false,
        None,
        false,
        false,
        true, // follow links
    )
    .unwrap();

    // Read the output file and parse as JSON
    let output_content = std::fs::read_to_string(&output_file).unwrap();
    let json: serde_json::Value = serde_json::from_str(&output_content).unwrap();

    // Verify we have 3 sorted keys
    let keys: Vec<&str> = json
        .as_object()
        .unwrap()
        .keys()
        .map(|s| s.as_str())
        .collect();
    assert_eq!(
        keys,
        vec!["alpha", "charlie", "zulu"],
        "Keys should be sorted"
    );

    // Verify the Default formatter outputs the vendor format (MessageDescriptor structure)
    let alpha = json.get("alpha").unwrap().as_object().unwrap();
    assert_eq!(alpha.get("defaultMessage").unwrap(), "Alpha message");

    let charlie = json.get("charlie").unwrap().as_object().unwrap();
    assert_eq!(charlie.get("defaultMessage").unwrap(), "Charlie message");

    let zulu = json.get("zulu").unwrap().as_object().unwrap();
    assert_eq!(zulu.get("defaultMessage").unwrap(), "Zulu message");
}

#[test]
fn test_extract_with_custom_id_interpolation_pattern() {
    // Test extraction with custom ID pattern for messages without explicit IDs
    let temp_dir = tempfile::tempdir().unwrap();
    let test_file = temp_dir.path().join("test.tsx");
    let output_file = temp_dir.path().join("output.json");

    // Write test file with messages that don't have explicit IDs
    let test_content = r#"
import { defineMessage } from 'react-intl';

const greeting = defineMessage({
  defaultMessage: 'Hello World',
});
"#;
    std::fs::write(&test_file, test_content).unwrap();

    // Extract with custom pattern: shorter ID with hex encoding
    extract(
        &[test_file],
        None,
        None,
        Some(&output_file),
        "[sha512:contenthash:hex:8]",
        false,
        &[],
        &[],
        &[],
        false,
        None,
        false,
        false,
        true, // follow links
    )
    .unwrap();

    // Read and verify output
    let output_content = std::fs::read_to_string(&output_file).unwrap();
    let json: serde_json::Value = serde_json::from_str(&output_content).unwrap();

    // Should have one message with generated ID
    assert_eq!(json.as_object().unwrap().len(), 1);

    // Get the generated ID
    let (id, message) = json.as_object().unwrap().iter().next().unwrap();

    // Verify ID is 8 characters of hex
    assert_eq!(id.len(), 8, "Generated ID should be 8 characters");
    assert!(
        id.chars().all(|c| c.is_ascii_hexdigit()),
        "Generated ID should be hexadecimal"
    );

    // Verify message content
    assert_eq!(message["defaultMessage"].as_str().unwrap(), "Hello World");
}

#[test]
fn test_extract_with_loader_utils_id_interpolation_template() {
    let temp_dir = tempfile::tempdir().unwrap();
    let test_file = temp_dir.path().join("a.ts");
    let output_file = temp_dir.path().join("output.json");

    let test_content = r#"
import { defineMessages } from 'react-intl';

export const messages = defineMessages({
  hello: {
    defaultMessage: 'Hello',
  },
});
"#;
    std::fs::write(&test_file, test_content).unwrap();

    extract(
        &[test_file],
        None,
        None,
        Some(&output_file),
        "[name].[ext]_[sha512:contenthash:base64:6]",
        false,
        &[],
        &[],
        &[],
        false,
        None,
        false,
        false,
        true,
    )
    .unwrap();

    let output_content = std::fs::read_to_string(&output_file).unwrap();
    let json: serde_json::Value = serde_json::from_str(&output_content).unwrap();
    assert!(json.get("a.ts_NhX4DJ").is_some());
    assert_eq!(
        json["a.ts_NhX4DJ"]["defaultMessage"].as_str().unwrap(),
        "Hello"
    );
}

#[test]
fn test_extract_id_interpolation_normalizes_escaped_unicode_whitespace() {
    let temp_dir = tempfile::tempdir().unwrap();
    let test_file = temp_dir.path().join("Conversation.tsx");
    let output_file = temp_dir.path().join("output.json");

    let test_content = r#"
intl.formatMessage({
  defaultMessage: "🤖\u0085\u2002Conversations",
});
"#;
    std::fs::write(&test_file, test_content).unwrap();

    extract(
        &[test_file],
        None,
        None,
        Some(&output_file),
        "[name].[ext]_[sha512:contenthash:base64:6]",
        false,
        &[],
        &[],
        &[],
        false,
        None,
        false,
        false,
        true,
    )
    .unwrap();

    let output_content = std::fs::read_to_string(&output_file).unwrap();
    let json: serde_json::Value = serde_json::from_str(&output_content).unwrap();
    assert!(json.get("Conversation.tsx_yYmfIl").is_some());
    assert_eq!(
        json["Conversation.tsx_yYmfIl"]["defaultMessage"]
            .as_str()
            .unwrap(),
        "🤖 Conversations"
    );
}

#[test]
fn test_extract_with_legacy_and_sha_id_interpolation_patterns() {
    let temp_dir = tempfile::tempdir().unwrap();
    let test_file = temp_dir.path().join("test.tsx");
    let output_file = temp_dir.path().join("output.json");

    let test_content = r#"
import { defineMessage } from 'react-intl';

const greeting = defineMessage({
  defaultMessage: 'Hello World',
});
"#;
    std::fs::write(&test_file, test_content).unwrap();

    extract(
        &[test_file.clone()],
        None,
        None,
        Some(&output_file),
        "[sha256:contenthash:hex:5]",
        false,
        &[],
        &[],
        &[],
        false,
        None,
        false,
        false,
        true,
    )
    .unwrap();

    let output_content = std::fs::read_to_string(&output_file).unwrap();
    let json: serde_json::Value = serde_json::from_str(&output_content).unwrap();
    assert!(json.get("a591a").is_some());

    extract(
        &[test_file],
        None,
        None,
        Some(&output_file),
        "[contenthash:5]",
        false,
        &[],
        &[],
        &[],
        false,
        None,
        false,
        false,
        true,
    )
    .unwrap();

    let output_content = std::fs::read_to_string(&output_file).unwrap();
    let json: serde_json::Value = serde_json::from_str(&output_content).unwrap();
    assert!(json.get("b10a8").is_some());
}

#[test]
fn test_extract_with_different_id_patterns() {
    // Test that different patterns produce different IDs for the same message
    let temp_dir = tempfile::tempdir().unwrap();
    let test_file = temp_dir.path().join("test.tsx");

    let test_content = r#"
import { defineMessage } from 'react-intl';

const msg = defineMessage({
  defaultMessage: 'Test Message',
});
"#;
    std::fs::write(&test_file, test_content).unwrap();

    // Test with base64 pattern
    let output_file1 = temp_dir.path().join("output1.json");
    extract(
        &[test_file.clone()],
        None,
        None,
        Some(&output_file1),
        "[sha512:contenthash:base64:10]",
        false,
        &[],
        &[],
        &[],
        false,
        None,
        false,
        false,
        true, // follow links
    )
    .unwrap();

    // Test with hex pattern
    let output_file2 = temp_dir.path().join("output2.json");
    extract(
        &[test_file],
        None,
        None,
        Some(&output_file2),
        "[sha512:contenthash:hex:10]",
        false,
        &[],
        &[],
        &[],
        false,
        None,
        false,
        false,
        true, // follow links
    )
    .unwrap();

    // Read both outputs
    let json1: serde_json::Value =
        serde_json::from_str(&std::fs::read_to_string(&output_file1).unwrap()).unwrap();
    let json2: serde_json::Value =
        serde_json::from_str(&std::fs::read_to_string(&output_file2).unwrap()).unwrap();

    // Get the generated IDs
    let id1 = json1.as_object().unwrap().keys().next().unwrap();
    let id2 = json2.as_object().unwrap().keys().next().unwrap();

    // IDs should be different due to different encoding
    assert_ne!(id1, id2, "Different patterns should produce different IDs");

    // Both should be 10 characters
    assert_eq!(id1.len(), 10);
    assert_eq!(id2.len(), 10);
}

#[test]
fn test_extract_with_base62_interpolation_pattern() {
    // Test extraction with base62 ID pattern for messages without explicit IDs
    let temp_dir = tempfile::tempdir().unwrap();
    let test_file = temp_dir.path().join("test.tsx");
    let output_file = temp_dir.path().join("output.json");

    // Write test file with messages that don't have explicit IDs
    let test_content = r#"
import { defineMessages } from 'react-intl';

const messages = defineMessages({
  greeting: {
    defaultMessage: 'Hello World!',
    description: 'Greeting message',
  },
  farewell: {
    defaultMessage: 'Goodbye!',
    description: 'Farewell message',
  },
});
"#;
    std::fs::write(&test_file, test_content).unwrap();

    // Extract with base62 pattern
    extract(
        &[test_file],
        None,
        None,
        Some(&output_file),
        "[sha512:contenthash:base62:8]",
        false,
        &[],
        &[],
        &[],
        false,
        None,
        false,
        false,
        true, // follow links
    )
    .unwrap();

    // Read and verify output
    let output_content = std::fs::read_to_string(&output_file).unwrap();
    let json: serde_json::Value = serde_json::from_str(&output_content).unwrap();

    // Should have two messages with generated IDs
    assert_eq!(json.as_object().unwrap().len(), 2);

    // Verify all generated IDs are base62 (alphanumeric only)
    for (id, _) in json.as_object().unwrap() {
        assert_eq!(id.len(), 8, "Generated ID should be 8 characters");
        assert!(
            id.chars().all(|c| c.is_ascii_alphanumeric()),
            "Base62 ID should only contain alphanumeric characters, got: {}",
            id
        );
        // Should not contain base64 special characters
        assert!(!id.contains('+'), "Base62 should not contain +");
        assert!(!id.contains('/'), "Base62 should not contain /");
        assert!(!id.contains('-'), "Base62 should not contain -");
        assert!(!id.contains('_'), "Base62 should not contain _");
        assert!(!id.contains('='), "Base62 should not contain =");
    }
}

#[test]
fn test_extract_base62_vs_base64_vs_hex() {
    // Test that all three encodings produce different IDs for the same message
    let temp_dir = tempfile::tempdir().unwrap();
    let test_file = temp_dir.path().join("test.tsx");

    let test_content = r#"
import { defineMessage } from 'react-intl';

const msg = defineMessage({
  defaultMessage: 'Test message for encoding comparison',
});
"#;
    std::fs::write(&test_file, test_content).unwrap();

    // Extract with base62
    let output_base62 = temp_dir.path().join("output_base62.json");
    extract(
        &[test_file.clone()],
        None,
        None,
        Some(&output_base62),
        "[sha512:contenthash:base62:10]",
        false,
        &[],
        &[],
        &[],
        false,
        None,
        false,
        false,
        true, // follow links
    )
    .unwrap();

    // Extract with base64
    let output_base64 = temp_dir.path().join("output_base64.json");
    extract(
        &[test_file.clone()],
        None,
        None,
        Some(&output_base64),
        "[sha512:contenthash:base64:10]",
        false,
        &[],
        &[],
        &[],
        false,
        None,
        false,
        false,
        true, // follow links
    )
    .unwrap();

    // Extract with hex
    let output_hex = temp_dir.path().join("output_hex.json");
    extract(
        &[test_file],
        None,
        None,
        Some(&output_hex),
        "[sha512:contenthash:hex:10]",
        false,
        &[],
        &[],
        &[],
        false,
        None,
        false,
        false,
        true, // follow links
    )
    .unwrap();

    // Read all outputs
    let json_base62: serde_json::Value =
        serde_json::from_str(&std::fs::read_to_string(&output_base62).unwrap()).unwrap();
    let json_base64: serde_json::Value =
        serde_json::from_str(&std::fs::read_to_string(&output_base64).unwrap()).unwrap();
    let json_hex: serde_json::Value =
        serde_json::from_str(&std::fs::read_to_string(&output_hex).unwrap()).unwrap();

    // Get the generated IDs
    let id_base62 = json_base62.as_object().unwrap().keys().next().unwrap();
    let id_base64 = json_base64.as_object().unwrap().keys().next().unwrap();
    let id_hex = json_hex.as_object().unwrap().keys().next().unwrap();

    // All IDs should be different
    assert_ne!(
        id_base62, id_base64,
        "Base62 and base64 should produce different IDs"
    );
    assert_ne!(
        id_base62, id_hex,
        "Base62 and hex should produce different IDs"
    );
    assert_ne!(
        id_base64, id_hex,
        "Base64 and hex should produce different IDs"
    );

    // All should be 10 characters
    assert_eq!(id_base62.len(), 10);
    assert_eq!(id_base64.len(), 10);
    assert_eq!(id_hex.len(), 10);

    // Verify character sets
    assert!(
        id_base62.chars().all(|c| c.is_ascii_alphanumeric()),
        "Base62 should only contain alphanumeric characters"
    );
    assert!(
        id_hex.chars().all(|c| c.is_ascii_hexdigit()),
        "Hex should only contain hex digits"
    );
}

#[test]
fn test_extract_messages_without_id_use_pattern() {
    // Test that messages without explicit IDs get auto-generated IDs
    let temp_dir = tempfile::tempdir().unwrap();
    let test_file = temp_dir.path().join("test.tsx");
    let output_file = temp_dir.path().join("output.json");

    let test_content = r#"
import { defineMessages } from 'react-intl';

const messages = defineMessages({
  withId: {
    id: 'explicit.id',
    defaultMessage: 'Message with explicit ID',
  },
  withoutId: {
    defaultMessage: 'Message without ID',
  },
});
"#;
    std::fs::write(&test_file, test_content).unwrap();

    extract(
        &[test_file],
        None,
        None,
        Some(&output_file),
        "[sha512:contenthash:base64:6]",
        false,
        &[],
        &[],
        &[],
        false,
        None,
        false,
        false,
        true, // follow links
    )
    .unwrap();

    let output_content = std::fs::read_to_string(&output_file).unwrap();
    let json: serde_json::Value = serde_json::from_str(&output_content).unwrap();

    // Should have two messages
    assert_eq!(json.as_object().unwrap().len(), 2);

    // One should have the explicit ID
    assert!(json.as_object().unwrap().contains_key("explicit.id"));

    // The other should have a generated ID (6 characters)
    let generated_id = json
        .as_object()
        .unwrap()
        .keys()
        .find(|k| *k != "explicit.id")
        .unwrap();
    assert_eq!(generated_id.len(), 6);
}

#[test]
fn test_extract_with_description_affects_generated_id() {
    // Test that description affects the generated ID
    let temp_dir = tempfile::tempdir().unwrap();

    // File 1: Message with description
    let test_file1 = temp_dir.path().join("test1.tsx");
    let test_content1 = r#"
import { defineMessage } from 'react-intl';

const msg = defineMessage({
  defaultMessage: 'Hello',
  description: 'A greeting',
});
"#;
    std::fs::write(&test_file1, test_content1).unwrap();

    // File 2: Same message without description
    let test_file2 = temp_dir.path().join("test2.tsx");
    let test_content2 = r#"
import { defineMessage } from 'react-intl';

const msg = defineMessage({
  defaultMessage: 'Hello',
});
"#;
    std::fs::write(&test_file2, test_content2).unwrap();

    // Extract both
    let output_file1 = temp_dir.path().join("output1.json");
    extract(
        &[test_file1],
        None,
        None,
        Some(&output_file1),
        "[sha512:contenthash:base64:10]",
        false,
        &[],
        &[],
        &[],
        false,
        None,
        false,
        false,
        true, // follow links
    )
    .unwrap();

    let output_file2 = temp_dir.path().join("output2.json");
    extract(
        &[test_file2],
        None,
        None,
        Some(&output_file2),
        "[sha512:contenthash:base64:10]",
        false,
        &[],
        &[],
        &[],
        false,
        None,
        false,
        false,
        true, // follow links
    )
    .unwrap();

    // Read outputs
    let json1: serde_json::Value =
        serde_json::from_str(&std::fs::read_to_string(&output_file1).unwrap()).unwrap();
    let json2: serde_json::Value =
        serde_json::from_str(&std::fs::read_to_string(&output_file2).unwrap()).unwrap();

    // Get the generated IDs
    let id1 = json1.as_object().unwrap().keys().next().unwrap();
    let id2 = json2.as_object().unwrap().keys().next().unwrap();

    // IDs should be different because description affects the hash
    assert_ne!(id1, id2, "Description should affect the generated ID");
}

// ==================== Crowdin Format Integration Tests ====================

#[test]
fn test_extract_with_crowdin_format() {
    // Test that extraction with crowdin format outputs the correct vendor format
    let temp_dir = tempfile::tempdir().unwrap();
    let test_file = temp_dir.path().join("test.tsx");
    let output_file = temp_dir.path().join("output.json");

    // Write test file with messages that have both id, defaultMessage, and description
    let test_content = r#"
import { defineMessages } from 'react-intl';

const messages = defineMessages({
  greeting: {
    id: 'app.greeting',
    defaultMessage: 'Hello {name}!',
    description: 'Greeting message shown to users',
  },
  farewell: {
    id: 'app.farewell',
    defaultMessage: 'Goodbye!',
    description: 'Farewell message',
  },
});
"#;
    std::fs::write(&test_file, test_content).unwrap();

    // Extract with Crowdin format
    extract(
        &[test_file],
        Some(Formatter::Crowdin),
        None,
        Some(&output_file),
        "[sha512:contenthash:base64:6]",
        false,
        &[],
        &[],
        &[],
        false,
        None,
        false,
        false,
        true, // follow links
    )
    .unwrap();

    // Read and verify output format
    let output_content = std::fs::read_to_string(&output_file).unwrap();
    let json: serde_json::Value = serde_json::from_str(&output_content).unwrap();

    // Should have two entries
    assert_eq!(json.as_object().unwrap().len(), 2);

    // Verify greeting message has correct Crowdin format
    let greeting = json.get("app.greeting").unwrap();
    assert!(
        greeting.is_object(),
        "Crowdin format should have object entries"
    );
    let greeting_obj = greeting.as_object().unwrap();
    assert_eq!(greeting_obj.get("message").unwrap(), "Hello {name}!");
    assert_eq!(
        greeting_obj.get("description").unwrap(),
        "Greeting message shown to users"
    );

    // Verify farewell message has correct Crowdin format
    let farewell = json.get("app.farewell").unwrap();
    let farewell_obj = farewell.as_object().unwrap();
    assert_eq!(farewell_obj.get("message").unwrap(), "Goodbye!");
    assert_eq!(farewell_obj.get("description").unwrap(), "Farewell message");
}

#[test]
fn test_extract_with_crowdin_format_icu_plural() {
    // Test that extraction with crowdin format preserves ICU plural syntax
    let temp_dir = tempfile::tempdir().unwrap();
    let test_file = temp_dir.path().join("test.tsx");
    let output_file = temp_dir.path().join("output.json");

    let test_content = r#"
import { defineMessage } from 'react-intl';

const msg = defineMessage({
  id: 'items.count',
  defaultMessage: '{count, plural, one {# item} other {# items}}',
  description: 'Shows the number of items in cart',
});
"#;
    std::fs::write(&test_file, test_content).unwrap();

    extract(
        &[test_file],
        Some(Formatter::Crowdin),
        None,
        Some(&output_file),
        "[sha512:contenthash:base64:6]",
        false,
        &[],
        &[],
        &[],
        false,
        None,
        false,
        false,
        true, // follow links
    )
    .unwrap();

    let output_content = std::fs::read_to_string(&output_file).unwrap();
    let json: serde_json::Value = serde_json::from_str(&output_content).unwrap();

    let items = json.get("items.count").unwrap().as_object().unwrap();
    assert_eq!(
        items.get("message").unwrap(),
        "{count, plural, one {# item} other {# items}}"
    );
    assert_eq!(
        items.get("description").unwrap(),
        "Shows the number of items in cart"
    );
}

#[test]
fn test_extract_with_crowdin_format_without_description() {
    // Test that extraction with crowdin format handles messages without description
    let temp_dir = tempfile::tempdir().unwrap();
    let test_file = temp_dir.path().join("test.tsx");
    let output_file = temp_dir.path().join("output.json");

    let test_content = r#"
import { defineMessage } from 'react-intl';

const msg = defineMessage({
  id: 'simple.message',
  defaultMessage: 'Simple message without description',
});
"#;
    std::fs::write(&test_file, test_content).unwrap();

    extract(
        &[test_file],
        Some(Formatter::Crowdin),
        None,
        Some(&output_file),
        "[sha512:contenthash:base64:6]",
        false,
        &[],
        &[],
        &[],
        false,
        None,
        false,
        false,
        true, // follow links
    )
    .unwrap();

    let output_content = std::fs::read_to_string(&output_file).unwrap();
    let json: serde_json::Value = serde_json::from_str(&output_content).unwrap();

    let msg = json.get("simple.message").unwrap().as_object().unwrap();
    assert_eq!(
        msg.get("message").unwrap(),
        "Simple message without description"
    );
    // Description should not be present when not provided
    assert!(msg.get("description").is_none());
}

#[test]
fn test_extract_with_crowdin_format_icu_select() {
    // Test that extraction with crowdin format preserves ICU select syntax
    let temp_dir = tempfile::tempdir().unwrap();
    let test_file = temp_dir.path().join("test.tsx");
    let output_file = temp_dir.path().join("output.json");

    let test_content = r#"
import { defineMessage } from 'react-intl';

const msg = defineMessage({
  id: 'gender.greeting',
  defaultMessage: '{gender, select, male {Mr.} female {Ms.} other {Dear}} {name}',
  description: 'Gender-aware greeting prefix',
});
"#;
    std::fs::write(&test_file, test_content).unwrap();

    extract(
        &[test_file],
        Some(Formatter::Crowdin),
        None,
        Some(&output_file),
        "[sha512:contenthash:base64:6]",
        false,
        &[],
        &[],
        &[],
        false,
        None,
        false,
        false,
        true, // follow links
    )
    .unwrap();

    let output_content = std::fs::read_to_string(&output_file).unwrap();
    let json: serde_json::Value = serde_json::from_str(&output_content).unwrap();

    let msg = json.get("gender.greeting").unwrap().as_object().unwrap();
    assert_eq!(
        msg.get("message").unwrap(),
        "{gender, select, male {Mr.} female {Ms.} other {Dear}} {name}"
    );
}

#[test]
fn test_extract_with_crowdin_format_multiple_files() {
    // Test extraction with crowdin format from multiple source files
    let temp_dir = tempfile::tempdir().unwrap();
    let test_file1 = temp_dir.path().join("component1.tsx");
    let test_file2 = temp_dir.path().join("component2.tsx");
    let output_file = temp_dir.path().join("output.json");

    std::fs::write(
        &test_file1,
        r#"
import { defineMessage } from 'react-intl';

const msg = defineMessage({
  id: 'component1.title',
  defaultMessage: 'Component 1 Title',
  description: 'Title for component 1',
});
"#,
    )
    .unwrap();

    std::fs::write(
        &test_file2,
        r#"
import { defineMessage } from 'react-intl';

const msg = defineMessage({
  id: 'component2.title',
  defaultMessage: 'Component 2 Title',
  description: 'Title for component 2',
});
"#,
    )
    .unwrap();

    extract(
        &[test_file1, test_file2],
        Some(Formatter::Crowdin),
        None,
        Some(&output_file),
        "[sha512:contenthash:base64:6]",
        false,
        &[],
        &[],
        &[],
        false,
        None,
        false,
        false,
        true, // follow links
    )
    .unwrap();

    let output_content = std::fs::read_to_string(&output_file).unwrap();
    let json: serde_json::Value = serde_json::from_str(&output_content).unwrap();

    // Should have both messages
    assert_eq!(json.as_object().unwrap().len(), 2);

    let comp1 = json.get("component1.title").unwrap().as_object().unwrap();
    assert_eq!(comp1.get("message").unwrap(), "Component 1 Title");

    let comp2 = json.get("component2.title").unwrap().as_object().unwrap();
    assert_eq!(comp2.get("message").unwrap(), "Component 2 Title");
}

#[test]
fn test_extract_crowdin_format_json_structure() {
    // Test that the JSON structure exactly matches Crowdin's expected format
    let temp_dir = tempfile::tempdir().unwrap();
    let test_file = temp_dir.path().join("test.tsx");
    let output_file = temp_dir.path().join("output.json");

    let test_content = r#"
import { defineMessage } from 'react-intl';

const msg = defineMessage({
  id: 'test.message',
  defaultMessage: 'Test content',
  description: 'Test description',
});
"#;
    std::fs::write(&test_file, test_content).unwrap();

    extract(
        &[test_file],
        Some(Formatter::Crowdin),
        None,
        Some(&output_file),
        "[sha512:contenthash:base64:6]",
        false,
        &[],
        &[],
        &[],
        false,
        None,
        false,
        false,
        true, // follow links
    )
    .unwrap();

    let output_content = std::fs::read_to_string(&output_file).unwrap();
    let json: serde_json::Value = serde_json::from_str(&output_content).unwrap();

    // The output should match Crowdin's expected format exactly:
    // {
    //   "test.message": {
    //     "message": "Test content",
    //     "description": "Test description"
    //   }
    // }
    let expected = serde_json::json!({
        "test.message": {
            "message": "Test content",
            "description": "Test description"
        }
    });

    assert_eq!(
        json, expected,
        "Output should match Crowdin's expected format"
    );
}

#[test]
fn test_extract_crowdin_format_with_formatted_message_component() {
    // Test extraction from FormattedMessage JSX component with crowdin format
    let temp_dir = tempfile::tempdir().unwrap();
    let test_file = temp_dir.path().join("test.tsx");
    let output_file = temp_dir.path().join("output.json");

    let test_content = r#"
import { FormattedMessage } from 'react-intl';

function MyComponent() {
  return (
    <FormattedMessage
      id="jsx.message"
      defaultMessage="Hello from JSX!"
      description="Message from FormattedMessage component"
    />
  );
}
"#;
    std::fs::write(&test_file, test_content).unwrap();

    extract(
        &[test_file],
        Some(Formatter::Crowdin),
        None,
        Some(&output_file),
        "[sha512:contenthash:base64:6]",
        false,
        &[],
        &[],
        &[],
        false,
        None,
        false,
        false,
        true, // follow links
    )
    .unwrap();

    let output_content = std::fs::read_to_string(&output_file).unwrap();
    let json: serde_json::Value = serde_json::from_str(&output_content).unwrap();

    let msg = json.get("jsx.message").unwrap().as_object().unwrap();
    assert_eq!(msg.get("message").unwrap(), "Hello from JSX!");
    assert_eq!(
        msg.get("description").unwrap(),
        "Message from FormattedMessage component"
    );
}

#[test]
fn test_extract_deterministic_id_generation() {
    // Test that extracting the same file twice produces the same IDs
    let temp_dir = tempfile::tempdir().unwrap();
    let test_file = temp_dir.path().join("test.tsx");

    let test_content = r#"
import { defineMessage } from 'react-intl';

const msg = defineMessage({
  defaultMessage: 'Consistent Message',
});
"#;
    std::fs::write(&test_file, test_content).unwrap();

    // Extract first time
    let output_file1 = temp_dir.path().join("output1.json");
    extract(
        &[test_file.clone()],
        None,
        None,
        Some(&output_file1),
        "[sha512:contenthash:base64:10]",
        false,
        &[],
        &[],
        &[],
        false,
        None,
        false,
        false,
        true, // follow links
    )
    .unwrap();

    // Extract second time
    let output_file2 = temp_dir.path().join("output2.json");
    extract(
        &[test_file],
        None,
        None,
        Some(&output_file2),
        "[sha512:contenthash:base64:10]",
        false,
        &[],
        &[],
        &[],
        false,
        None,
        false,
        false,
        true, // follow links
    )
    .unwrap();

    // Read both outputs
    let content1 = std::fs::read_to_string(&output_file1).unwrap();
    let content2 = std::fs::read_to_string(&output_file2).unwrap();

    // Outputs should be identical
    assert_eq!(
        content1, content2,
        "Extracting the same file twice should produce identical output"
    );
}

#[test]
fn test_extract_with_throws_false_collects_partial_results() {
    // Test that when throws:false, extraction collects partial results from valid files
    // even when some files have errors
    let temp_dir = tempfile::tempdir().unwrap();
    let output_file = temp_dir.path().join("output.json");

    // Create a valid file
    let valid_file = temp_dir.path().join("valid.tsx");
    let valid_content = r#"
import { defineMessage } from 'react-intl';

const msg = defineMessage({
  id: 'valid.message',
  defaultMessage: 'This is a valid message',
});
"#;
    std::fs::write(&valid_file, valid_content).unwrap();

    // Create an invalid file (malformed JavaScript)
    let invalid_file = temp_dir.path().join("invalid.tsx");
    let invalid_content = r#"
import { defineMessage } from 'react-intl';

const msg = defineMessage({
  id: 'invalid.message
  defaultMessage: 'This is missing closing quote and brace
"#;
    std::fs::write(&invalid_file, invalid_content).unwrap();

    // Create another valid file
    let valid_file2 = temp_dir.path().join("valid2.tsx");
    let valid_content2 = r#"
import { defineMessage } from 'react-intl';

const msg = defineMessage({
  id: 'valid.message2',
  defaultMessage: 'This is another valid message',
});
"#;
    std::fs::write(&valid_file2, valid_content2).unwrap();

    // Extract with throws:false - should succeed and collect partial results
    let result = extract(
        &[valid_file, invalid_file, valid_file2],
        None,
        None,
        Some(&output_file),
        "[sha512:contenthash:base64:6]",
        false,
        &[],
        &[],
        &[],
        false, // throws:false
        None,
        false,
        false,
        true, // follow links
    );

    // Should succeed despite one file failing
    assert!(result.is_ok(), "Extract should succeed with throws:false");

    // Read and verify output contains messages from valid files
    let output_content = std::fs::read_to_string(&output_file).unwrap();
    let json: serde_json::Value = serde_json::from_str(&output_content).unwrap();

    // Should have 2 messages from the valid files
    assert_eq!(json.as_object().unwrap().len(), 2);
    assert!(json.get("valid.message").is_some());
    assert!(json.get("valid.message2").is_some());

    // Verify message content
    assert_eq!(
        json["valid.message"]["defaultMessage"],
        "This is a valid message"
    );
    assert_eq!(
        json["valid.message2"]["defaultMessage"],
        "This is another valid message"
    );
}

#[test]
fn test_extract_read_errors_preserve_catalog() {
    for throws in [false, true] {
        for existing_output in [false, true] {
            let temp_dir = tempfile::tempdir().unwrap();
            let valid_file = temp_dir.path().join("valid.ts");
            let unreadable_file = temp_dir.path().join("unreadable.ts");
            let output_file = temp_dir.path().join("messages.json");
            let previous_catalog = b"{\"previous\":\"Keep this catalog\"}\n";
            fs::write(
                &valid_file,
                "defineMessage({id: 'valid', defaultMessage: 'Valid'})",
            )
            .unwrap();
            // Invalid UTF-8 makes read_to_string fail on every platform,
            // without changing process limits or relying on permissions.
            fs::write(&unreadable_file, [0xff]).unwrap();
            if existing_output {
                fs::write(&output_file, previous_catalog).unwrap();
            }

            let error = extract(
                &[valid_file, unreadable_file.clone()],
                None,
                None,
                Some(&output_file),
                "[sha512:contenthash:base64:6]",
                false,
                &[],
                &[],
                &[],
                throws,
                None,
                false,
                false,
                true,
            )
            .expect_err("Input read errors must fail extraction even without --throws");

            assert!(format!("{error:#}").contains(&unreadable_file.display().to_string()));
            assert_eq!(
                error.downcast_ref::<io::Error>().unwrap().kind(),
                io::ErrorKind::InvalidData
            );
            if existing_output {
                assert_eq!(fs::read(&output_file).unwrap(), previous_catalog);
            } else {
                assert!(!output_file.exists());
            }
        }
    }
}

#[test]
fn test_extract_with_throws_true_fails_on_error() {
    // Test that when throws:true, extraction fails completely if any file has errors
    let temp_dir = tempfile::tempdir().unwrap();
    let output_file = temp_dir.path().join("output.json");

    // Create a valid file
    let valid_file = temp_dir.path().join("valid.tsx");
    let valid_content = r#"
import { defineMessage } from 'react-intl';

const msg = defineMessage({
  id: 'valid.message',
  defaultMessage: 'This is a valid message',
});
"#;
    std::fs::write(&valid_file, valid_content).unwrap();

    // Create an invalid file
    let invalid_file = temp_dir.path().join("invalid.tsx");
    let invalid_content = r#"
import { defineMessage } from 'react-intl';

const msg = defineMessage({
  id: 'invalid.message
  defaultMessage: 'This is missing closing quote
"#;
    std::fs::write(&invalid_file, invalid_content).unwrap();

    // Extract with throws:true - should fail
    let result = extract(
        &[valid_file, invalid_file],
        None,
        None,
        Some(&output_file),
        "[sha512:contenthash:base64:6]",
        false,
        &[],
        &[],
        &[],
        true, // throws:true
        None,
        false,
        false,
        true, // follow links
    );

    // Should fail because of the invalid file
    assert!(
        result.is_err(),
        "Extract should fail with throws:true when any file has errors"
    );
}

#[test]
fn test_extract_with_throws_true_fails_on_missing_input() {
    let temp_dir = tempfile::tempdir().unwrap();
    let missing_file = temp_dir.path().join("missing.tsx");
    let output_file = temp_dir.path().join("output.json");

    let error = extract(
        &[missing_file.clone()],
        None,
        None,
        Some(&output_file),
        "[sha512:contenthash:base64:6]",
        false,
        &[],
        &[],
        &[],
        true,
        None,
        false,
        false,
        true,
    )
    .unwrap_err();

    assert!(error.to_string().contains(&format!(
        "Failed to resolve input file {}",
        missing_file.display()
    )));
    assert!(!output_file.exists());
}

#[test]
fn test_extract_in_file_with_throws_true_fails_on_missing_input() {
    let temp_dir = tempfile::tempdir().unwrap();
    let missing_file = temp_dir.path().join("missing.tsx");
    let input_file = temp_dir.path().join("files.txt");
    let output_file = temp_dir.path().join("output.json");
    fs::write(&input_file, format!("{}\n", missing_file.display())).unwrap();

    let error = extract(
        &[],
        None,
        Some(&input_file),
        Some(&output_file),
        "[sha512:contenthash:base64:6]",
        false,
        &[],
        &[],
        &[],
        true,
        None,
        false,
        false,
        true,
    )
    .unwrap_err();

    assert!(error.to_string().contains(&format!(
        "Failed to resolve input file {}",
        missing_file.display()
    )));
    assert!(!output_file.exists());
}

#[test]
fn test_extract_sources_returns_structured_virtual_source_results() {
    let result = extract_sources(
        &[ExtractSourceInput {
            filename: "virtual.tsx".to_string(),
            source: r#"// @intl-meta project:api
                    defineMessage({defaultMessage: "Hello", description: "Greeting"})"#
                .to_string(),
        }],
        Some("[sha512:contenthash:base64:6]"),
        true,
        &[],
        &[],
        true,
        Some("@intl-meta"),
        false,
        false,
    )
    .unwrap();

    assert_eq!(result.files.len(), 1);
    assert!(result.warnings.is_empty());
    let file = &result.files[0];
    assert_eq!(file.filename, "virtual.tsx");
    assert_eq!(file.meta.get("project").map(String::as_str), Some("api"));
    assert!(file.errors.is_empty());
    assert_eq!(file.messages.len(), 1);
    assert!(file.messages[0].id.is_some());
    assert_eq!(file.messages[0].file.as_deref(), Some("virtual.tsx"));
}

#[test]
fn test_extract_sources_returns_parse_errors_when_throws_is_false() {
    let result = extract_sources(
        &[ExtractSourceInput {
            filename: "broken.ts".to_string(),
            source: "defineMessage({".to_string(),
        }],
        None,
        false,
        &[],
        &[],
        false,
        None,
        false,
        false,
    )
    .unwrap();

    assert_eq!(result.files.len(), 1);
    assert!(result.files[0].messages.is_empty());
    assert_eq!(result.files[0].errors.len(), 1);
}

#[test]
fn test_extract_sources_returns_message_errors_when_throws_is_false() {
    let result = extract_sources(
        &[ExtractSourceInput {
            filename: "non_static.ts".to_string(),
            source: "defineMessage({defaultMessage: value})".to_string(),
        }],
        None,
        false,
        &[],
        &[],
        false,
        None,
        false,
        false,
    )
    .unwrap();

    assert!(result.files[0].messages.is_empty());
    assert_eq!(result.files[0].errors.len(), 1);
    assert!(result.files[0].errors[0].contains("defaultMessage"));
}

fn write_source(path: impl AsRef<Path>) -> std::io::Result<()> {
    let path = path.as_ref();
    fs::write(
        path,
        format!(
            "defineMessage({{id:{},defaultMessage:'Message'}})",
            serde_json::to_string(&path.to_string_lossy()).unwrap()
        ),
    )
}

fn extracted_files(
    patterns: &[PathBuf],
    ignore: &[String],
    follow_links: bool,
    throws: bool,
) -> Result<Vec<PathBuf>> {
    let output = extract_to_string(
        patterns,
        None,
        None,
        "[content]",
        true,
        &[],
        &[],
        ignore,
        throws,
        None,
        false,
        false,
        follow_links,
    )?;
    let catalog: serde_json::Value = serde_json::from_str(&output)?;
    let mut files: Vec<_> = catalog
        .as_object()
        .unwrap()
        .values()
        .map(|descriptor| PathBuf::from(descriptor["file"].as_str().unwrap()))
        .collect();
    files.sort();
    Ok(files)
}

fn virtual_sources(
    source: &str,
    components: &[String],
    functions: &[String],
    pragma: Option<&str>,
) -> ExtractSourcesResult {
    extract_sources(
        &[ExtractSourceInput {
            filename: "source.tsx".into(),
            source: source.into(),
        }],
        None,
        false,
        components,
        functions,
        true,
        pragma,
        false,
        false,
    )
    .unwrap()
}
