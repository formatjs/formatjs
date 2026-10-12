use formatjs_cli::compile_folder::*;
use formatjs_cli::formatters::Formatter;
use serde_json::json;
use std::fs;
use std::path::PathBuf;
use tempfile::tempdir;

#[test]
fn test_compile_folder_simple() {
    let src_dir = tempdir().unwrap();
    let out_dir = tempdir().unwrap();

    // Create input files with message descriptor format
    fs::write(
        src_dir.path().join("en.json"),
        json!({"greeting": {"defaultMessage": "Hello!"}}).to_string(),
    )
    .unwrap();
    fs::write(
        src_dir.path().join("fr.json"),
        json!({"greeting": {"defaultMessage": "Bonjour!"}}).to_string(),
    )
    .unwrap();

    // Compile folder
    compile_folder(
        &src_dir.path().to_path_buf(),
        &out_dir.path().to_path_buf(),
        None,
        false,
        false,
        None,
        false,
    )
    .unwrap();

    // Verify output files exist
    assert!(out_dir.path().join("en.json").exists());
    assert!(out_dir.path().join("fr.json").exists());

    // Verify content
    let en_content = fs::read_to_string(out_dir.path().join("en.json")).unwrap();
    let en_json: serde_json::Value = serde_json::from_str(&en_content).unwrap();
    assert_eq!(en_json["greeting"], "Hello!");

    let fr_content = fs::read_to_string(out_dir.path().join("fr.json")).unwrap();
    let fr_json: serde_json::Value = serde_json::from_str(&fr_content).unwrap();
    assert_eq!(fr_json["greeting"], "Bonjour!");
}

#[test]
fn test_compile_folder_preserves_structure() {
    let src_dir = tempdir().unwrap();
    let out_dir = tempdir().unwrap();

    // Create nested directory structure
    fs::create_dir(src_dir.path().join("locales")).unwrap();
    fs::create_dir(src_dir.path().join("locales/en")).unwrap();
    fs::create_dir(src_dir.path().join("locales/fr")).unwrap();

    // Create input files in nested structure with message descriptor format
    fs::write(
        src_dir.path().join("locales/en/messages.json"),
        json!({"greeting": {"defaultMessage": "Hello!"}}).to_string(),
    )
    .unwrap();
    fs::write(
        src_dir.path().join("locales/fr/messages.json"),
        json!({"greeting": {"defaultMessage": "Bonjour!"}}).to_string(),
    )
    .unwrap();

    // Compile folder
    compile_folder(
        &src_dir.path().to_path_buf(),
        &out_dir.path().to_path_buf(),
        None,
        false,
        false,
        None,
        false,
    )
    .unwrap();

    // Verify directory structure is preserved
    assert!(out_dir.path().join("locales/en/messages.json").exists());
    assert!(out_dir.path().join("locales/fr/messages.json").exists());

    // Verify content
    let en_content = fs::read_to_string(out_dir.path().join("locales/en/messages.json")).unwrap();
    let en_json: serde_json::Value = serde_json::from_str(&en_content).unwrap();
    assert_eq!(en_json["greeting"], "Hello!");
}

#[test]
fn test_compile_folder_with_formatter() {
    let src_dir = tempdir().unwrap();
    let out_dir = tempdir().unwrap();

    // Create input file with MessageDescriptor format
    fs::write(
        src_dir.path().join("messages.json"),
        json!({
            "greeting": {
                "defaultMessage": "Hello {name}!",
                "description": "Greeting"
            }
        })
        .to_string(),
    )
    .unwrap();

    // Compile folder with default formatter
    compile_folder(
        &src_dir.path().to_path_buf(),
        &out_dir.path().to_path_buf(),
        Some(Formatter::Default),
        false,
        false,
        None,
        false,
    )
    .unwrap();

    // Verify output
    let content = fs::read_to_string(out_dir.path().join("messages.json")).unwrap();
    let json: serde_json::Value = serde_json::from_str(&content).unwrap();
    assert_eq!(json["greeting"], "Hello {name}!");
}

