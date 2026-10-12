"""Download approved cross-build outputs without running PR code."""

import io
import json
import os
from pathlib import Path, PurePosixPath
import re
import tarfile
import urllib.parse
import urllib.request

API_URL = "https://formatjs.buildbuddy.io/api/v1/"
ARCHIVE_NAME = "release-cross-build-smoke.tar.gz"
MAX_ARCHIVE_BYTES = 512 * 1024 * 1024
MAX_EXTRACTED_BYTES = 2 * 1024 * 1024 * 1024
PACKAGES = (
    "cli-native-darwin-arm64",
    "cli-native-win32-x64",
    "cli-native-linux-x64-musl",
    "cli-native-linux-arm64-musl",
    "cli-native-linux-x64",
    "cli-native-linux-arm64",
)
REQUIRED_FILES = {
    "formatjs_cli-darwin-arm64",
    "formatjs_cli-win32-x64.exe",
    *(f"{package}/formatjs_cli_napi.node" for package in PACKAGES),
    *(f"{package}/package.json" for package in PACKAGES),
    "cli-native-linux-x64-musl/formatjs_cli",
    "cli-native-linux-arm64-musl/formatjs_cli",
}


def invocation_id(url):
    parsed = urllib.parse.urlsplit(url)
    if parsed.scheme != "https" or parsed.netloc != "formatjs.buildbuddy.io":
        raise ValueError("Unexpected BuildBuddy invocation host")
    match = re.fullmatch(r"/invocation/([0-9a-f-]{36})", parsed.path)
    if not match:
        raise ValueError("Invalid BuildBuddy invocation URL")
    return match.group(1)


def artifact_uri(response, expected_sha):
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
    artifacts = [
        artifact
        for artifact in invocation.get("artifacts", [])
        if PurePosixPath(artifact.get("name", "")).name == ARCHIVE_NAME
    ]
    if len(artifacts) != 1:
        raise ValueError("Expected exactly one smoke artifact archive")
    uri = artifacts[0].get("uri", "")
    parsed = urllib.parse.urlsplit(uri)
    if parsed.scheme != "bytestream" or parsed.netloc not in (
        "remote.buildbuddy.io",
        "formatjs.buildbuddy.io",
    ):
        raise ValueError("Unexpected BuildBuddy artifact URI")
    return uri


def extract_archive(contents, destination):
    with tarfile.open(fileobj=io.BytesIO(contents), mode="r:gz") as archive:
        members = []
        paths = set()
        total_size = 0
        for member in archive:
            members.append(member)
            if len(members) > 100:
                raise ValueError("Too many artifact entries")
            path = PurePosixPath(member.name)
            if path.is_absolute() or ".." in path.parts:
                raise ValueError("Unsafe artifact path")
            if not (member.isfile() or member.isdir()):
                raise ValueError("Artifact links and special files are forbidden")
            if member.isdir() and str(path) not in {".", *PACKAGES}:
                raise ValueError("Unexpected artifact directory")
            if member.isfile():
                name = str(path)
                if name in paths:
                    raise ValueError("Duplicate artifact path")
                paths.add(name)
                if name not in REQUIRED_FILES and not (
                    len(path.parts) == 2
                    and path.parts[0] in PACKAGES
                    and re.fullmatch(r"libstd-[a-zA-Z0-9_-]+\.(so|dylib|dll)", path.parts[1])
                ):
                    raise ValueError("Unexpected artifact file")
                total_size += member.size
                if total_size > MAX_EXTRACTED_BYTES:
                    raise ValueError("Smoke artifacts exceed size limit")
        if not REQUIRED_FILES.issubset(paths):
            raise ValueError("Smoke archive is missing required artifacts")
        destination.mkdir(parents=True, exist_ok=False)
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
        uri = artifact_uri(json.load(response), sha)
    with api_request("GetFile", {"uri": uri}, key) as response:
        contents = response.read(MAX_ARCHIVE_BYTES + 1)
    if len(contents) > MAX_ARCHIVE_BYTES:
        raise ValueError("Smoke archive exceeds size limit")
    extract_archive(contents, Path("artifacts"))
    print(f"Downloaded smoke artifacts for {sha} from {identifier}")


if __name__ == "__main__":
    main()
