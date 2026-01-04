use anyhow::{Context, Result};
use glob::glob;
use std::path::PathBuf;

use crate::formatters::Formatter;

/// Batch compile all extracted translation JSON files in a folder.
///
/// This command scans a source folder for translation JSON files, compiles each one
/// using the same logic as the compile command, and writes the compiled output to
/// a corresponding location in the output folder while preserving directory structure.
///
/// # Arguments
///
/// * `folder` - Source directory containing translation JSON files
/// * `out_folder` - Output directory for compiled files
/// * `format` - Optional formatter (same signature as compile command)
/// * `ast` - Whether to compile to AST representation
///
/// # Example
///
/// ```no_run
/// # use std::path::PathBuf;
/// # use formatjs_cli::compile_folder::compile_folder;
/// compile_folder(
///     &PathBuf::from("lang/"),
///     &PathBuf::from("dist/lang/"),
///     None,
///     true,
/// ).unwrap();
/// ```
pub fn compile_folder(
    folder: &PathBuf,
    out_folder: &PathBuf,
    format: Option<Formatter>,
    ast: bool,
) -> Result<()> {
    use crate::compile::compile;

    // Verify source folder exists
    if !folder.exists() {
        anyhow::bail!("Source folder does not exist: {}", folder.display());
    }
    if !folder.is_dir() {
        anyhow::bail!("Source path is not a directory: {}", folder.display());
    }

    // Create output folder if it doesn't exist
    std::fs::create_dir_all(out_folder).with_context(|| {
        format!(
            "Failed to create output directory: {}",
            out_folder.display()
        )
    })?;

    // Find all .json files in the source folder (recursively)
    let pattern = folder.join("**/*.json");
    let pattern_str = pattern
        .to_str()
        .context("Folder path contains invalid UTF-8")?;

    let json_files: Vec<PathBuf> = match glob(pattern_str) {
        Ok(paths) => paths.filter_map(Result::ok).collect(),
        Err(e) => {
            anyhow::bail!("Failed to read folder pattern '{}': {}", pattern_str, e);
        }
    };

    if json_files.is_empty() {
        eprintln!(
            "Warning: No .json files found in folder {}",
            folder.display()
        );
        return Ok(());
    }

    eprintln!("Found {} JSON files to compile", json_files.len());

    // Process each file individually
    let mut success_count = 0;
    let mut error_count = 0;

    for json_file in &json_files {
        // Get the relative path from source folder
        let relative_path = json_file
            .strip_prefix(folder)
            .with_context(|| {
                format!(
                    "Failed to get relative path for {}",
                    json_file.display()
                )
            })?;

        // Construct output path
        let out_file = out_folder.join(relative_path);

        // Ensure output directory exists
        if let Some(parent) = out_file.parent() {
            std::fs::create_dir_all(parent).with_context(|| {
                format!("Failed to create directory: {}", parent.display())
            })?;
        }

        // Compile this single file
        eprintln!("Compiling {} ...", relative_path.display());
        match compile(
            &[json_file.clone()],
            format,
            Some(&out_file),
            ast,
            false, // skip_errors: false for folder compilation
            None,  // pseudo_locale: None
            false, // ignore_tag: false
        ) {
            Ok(_) => {
                success_count += 1;
            }
            Err(e) => {
                error_count += 1;
                eprintln!("  Error: {}", e);
                // Continue processing other files
            }
        }
    }

    eprintln!(
        "\n✓ Folder compilation complete: {} succeeded, {} failed",
        success_count, error_count
    );

    if error_count > 0 {
        anyhow::bail!("{} file(s) failed to compile", error_count);
    }

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;
    use std::fs;
    use tempfile::tempdir;

    #[test]
    fn test_compile_folder_simple() {
        let src_dir = tempdir().unwrap();
        let out_dir = tempdir().unwrap();

        // Create input files
        fs::write(
            src_dir.path().join("en.json"),
            json!({"greeting": "Hello!"}).to_string(),
        )
        .unwrap();
        fs::write(
            src_dir.path().join("fr.json"),
            json!({"greeting": "Bonjour!"}).to_string(),
        )
        .unwrap();

        // Compile folder
        compile_folder(
            &src_dir.path().to_path_buf(),
            &out_dir.path().to_path_buf(),
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

        // Create input files in nested structure
        fs::write(
            src_dir.path().join("locales/en/messages.json"),
            json!({"greeting": "Hello!"}).to_string(),
        )
        .unwrap();
        fs::write(
            src_dir.path().join("locales/fr/messages.json"),
            json!({"greeting": "Bonjour!"}).to_string(),
        )
        .unwrap();

        // Compile folder
        compile_folder(
            &src_dir.path().to_path_buf(),
            &out_dir.path().to_path_buf(),
            None,
            false,
        )
        .unwrap();

        // Verify directory structure is preserved
        assert!(out_dir.path().join("locales/en/messages.json").exists());
        assert!(out_dir.path().join("locales/fr/messages.json").exists());

        // Verify content
        let en_content =
            fs::read_to_string(out_dir.path().join("locales/en/messages.json")).unwrap();
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

        // Create input file
        fs::write(
            src_dir.path().join("messages.json"),
            json!({"greeting": "Hello {name}!"}).to_string(),
        )
        .unwrap();

        // Compile folder to AST
        compile_folder(
            &src_dir.path().to_path_buf(),
            &out_dir.path().to_path_buf(),
            None,
            true, // AST output
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
        let result = compile_folder(&nonexistent, &out_dir.path().to_path_buf(), None, false);

        assert!(result.is_err());
        assert!(result
            .unwrap_err()
            .to_string()
            .contains("does not exist"));
    }

    #[test]
    fn test_compile_folder_source_not_directory() {
        let dir = tempdir().unwrap();
        let file = dir.path().join("file.txt");
        let out_dir = tempdir().unwrap();

        // Create a file instead of directory
        fs::write(&file, "content").unwrap();

        // Should fail when source is not a directory
        let result = compile_folder(&file, &out_dir.path().to_path_buf(), None, false);

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
        );

        assert!(result.is_ok());
    }

    #[test]
    fn test_compile_folder_partial_failure() {
        let src_dir = tempdir().unwrap();
        let out_dir = tempdir().unwrap();

        // Create one valid and one invalid file
        fs::write(
            src_dir.path().join("valid.json"),
            json!({"greeting": "Hello!"}).to_string(),
        )
        .unwrap();
        fs::write(
            src_dir.path().join("invalid.json"),
            json!({"greeting": "Hello {name"}).to_string(), // Invalid ICU
        )
        .unwrap();

        // Should fail (compile_folder doesn't skip errors by default)
        let result = compile_folder(
            &src_dir.path().to_path_buf(),
            &out_dir.path().to_path_buf(),
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
        compile_folder(&src_dir.path().to_path_buf(), &out_dir, None, false).unwrap();

        // Verify output directory was created
        assert!(out_dir.exists());
        assert!(out_dir.join("messages.json").exists());
    }
}
