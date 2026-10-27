use std::{env, path::PathBuf};

fn main() {
    let mut args = env::args_os().skip(1);
    let config = PathBuf::from(args.next().expect("config path"));
    let source = PathBuf::from(args.next().expect("Rust source path"));
    let output = PathBuf::from(args.next().expect("output path"));
    assert!(args.next().is_none(), "unexpected argument");
    let config = cbindgen::Config::from_file(config).expect("valid cbindgen config");
    cbindgen::Builder::new()
        .with_config(config)
        .with_src(source)
        .generate()
        .expect("valid Rust C ABI")
        .write_to_file(output);
}
