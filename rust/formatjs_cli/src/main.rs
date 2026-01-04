use anyhow::Result;
use clap::{Parser, Subcommand, ValueEnum};
use std::path::PathBuf;

// Module declarations
pub mod compile;
pub mod compile_folder;
pub mod extract;
pub mod formatters;
pub mod verify;

#[derive(Parser)]
#[command(name = "formatjs")]
#[command(author, version, about = "FormatJS CLI - Internationalization tooling", long_about = None)]
#[command(propagate_version = true)]
struct Cli {
    #[command(subcommand)]
    command: Commands,
}

#[derive(Clone, Copy, Debug, ValueEnum)]
enum FormatterType {
    /// Default formatter: extracts defaultMessage from MessageDescriptor objects
    #[value(name = "default")]
    Default,
    /// Simple formatter: pass-through for Record<string, string>
    #[value(name = "simple")]
    Simple,
    /// Transifex formatter: extracts string field
    #[value(name = "transifex")]
    Transifex,
    /// Smartling formatter: extracts message field
    #[value(name = "smartling")]
    Smartling,
    /// Lokalise formatter: extracts translation field
    #[value(name = "lokalise")]
    Lokalise,
    /// Crowdin formatter: extracts message field
    #[value(name = "crowdin")]
    Crowdin,
}

impl From<FormatterType> for formatters::Formatter {
    fn from(f: FormatterType) -> Self {
        match f {
            FormatterType::Default => formatters::Formatter::Default,
            FormatterType::Simple => formatters::Formatter::Simple,
            FormatterType::Transifex => formatters::Formatter::Transifex,
            FormatterType::Smartling => formatters::Formatter::Smartling,
            FormatterType::Lokalise => formatters::Formatter::Lokalise,
            FormatterType::Crowdin => formatters::Formatter::Crowdin,
        }
    }
}

#[derive(Clone, Copy, Debug, ValueEnum)]
enum PseudoLocale {
    #[value(name = "xx-LS")]
    XxLs,
    #[value(name = "xx-AC")]
    XxAc,
    #[value(name = "xx-HA")]
    XxHa,
    #[value(name = "en-XA")]
    EnXa,
    #[value(name = "en-XB")]
    EnXb,
}

impl From<PseudoLocale> for compile::PseudoLocale {
    fn from(p: PseudoLocale) -> Self {
        match p {
            PseudoLocale::XxLs => compile::PseudoLocale::XxLs,
            PseudoLocale::XxAc => compile::PseudoLocale::XxAc,
            PseudoLocale::XxHa => compile::PseudoLocale::XxHa,
            PseudoLocale::EnXa => compile::PseudoLocale::EnXa,
            PseudoLocale::EnXb => compile::PseudoLocale::EnXb,
        }
    }
}

#[derive(Subcommand)]
enum Commands {
    /// Extract string messages from React components that use react-intl.
    /// Extracts messages from TypeScript, JavaScript, Vue, and Handlebars files.
    Extract {
        /// File glob patterns to extract from (e.g., src/**/*.tsx)
        #[arg(value_name = "FILES")]
        files: Vec<PathBuf>,

        /// Path to a formatter file that controls the shape of JSON output.
        /// The formatter must export a `format` function.
        #[arg(long, value_name = "PATH")]
        format: Option<PathBuf>,

        /// File containing list of files to extract from (one per line).
        /// Used when you have a large number of files and bash chokes.
        #[arg(long, value_name = "PATH")]
        in_file: Option<PathBuf>,

        /// Target file path for aggregated .json output of all translations
        #[arg(long, value_name = "PATH")]
        out_file: Option<PathBuf>,

        /// Pattern to automatically generate IDs for messages without explicit IDs.
        /// Uses webpack loader-utils interpolateName format.
        #[arg(long, value_name = "PATTERN", default_value = "[sha512:contenthash:base64:6]")]
        id_interpolation_pattern: String,

        /// Whether to extract metadata about message location in source file
        #[arg(long)]
        extract_source_location: bool,

        /// Additional component names to extract from (comma-separated, e.g., FormattedFooBarMessage)
        #[arg(long, value_name = "NAMES", value_delimiter = ',')]
        additional_component_names: Vec<String>,

        /// Additional function names to extract messages from (comma-separated, e.g., $t,formatMessage)
        #[arg(long, value_name = "NAMES", value_delimiter = ',')]
        additional_function_names: Vec<String>,

        /// List of glob patterns to exclude from extraction
        #[arg(long, value_name = "PATTERNS")]
        ignore: Vec<String>,

        /// Whether to throw an exception when failing to process any file in the batch
        #[arg(long)]
        throws: bool,

        /// Parse custom pragma for file metadata (e.g., @intl-meta)
        #[arg(long, value_name = "PRAGMA")]
        pragma: Option<String>,

        /// Whether to preserve whitespace and newlines
        #[arg(long)]
        preserve_whitespace: bool,

        /// Whether to hoist selectors and flatten sentences
        #[arg(long)]
        flatten: bool,
    },

