use anyhow::{Context, Result};
use std::path::PathBuf;
use walkdir::WalkDir;

use crate::compile;
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
/// * `skip_errors` - Continue compiling after errors, excluding keys with errors from output
/// * `pseudo_locale` - Optional pseudo-locale generation
/// * `ignore_tag` - Treat HTML/XML tags as string literals
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
///     false,
///     None,
///     false,
/// ).unwrap();
/// ```
pub fn compile_folder(
    folder: &PathBuf,
    out_folder: &PathBuf,
    format: Option<Formatter>,
    ast: bool,
    skip_errors: bool,
    pseudo_locale: Option<compile::PseudoLocale>,
    ignore_tag: bool,
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
    let json_files: Vec<PathBuf> = WalkDir::new(folder)
        .into_iter()
        .filter_map(|e| e.ok())
        .filter(|e| e.path().is_file() && e.path().extension().is_some_and(|ext| ext == "json"))
        .map(|e| e.path().to_path_buf())
        .collect();

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
            .with_context(|| format!("Failed to get relative path for {}", json_file.display()))?;

        // Construct output path
        let out_file = out_folder.join(relative_path);

        // Ensure output directory exists
        if let Some(parent) = out_file.parent() {
            std::fs::create_dir_all(parent)
                .with_context(|| format!("Failed to create directory: {}", parent.display()))?;
        }

        // Compile this single file
        eprintln!("Compiling {} ...", relative_path.display());
        match compile(
            &[json_file.clone()],
            format,
            Some(&out_file),
            ast,
            skip_errors,
            pseudo_locale,
            ignore_tag,
            true,
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
