"""Native Python wheel packaging."""

load("@rules_python//python:packaging.bzl", "py_package", "py_wheel")

_PLATFORMS = {
    "//tools/python:linux_x86_64": "manylinux2014_x86_64",
    "//tools/python:linux_arm64": "manylinux2014_aarch64",
    "//tools/python:macos_x86_64": "macosx_11_0_x86_64",
    "//tools/python:macos_arm64": "macosx_11_0_arm64",
}

def formatjs_python_wheel(
        name,
        library,
        extension,
        distribution,
        version,
        strip_path_prefixes,
        summary,
        description_file,
        license):
    """Package a Python facade and PyO3 abi3 extension."""
    py_package(
        name = name + "_package",
        deps = [library],
        packages = [native.package_name().replace("/", ".")],
    )

    py_wheel(
        name = name,
        abi = "abi3",
        author = "FormatJS Team",
        classifiers = [
            "Development Status :: 3 - Alpha",
            "Programming Language :: Python :: 3",
            "Programming Language :: Python :: 3.12",
            "Programming Language :: Python :: Implementation :: CPython",
            "Programming Language :: Rust",
            "Topic :: Software Development :: Internationalization",
        ],
        description_file = description_file,
        distribution = distribution,
        deps = [
            ":" + name + "_package",
            extension,
        ],
        license = license,
        platform = select(_PLATFORMS),
        python_requires = ">=3.12",
        python_tag = "cp312",
        strip_path_prefixes = strip_path_prefixes,
        summary = summary,
        tags = ["platform_specific_wheel"],
        version = version,
        visibility = ["//visibility:public"],
    )
