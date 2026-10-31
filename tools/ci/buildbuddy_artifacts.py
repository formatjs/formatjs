"""Download approved cross-build outputs without running PR code."""

import io
import json
import os
from contextlib import ExitStack
from pathlib import Path, PurePosixPath
import re
import tarfile
import urllib.parse
import urllib.request

API_URL = "https://formatjs.buildbuddy.io/api/v1/"
ARCHIVE_NAME = "release-cross-build-smoke.tar.gz"
SDK_ARCHIVE_NAME = "hermes-extension-smoke.tar.gz"
APPLE_ARCHIVE_NAME = "apple-sdk-smoke.tar.gz"
ARCHIVE_NAMES = (ARCHIVE_NAME, SDK_ARCHIVE_NAME, APPLE_ARCHIVE_NAME)
MAX_ARCHIVE_BYTES = 1024 * 1024 * 1024
MAX_EXTRACTED_BYTES = 2 * 1024 * 1024 * 1024
PACKAGES = (
    "cli-native-darwin-arm64",
    "cli-native-win32-x64",
    "cli-native-linux-x64-musl",
    "cli-native-linux-arm64-musl",
    "cli-native-linux-x64",
    "cli-native-linux-arm64",
)
LEGACY_REQUIRED_FILES = {
    "formatjs_cli-darwin-arm64",
    "formatjs_cli-win32-x64.exe",
    *(f"{package}/formatjs_cli_napi.node" for package in PACKAGES),
    *(f"{package}/package.json" for package in PACKAGES),
    "cli-native-linux-x64-musl/formatjs_cli",
    "cli-native-linux-arm64-musl/formatjs_cli",
}
SDK_REQUIRED_FILES = {"hermes-intl-darwin-arm64", "hermes-intl-extension.hbc"}
APPLE_REQUIRED_FILES = {
    "formatjs-hermes-intl-apple.tar.gz",
    *(f"apple-sdk-smoke/{file}" for file in (
        ".bazelrc", ".bazelversion", "MODULE.bazel", "BUILD.bazel", "main.cpp", "smoke.sh"
    )),
}
REQUIRED_FILES = LEGACY_REQUIRED_FILES | SDK_REQUIRED_FILES | APPLE_REQUIRED_FILES
ARCHIVE_REQUIRED_FILES = {
    ARCHIVE_NAME: LEGACY_REQUIRED_FILES,
    SDK_ARCHIVE_NAME: SDK_REQUIRED_FILES,
    APPLE_ARCHIVE_NAME: APPLE_REQUIRED_FILES,
}
ARCHIVE_DIRECTORIES = {
    ARCHIVE_NAME: set(PACKAGES),
    SDK_ARCHIVE_NAME: set(),
    APPLE_ARCHIVE_NAME: {"apple-sdk-smoke"},
}


def invocation_id(url):
    parsed = urllib.parse.urlsplit(url)
    if parsed.scheme != "https" or parsed.netloc != "formatjs.buildbuddy.io":
        raise ValueError("Unexpected BuildBuddy invocation host")
    match = re.fullmatch(r"/invocation/([0-9a-f-]{36})", parsed.path)
    if not match:
        raise ValueError("Invalid BuildBuddy invocation URL")
    return match.group(1)


def artifact_uris(response, expected_sha):
    invocations = response.get("invocation", [])
    if len(invocations) != 1:
        raise ValueError("Expected exactly one BuildBuddy invocation")
    invocation = invocations[0]
    if (
        invocation.get("commitSha") != expected_sha
        or invocation.get("repoUrl", "").removesuffix(".git")
        != "https://github.com/formatjs/formatjs"
        or invocation.get("pattern") != "Cross-build Release Artifacts"
        or not invocation.get("success")
        or invocation.get("invocationStatus") != "COMPLETE_INVOCATION_STATUS"
    ):
        raise ValueError("Cross-build invocation does not match successful commit")
    uris = {}
    for name in ARCHIVE_NAMES:
        artifacts = [
            artifact
            for artifact in invocation.get("artifacts", [])
            if PurePosixPath(artifact.get("name", "")).name == name
        ]
        if len(artifacts) != 1:
            raise ValueError(f"Expected exactly one smoke artifact archive: {name}")
        uri = artifacts[0].get("uri", "")
        parsed = urllib.parse.urlsplit(uri)
        if parsed.scheme != "bytestream" or parsed.netloc not in (
            "remote.buildbuddy.io",
            "formatjs.buildbuddy.io",
        ):
            raise ValueError("Unexpected BuildBuddy artifact URI")
        uris[name] = uri
    return uris


