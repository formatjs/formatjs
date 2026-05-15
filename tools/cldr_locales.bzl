load("@aspect_bazel_lib//lib:write_source_files.bzl", "write_source_file")
load("//tools:index.bzl", "ts_run_binary")

def cldr_locale_list(name, cldr_package, file_glob, data, base_dir = "main", json_path = None, out_file = "locales.generated.bzl", variable = "ALL_LOCALES"):
    generated = "%s.tmp.bzl" % name
    args = [
        "--cldrPackage",
        cldr_package,
        "--glob",
        file_glob,
        "--variable",
        variable,
        "--out",
        "$(rootpath %s)" % generated,
    ]
    if base_dir:
        args.extend([
            "--baseDir",
            base_dir,
        ])
    if json_path:
        args.extend([
            "--jsonPath",
            json_path,
        ])

    ts_run_binary(
        name = "%s_generate" % name,
        srcs = data,
        outs = [generated],
        args = args,
        tool = "//tools:generate-cldr-locales",
    )

    write_source_file(
        name = name,
        in_file = "%s_generate" % name,
        out_file = out_file,
    )