    /// Compile extracted translation files into react-intl consumable JSON.
    /// Verifies that messages are valid ICU and not malformed.
    Compile {
        /// Glob patterns for translation files (e.g., foo/**/en.json)
        #[arg(value_name = "TRANSLATION_FILES")]
        translation_files: Vec<PathBuf>,

        /// Formatter to use for converting input files to Record<string, string>.
        /// Available: default, simple, transifex, smartling, lokalise, crowdin
        #[arg(long, value_name = "FORMATTER")]
        format: Option<FormatterType>,

        /// Output file path. If not provided, prints to stdout.
        #[arg(long, value_name = "PATH")]
        out_file: Option<PathBuf>,

        /// Whether to compile to AST instead of strings
        #[arg(long)]
        ast: bool,

        /// Continue compiling after errors. Keys with errors are excluded from output.
        #[arg(long)]
        skip_errors: bool,

        /// Generate pseudo-locale files. Requires --ast.
        #[arg(long, value_name = "LOCALE")]
        pseudo_locale: Option<PseudoLocale>,

        /// Treat HTML/XML tags as string literals instead of parsing them as tag tokens
        #[arg(long)]
        ignore_tag: bool,
    },

    /// Batch compile all extracted translation JSON files in a folder.
    /// Compiles all files from source folder to output folder containing react-intl consumable JSON.
    #[command(name = "compile-folder")]
    CompileFolder {
        /// Source directory containing translation JSON files
        #[arg(value_name = "FOLDER")]
        folder: PathBuf,

        /// Output directory for compiled files
        #[arg(value_name = "OUT_FOLDER")]
        out_folder: PathBuf,

        /// Formatter to use for converting input files to Record<string, string>.
        /// Available: default, simple, transifex, smartling, lokalise, crowdin
        #[arg(long, value_name = "FORMATTER")]
        format: Option<FormatterType>,

        /// Whether to compile to AST
        #[arg(long)]
        ast: bool,
    },

    /// Run a series of checks on translation files to validate correctness and consistency
    Verify {
        /// Glob patterns for translation files (e.g., foo/**/en.json)
        #[arg(value_name = "TRANSLATION_FILES")]
        translation_files: Vec<PathBuf>,

        /// Source locale identifier. REQUIRED for checks to work.
        /// There must be a file named <sourceLocale>.json in the translation files list.
        #[arg(long, value_name = "LOCALE")]
        source_locale: Option<String>,

        /// List of glob patterns to ignore
        #[arg(long, value_name = "PATTERNS")]
        ignore: Vec<String>,

        /// Check for missing keys in target locales compared to source
        #[arg(long)]
        missing_keys: bool,

        /// Check that target locales don't have extra keys not in source locale
        #[arg(long)]
        extra_keys: bool,

        /// Check for structural equality of messages between source and target locales
        #[arg(long)]
        structural_equality: bool,
    },
}

fn main() -> Result<()> {
    let cli = Cli::parse();

    match &cli.command {
        Commands::Extract {
            files,
            format,
            in_file,
            out_file,
            id_interpolation_pattern,
            extract_source_location,
            additional_component_names,
            additional_function_names,
            ignore,
            throws,
            pragma,
            preserve_whitespace,
            flatten,
        } => {
            extract::extract(
                files,
                format.as_ref(),
                in_file.as_ref(),
                out_file.as_ref(),
                id_interpolation_pattern,
                *extract_source_location,
                additional_component_names,
                additional_function_names,
                ignore,
                *throws,
                pragma.as_deref(),
                *preserve_whitespace,
                *flatten,
            )?;
        }
        Commands::Compile {
            translation_files,
            format,
            out_file,
            ast,
            skip_errors,
            pseudo_locale,
            ignore_tag,
        } => {
            compile::compile(
                translation_files,
                format.map(|f| f.into()),
                out_file.as_ref(),
                *ast,
                *skip_errors,
                pseudo_locale.map(|p| p.into()),
                *ignore_tag,
            )?;
        }
        Commands::CompileFolder {
            folder,
            out_folder,
            format,
            ast,
        } => {
            compile_folder::compile_folder(folder, out_folder, format.map(|f| f.into()), *ast)?;
        }
        Commands::Verify {
            translation_files,
            source_locale,
            ignore,
            missing_keys,
            extra_keys,
            structural_equality,
        } => {
            verify::verify(
                translation_files,
                source_locale.as_deref(),
                ignore,
                *missing_keys,
                *extra_keys,
                *structural_equality,
            )?;
        }
    }

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn verify_cli() {
        use clap::CommandFactory;
        Cli::command().debug_assert();
    }

    #[test]
    fn test_extract_help() {
        use clap::CommandFactory;
        let cmd = Cli::command();
        let extract = cmd.find_subcommand("extract").unwrap();
        assert_eq!(extract.get_name(), "extract");
    }

    #[test]
    fn test_compile_help() {
        use clap::CommandFactory;
        let cmd = Cli::command();
        let compile = cmd.find_subcommand("compile").unwrap();
        assert_eq!(compile.get_name(), "compile");
    }

    #[test]
    fn test_verify_help() {
        use clap::CommandFactory;
        let cmd = Cli::command();
        let verify = cmd.find_subcommand("verify").unwrap();
        assert_eq!(verify.get_name(), "verify");
    }
}