def extract_archives(contents, destination):
    if set(contents) != set(ARCHIVE_NAMES):
        raise ValueError("Expected all smoke artifact archives")
    if sum(len(value) for value in contents.values()) > MAX_ARCHIVE_BYTES:
        raise ValueError("Smoke archives exceed size limit")
    with ExitStack() as stack:
        archives = []
        paths = set()
        entry_count = 0
        total_size = 0
        for archive_name in ARCHIVE_NAMES:
            archive = stack.enter_context(
                tarfile.open(fileobj=io.BytesIO(contents[archive_name]), mode="r:gz")
            )
            members = []
            files = set()
            required = ARCHIVE_REQUIRED_FILES[archive_name]
            for member in archive:
                members.append(member)
                entry_count += 1
                if entry_count > 100:
                    raise ValueError("Too many artifact entries")
                path = PurePosixPath(member.name)
                if path.is_absolute() or ".." in path.parts:
                    raise ValueError("Unsafe artifact path")
                if not (member.isfile() or member.isdir()):
                    raise ValueError("Artifact links and special files are forbidden")
                name = str(path)
                if name in paths:
                    raise ValueError("Duplicate artifact path")
                paths.add(name)
                if member.isdir():
                    if name not in {"."} | ARCHIVE_DIRECTORIES[archive_name]:
                        raise ValueError("Unexpected artifact directory")
                else:
                    files.add(name)
                    if name not in required and not (
                        archive_name == ARCHIVE_NAME
                        and len(path.parts) == 2
                        and path.parts[0] in PACKAGES
                        and re.fullmatch(r"libstd-[a-zA-Z0-9_-]+\.(so|dylib|dll)", path.parts[1])
                    ):
                        raise ValueError("Unexpected artifact file")
                    total_size += member.size
                    if total_size > MAX_EXTRACTED_BYTES:
                        raise ValueError("Smoke artifacts exceed size limit")
            if not required.issubset(files):
                raise ValueError("Smoke archive is missing required artifacts")
            archives.append((archive, members))

        # Validate both archives before either can write to the destination.
        destination.mkdir(parents=True, exist_ok=False)
        for archive, members in archives:
            archive.extractall(destination, members=members, filter="data")


def api_request(method, body, key):
    request = urllib.request.Request(
        API_URL + method,
        data=json.dumps(body).encode(),
        headers={"Content-Type": "application/json", "x-buildbuddy-api-key": key},
    )
    return urllib.request.urlopen(request, timeout=120)


def main():
    key = os.environ["BUILDBUDDY_API_KEY"]
    if not key:
        raise ValueError("BuildBuddy read-only key is not configured")
    sha = os.environ["BUILD_SHA"]
    if not re.fullmatch(r"[0-9a-f]{40}", sha):
        raise ValueError("Invalid build commit SHA")
    identifier = invocation_id(os.environ["INVOCATION_URL"])
    with api_request(
        "GetInvocation",
        {"selector": {"invocation_id": identifier}, "include_artifacts": True},
        key,
    ) as response:
        uris = artifact_uris(json.load(response), sha)
    contents = {}
    for name, uri in uris.items():
        with api_request("GetFile", {"uri": uri}, key) as response:
            contents[name] = response.read(MAX_ARCHIVE_BYTES + 1)
        if sum(len(value) for value in contents.values()) > MAX_ARCHIVE_BYTES:
            raise ValueError("Smoke archives exceed size limit")
    extract_archives(contents, Path("artifacts"))
    print(f"Downloaded smoke artifacts for {sha} from {identifier}")


if __name__ == "__main__":
    main()