#[test]
fn test_compile_folder_to_ast() {
    let src_dir = tempdir().unwrap();
    let out_dir = tempdir().unwrap();

    // Create input file with message descriptor format
    fs::write(
        src_dir.path().join("messages.json"),
        json!({"greeting": {"defaultMessage": "Hello {name}!"}}).to_string(),
    )
    .unwrap();

    // Compile folder to AST
    compile_folder(
        &src_dir.path().to_path_buf(),
        &out_dir.path().to_path_buf(),
        None,
        true, // AST output
        false,
        None,
        false,
    )
    .unwrap();

    // Verify output is AST
    let content = fs::read_to_string(out_dir.path().join("messages.json")).unwrap();
    let json: serde_json::Value = serde_json::from_str(&content).unwrap();
    assert!(json["greeting"].is_array());
}

#[test]
fn test_compile_folder_source_not_exists() {
    let out_dir = tempdir().unwrap();
    let nonexistent = PathBuf::from("/nonexistent/path");

    // Should fail when source folder doesn't exist
    let result = compile_folder(
        &nonexistent,
        &out_dir.path().to_path_buf(),
        None,
        false,
        false,
        None,
        false,
    );

    assert!(result.is_err());
    assert!(result.unwrap_err().to_string().contains("does not exist"));
}

#[test]
fn test_compile_folder_source_not_directory() {
    let dir = tempdir().unwrap();
    let file = dir.path().join("file.txt");
    let out_dir = tempdir().unwrap();

    // Create a file instead of directory
    fs::write(&file, "content").unwrap();

    // Should fail when source is not a directory
    let result = compile_folder(
        &file,
        &out_dir.path().to_path_buf(),
        None,
        false,
        false,
        None,
        false,
    );

    assert!(result.is_err());
    assert!(result.unwrap_err().to_string().contains("not a directory"));
}

#[test]
fn test_compile_folder_no_json_files() {
    let src_dir = tempdir().unwrap();
    let out_dir = tempdir().unwrap();

    // Create a non-JSON file
    fs::write(src_dir.path().join("readme.txt"), "text").unwrap();

    // Should succeed but warn about no files
    let result = compile_folder(
        &src_dir.path().to_path_buf(),
        &out_dir.path().to_path_buf(),
        None,
        false,
        false,
        None,
        false,
    );

    assert!(result.is_ok());
}

#[test]
fn test_compile_folder_partial_failure() {
    let src_dir = tempdir().unwrap();
    let out_dir = tempdir().unwrap();

    // Create one valid and one invalid file with message descriptor format
    fs::write(
        src_dir.path().join("valid.json"),
        json!({"greeting": {"defaultMessage": "Hello!"}}).to_string(),
    )
    .unwrap();
    fs::write(
        src_dir.path().join("invalid.json"),
        json!({"greeting": {"defaultMessage": "Hello {name"}}).to_string(), // Invalid ICU
    )
    .unwrap();

    // Should fail (compile_folder doesn't skip errors by default)
    let result = compile_folder(
        &src_dir.path().to_path_buf(),
        &out_dir.path().to_path_buf(),
        None,
        false,
        false,
        None,
        false,
    );

    assert!(result.is_err());
}

#[test]
fn test_compile_folder_multiple_files() {
    let src_dir = tempdir().unwrap();
    let out_dir = tempdir().unwrap();

    // Create multiple files
    for i in 0..5 {
        fs::write(
            src_dir.path().join(format!("msg{}.json", i)),
            json!({format!("msg{}", i): format!("Message {}", i)}).to_string(),
        )
        .unwrap();
    }

    // Compile folder
    compile_folder(
        &src_dir.path().to_path_buf(),
        &out_dir.path().to_path_buf(),
        None,
        false,
        false,
        None,
        false,
    )
    .unwrap();

    // Verify all files were compiled
    for i in 0..5 {
        assert!(out_dir.path().join(format!("msg{}.json", i)).exists());
    }
}

#[test]
fn test_compile_folder_creates_output_dir() {
    let src_dir = tempdir().unwrap();
    let parent_dir = tempdir().unwrap();
    let out_dir = parent_dir.path().join("nested/output/dir");

    // Create input file
    fs::write(
        src_dir.path().join("messages.json"),
        json!({"greeting": "Hello!"}).to_string(),
    )
    .unwrap();

    // Compile folder (should create nested output directory)
    compile_folder(
        &src_dir.path().to_path_buf(),
        &out_dir,
        None,
        false,
        false,
        None,
        false,
    )
    .unwrap();

    // Verify output directory was created
    assert!(out_dir.exists());
    assert!(out_dir.join("messages.json").exists());
}
