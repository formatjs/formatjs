"""C headers come from the exported Rust declarations, never a parallel ABI."""

def rust_ffi_header(name, out, src = "ffi.rs", config = "cbindgen.toml"):
    native.genrule(
        name = name,
        srcs = native.glob(["*.rs"]) + [config],
        outs = [out],
        cmd = "$(execpath //tools/ffi_headers:generate) $(location " + config + ") $(location " + src + ") $@",
        tools = ["//tools/ffi_headers:generate"],
        visibility = ["//visibility:public"],
    )
