import copy
import io
from pathlib import Path
import tarfile
import tempfile
import unittest
from unittest import mock

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
                "artifacts": [
                    {
                        "name": name,
                        "uri": f"bytestream://remote.buildbuddy.io/blobs/digest{index}/100",
                    }
                    for index, name in enumerate(artifacts.ARCHIVE_NAMES)
                ],
            }],
        }

    def archive(self, files, extra=None, omit=None):
        output = io.BytesIO()
        with tarfile.open(fileobj=output, mode="w:gz") as archive:
            for name in files - set(omit or []):
                member = tarfile.TarInfo(name)
                member.size = 1
                archive.addfile(member, io.BytesIO(b"x"))
            if extra:
                archive.addfile(extra, io.BytesIO(b"x" * extra.size))
        return output.getvalue()

    def archives(self, extra=None, omit=None, archive_name=artifacts.ARCHIVE_NAME):
        return {
            name: self.archive(
                files,
                extra=extra if name == archive_name else None,
                omit=omit if name == archive_name else None,
            )
            for name, files in artifacts.ARCHIVE_REQUIRED_FILES.items()
        }

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
        uris = artifacts.artifact_uris(response, "a" * 40)
        self.assertEqual(set(uris), set(artifacts.ARCHIVE_NAMES))
        self.assertTrue(all(uri.startswith("bytestream:") for uri in uris.values()))
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
                artifacts.artifact_uris(invalid, "a" * 40)

    def test_requires_all_archives_once_and_known_storage(self):
        declared = self.response()["invocation"][0]["artifacts"]
        unknown_storage = copy.deepcopy(declared)
        unknown_storage[1]["uri"] = "https://evil.example/archive"
        for values in (
            [],
            declared[:1],
            declared[:2],
            declared[1:],
            declared * 2,
            unknown_storage,
        ):
            invalid = self.response()
            invalid["invocation"][0]["artifacts"] = values
            with self.subTest(values=values), self.assertRaises(ValueError):
                artifacts.artifact_uris(invalid, "a" * 40)

    def test_extracts_complete_split_archives_and_runtime_library(self):
        member = tarfile.TarInfo("cli-native-linux-x64-musl/libstd-abc123.so")
        member.size = 1
        with tempfile.TemporaryDirectory() as directory:
            destination = Path(directory) / "artifacts"
            artifacts.extract_archives(self.archives(extra=member), destination)
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
        for archive_name in artifacts.ARCHIVE_NAMES:
            for extra in extras:
                with self.subTest(archive=archive_name, name=extra.name, kind=extra.type), tempfile.TemporaryDirectory() as directory:
                    destination = Path(directory) / "artifacts"
                    with self.assertRaises(ValueError):
                        artifacts.extract_archives(
                            self.archives(extra=extra, archive_name=archive_name), destination
                        )
                    self.assertFalse(destination.exists())

    def test_rejects_missing_artifacts(self):
        for missing in (
            "formatjs_cli-win32-x64.exe",
            "hermes-intl-darwin-arm64",
            "hermes-intl-extension.hbc",
            "formatjs-hermes-intl-apple.tar.gz",
            "apple-sdk-smoke/smoke.sh",
        ):
            with self.subTest(missing=missing), tempfile.TemporaryDirectory() as directory:
                destination = Path(directory) / "artifacts"
                with self.assertRaisesRegex(ValueError, "missing required artifacts"):
                    archive_name = next(
                        name for name, files in artifacts.ARCHIVE_REQUIRED_FILES.items()
                        if missing in files
                    )
                    artifacts.extract_archives(
                        self.archives(omit=[missing], archive_name=archive_name), destination
                    )
                self.assertFalse(destination.exists())

    def test_rejects_cross_archive_duplicate_before_writing(self):
        duplicate = tarfile.TarInfo("./formatjs_cli-darwin-arm64")
        duplicate.size = 1
        with tempfile.TemporaryDirectory() as directory:
            destination = Path(directory) / "artifacts"
            with self.assertRaisesRegex(ValueError, "Duplicate artifact path"):
                artifacts.extract_archives(
                    self.archives(extra=duplicate, archive_name=artifacts.SDK_ARCHIVE_NAME),
                    destination,
                )
            self.assertFalse(destination.exists())

    def test_requires_split_archive_file_contracts(self):
        contents = self.archives()
        contents[artifacts.ARCHIVE_NAME] = self.archive(artifacts.REQUIRED_FILES)
        contents[artifacts.SDK_ARCHIVE_NAME] = self.archive(set())
        with tempfile.TemporaryDirectory() as directory:
            destination = Path(directory) / "artifacts"
            with self.assertRaisesRegex(ValueError, "Unexpected artifact file"):
                artifacts.extract_archives(contents, destination)
            self.assertFalse(destination.exists())

    def test_archives_can_each_contain_root_directory(self):
        root = tarfile.TarInfo("./")
        root.type = tarfile.DIRTYPE
        contents = {
            name: self.archive(files, extra=root)
            for name, files in artifacts.ARCHIVE_REQUIRED_FILES.items()
        }
        with tempfile.TemporaryDirectory() as directory:
            destination = Path(directory) / "artifacts"
            artifacts.extract_archives(contents, destination)
            self.assertEqual(
                {str(path.relative_to(destination)) for path in destination.rglob("*")
                 if path.is_file()},
                artifacts.REQUIRED_FILES,
            )

    def test_combined_size_limits_apply_before_writing(self):
        contents = self.archives()
        for constant, limit in (
            ("MAX_ARCHIVE_BYTES", sum(len(value) for value in contents.values()) - 1),
            ("MAX_EXTRACTED_BYTES", len(artifacts.REQUIRED_FILES) - 1),
        ):
            with self.subTest(constant=constant), tempfile.TemporaryDirectory() as directory:
                destination = Path(directory) / "artifacts"
                with mock.patch.object(artifacts, constant, limit), self.assertRaisesRegex(
                    ValueError, "size limit"
                ):
                    artifacts.extract_archives(contents, destination)
                self.assertFalse(destination.exists())


if __name__ == "__main__":
    unittest.main()
