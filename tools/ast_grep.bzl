"Bazel macros for ast-grep structural linting."

load("@rules_shell//shell:sh_test.bzl", "sh_test")

def ast_grep_test(name, pattern, data, lang = "javascript", **kwargs):
    """Test that an ast-grep pattern matches in the given data files.

    Fails if the pattern is NOT found (useful for asserting code patterns
    are preserved in bundled output).

    Args:
        name: target name
        pattern: ast-grep pattern to search for
        data: list of file/directory targets to scan
        lang: language for ast-grep (default: javascript)
        **kwargs: additional args passed to sh_test
    """
    sh_test(
        name = name,
        srcs = ["//tools:ast_grep_test.sh"],
        args = [
            "$(location //:ast-grep)",
            lang,
            pattern,
        ] + ["$(location %s)" % d for d in data],
        data = data + ["//:ast-grep"],
        **kwargs
    )
