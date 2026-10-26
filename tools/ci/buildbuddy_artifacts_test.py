import copy
import io
from pathlib import Path
import tarfile
import tempfile
import unittest

from tools.ci import buildbuddy_artifacts as artifacts


class ArtifactTest(unittest.TestCase):
    def response(self):
        return {
            "invocation": [{
                "commitSha": "a" * 40,
                "repoUrl": "https://github.com/formatjs/formatjs",
                "pattern": "Cross-build Release Artifacts",
                "success": True,
                "invocationStatus": "COMPLETE_INVOCATION_STATUS",
                "artifacts": [{
                    "name": artifacts.ARCHIVE_NAME,
                    "uri": "bytestream://remote.buildbuddy.io/blobs/digest/100",
                }],
            }],
        }

    def archive(self, extra=None, omit=None):
        output = io.BytesIO()
        with tarfile.open(fileobj=output, mode="w:gz") as archive:
            for name in artifacts.REQUIRED_FILES - set(omit or []):
                member = tarfile.TarInfo(name)
                member.size = 1
                archive.addfile(member, io.BytesIO(b"x"))
            if extra:
                archive.addfile(extra, io.BytesIO(b"x" * extra.size))
        return output.getvalue()

    def test_invocation_url_rejects_other_hosts(self):
        for url in (
            "https://evil.example/invocation/" + "a" * 36,
            "https://formatjs.buildbuddy.io@evil.example/invocation/" + "a" * 36,
            "http://formatjs.buildbuddy.io/invocation/" + "a" * 36,
        ):
            with self.subTest(url=url), self.assertRaises(ValueError):
                artifacts.invocation_id(url)

    def test_requires_successful_matching_cross_build(self):
        response = self.response()
        self.assertTrue(artifacts.artifact_uri(response, "a" * 40).startswith("bytestream:"))
        for field, value in (
            ("commitSha", "b" * 40),
            ("success", False),
            ("pattern", "Test all targets"),
            ("invocationStatus", "PARTIAL_INVOCATION_STATUS"),
            ("repoUrl", "https://github.com/other/repo"),
        ):
            invalid = copy.deepcopy(response)
            invalid["invocation"][0][field] = value
            with self.subTest(field=field), self.assertRaises(ValueError):
                artifacts.artifact_uri(invalid, "a" * 40)

    def test_requires_one_archive_and_known_storage(self):
        for values in (
            [],
            self.response()["invocation"][0]["artifacts"] * 2,
            [{"name": artifacts.ARCHIVE_NAME, "uri": "https://evil.example/archive"}],
        ):
            invalid = self.response()
            invalid["invocation"][0]["artifacts"] = values
            with self.subTest(values=values), self.assertRaises(ValueError):
                artifacts.artifact_uri(invalid, "a" * 40)

    def test_extracts_complete_archive_and_runtime_library(self):
        member = tarfile.TarInfo("cli-native-linux-x64-musl/libstd-abc123.so")
        member.size = 1
        with tempfile.TemporaryDirectory() as directory:
            destination = Path(directory) / "artifacts"
            artifacts.extract_archive(self.archive(extra=member), destination)
            self.assertTrue((destination / member.name).is_file())
            for name in artifacts.REQUIRED_FILES:
                self.assertTrue((destination / name).is_file())

    def test_rejects_unsafe_archive_before_writing(self):
        extras = []
        for name in ("../escape", "/escape", "cli-native-linux-x64-musl/install.sh"):
            member = tarfile.TarInfo(name)
            member.size = 1
            extras.append(member)
        for kind in (tarfile.SYMTYPE, tarfile.LNKTYPE, tarfile.FIFOTYPE):
            member = tarfile.TarInfo("cli-native-linux-x64-musl/libstd-evil.so")
            member.type = kind
            member.linkname = "/outside"
            extras.append(member)
        for extra in extras:
            with self.subTest(name=extra.name, kind=extra.type), tempfile.TemporaryDirectory() as directory:
                destination = Path(directory) / "artifacts"
                with self.assertRaises(ValueError):
                    artifacts.extract_archive(self.archive(extra=extra), destination)
                self.assertFalse(destination.exists())

    def test_rejects_missing_artifacts(self):
        for missing in (
            "formatjs_cli-win32-x64.exe",
            "hermes-intl-darwin-arm64",
            "hermes-intl-extension.hbc",
        ):
            with self.subTest(missing=missing), tempfile.TemporaryDirectory() as directory:
                destination = Path(directory) / "artifacts"
                with self.assertRaisesRegex(ValueError, "missing required artifacts"):
                    artifacts.extract_archive(self.archive(omit=[missing]), destination)
                self.assertFalse(destination.exists())


if __name__ == "__main__":
    unittest.main()
