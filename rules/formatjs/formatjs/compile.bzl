"""Rules for compiling messages using @formatjs/cli"""

def formatjs_compile(
        name,
        src,
        out = None,
        ast = False,
        format = "simple",
        formatjs_cli = "@npm//@formatjs/cli/bin:formatjs",
        **kwargs):
    """Compile extracted messages into optimized formats.

    Args:
        name: Name of the target
        src: Source JSON file with extracted messages
        out: Output compiled JSON file (defaults to name + ".json")
        ast: Whether to compile to AST format
        format: Input format (simple, crowdin, smartling, transifex)
        formatjs_cli: Label for the formatjs CLI tool. Defaults to @npm//@formatjs/cli/bin:formatjs
        **kwargs: Additional arguments passed to the underlying rule
    """
    if not out:
        out = name + ".json"

    args = [
        "compile",
        "$(location %s)" % src,
        "--out-file",
        "$(location %s)" % out,
        "--format",
        format,
    ]

    if ast:
        args.append("--ast")

    native.genrule(
        name = name,
        srcs = [src],
        outs = [out],
        cmd = "BAZEL_BINDIR=. $(location %s) " % formatjs_cli + " ".join(args),
        tools = [formatjs_cli],
        **kwargs
    )
