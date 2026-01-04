"""Extensions for bzlmod.

Installs a mylang toolchain.
Every module can define a toolchain version under the default name, "mylang".
The latest of those versions will be selected (the rest discarded),
and will always be registered by rules_mylang.

Additionally, the root module can define arbitrarily many more toolchain versions under different
names (the latest version will be picked for each name) and can register them as it sees fit,
effectively overriding the default named toolchain due to toolchain resolution precedence.
"""

load(":repositories.bzl", "mylang_register_toolchains")

_DEFAULT_NAME = "mylang"

mylang_toolchain = tag_class(attrs = {
    "name": attr.string(doc = """\
Base name for generated repositories, allowing more than one mylang toolchain to be registered.
Overriding the default is only permitted in the root module.
""", default = _DEFAULT_NAME),
    "mylang_version": attr.string(doc = "Explicit version of mylang.", mandatory = True),
})

def _toolchain_extension(module_ctx):
    registrations = {}
    for mod in module_ctx.modules:
        for toolchain in mod.tags.toolchain:
            if toolchain.name != _DEFAULT_NAME and not mod.is_root:
                fail("""\
                Only the root module may override the default name for the mylang toolchain.
                This prevents conflicting registrations in the global namespace of external repos.
                """)
            if toolchain.name not in registrations.keys():
                registrations[toolchain.name] = []
            registrations[toolchain.name].append(toolchain.mylang_version)
    for name, versions in registrations.items():
        if len(versions) > 1:
            # TODO: should be semver-aware, using MVS
            selected = sorted(versions, reverse = True)[0]

            # buildifier: disable=print
            print("NOTE: mylang toolchain {} has multiple versions {}, selected {}".format(name, versions, selected))
        else:
            selected = versions[0]

        mylang_register_toolchains(
            name = name,
            mylang_version = selected,
            register = False,
        )
    return module_ctx.extension_metadata(
        # Return True if the behavior of the module extension is fully
        # determined by its inputs. Return False if the module depends on
        # outside state, for example, if it needs to fetch an external list
        # of versions, URLs, or hashes that could change.
        #
        # If True, Bazel omits information from the lock file, expecting that
        # it can be reproduced.
        reproducible = True,
    )

mylang = module_extension(
    implementation = _toolchain_extension,
    tag_classes = {"toolchain": mylang_toolchain},
    # Mark the extension as OS and architecture independent to simplify the
    # lock file. An independent module extension may still download OS- and
    # arch-dependent files, but it should download the same set of files
    # regardless of the host platform.
    os_dependent = False,
    arch_dependent = False,
)
