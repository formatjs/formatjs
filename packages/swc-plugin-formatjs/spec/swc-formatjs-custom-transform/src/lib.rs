#![recursion_limit = "2048"]
#![allow(dead_code)]

mod util;

#[macro_use]
extern crate napi_derive;

//extern crate swc_core;

use std::{env, panic::set_hook, sync::Arc};

use backtrace::Backtrace;

use swc_core::{
    base::{config::Options, Compiler, TransformOutput},
    common::{comments::Comments, sync::Lazy, FileName, FilePathMapping, SourceMap},
    ecma::{
        transforms::base::pass::noop,
        visit::{as_folder, Fold},
    },
};
use swc_formatjs_visitor::{create_formatjs_visitor, FormatJSPluginOptions};

use std::path::Path;

use napi::bindgen_prelude::Buffer;

use crate::util::{get_deserialized, try_with, MapErr};

static COMPILER: Lazy<Arc<Compiler>> = Lazy::new(|| {
    let cm = Arc::new(SourceMap::new(FilePathMapping::empty()));

    Arc::new(Compiler::new(cm))
});

#[napi::module_init]
fn init() {
    if cfg!(debug_assertions) || env::var("SWC_DEBUG").unwrap_or_default() == "1" {
        set_hook(Box::new(|panic_info| {
            let backtrace = Backtrace::new();
            println!("Panic: {:?}\nBacktrace: {:?}", panic_info, backtrace);
        }));
    }
}

fn get_compiler() -> Arc<Compiler> {
    COMPILER.clone()
}

#[napi(js_name = "Compiler")]
pub struct JsCompiler {
    _compiler: Arc<Compiler>,
}

#[napi]
impl JsCompiler {
    #[napi(constructor)]
    #[allow(clippy::new_without_default)]
    pub fn new() -> Self {
        Self {
            _compiler: COMPILER.clone(),
        }
    }
}

pub type ArcCompiler = Arc<Compiler>;

#[napi]
pub fn transform_sync(
    s: String,
    _is_module: bool,
    opts: Buffer,
    instrument_opts: Buffer,
) -> napi::Result<TransformOutput> {
    let c = get_compiler();

    let mut options: Options = get_deserialized(&opts)?;
    if !options.filename.is_empty() {
        options.config.adjust(Path::new(&options.filename));
    }

    try_with(
        c.cm.clone(),
        !options.config.error.filename.into_bool(),
        |handler| {
            c.run(|| {
                let filename = if options.filename.is_empty() {
                    FileName::Anon
                } else {
                    FileName::Real(options.filename.clone().into())
                };

                let formatjs_option: FormatJSPluginOptions = get_deserialized(&instrument_opts)?;

                let fm = c.cm.new_source_file(filename.clone(), s);
                c.process_js_with_custom_pass(
                    fm,
                    None,
                    handler,
                    &options,
                    |_program, comments| {
                        formatjs(
                            c.cm.clone(),
                            comments.clone(),
                            formatjs_option,
                            options.filename.as_str(),
                        )
                    },
                    |_, _| noop(),
                )
            })
        },
    )
    .convert_err()
}

fn formatjs<
    'a,
    C: Comments + 'a + std::clone::Clone,
    S: 'a + swc_core::common::errors::SourceMapper,
>(
    source_map: std::sync::Arc<S>,
    comments: C,
    plugin_options: FormatJSPluginOptions,
    filename: &str,
) -> impl Fold + 'a {
    let visitor = create_formatjs_visitor(source_map, comments, plugin_options, filename);

    as_folder(visitor)
}
