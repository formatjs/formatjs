import re
import sys
import tarfile
import tomllib
import unittest
from pathlib import Path

WORKSPACE = Path(sys.argv.pop())


class CargoReleaseTest(unittest.TestCase):
    def test_bundled_paths_resolve_without_bazel(self):
        manifests = list(WORKSPACE.glob('crates/*/Cargo.toml'))
        self.assertTrue(manifests)
        for manifest_path in manifests:
            crate = manifest_path.parent
            member = crate.name
            manifest = tomllib.loads((crate / 'Cargo.toml').read_text())
            self.assertTrue((crate / manifest['lib']['path']).is_file(), member)
            for dependency in manifest.get('dependencies', {}).values():
                if isinstance(dependency, dict) and 'path' in dependency:
                    self.assertTrue((crate / dependency['path'] / 'Cargo.toml').is_file(), member)
                    self.assertIn('version', dependency, member)
            build = crate / 'build.rs'
            if build.exists():
                for path in re.findall(r'root.join\("([^"{}]+)"\)', build.read_text()):
                    self.assertTrue((crate / path).exists(), f'{member}: {path}')
            module = crate / 'data/compiled_locale_data.rs'
            if module.exists():
                for path in re.findall(r'include_bytes!\("([^"]+)"\)', module.read_text()):
                    self.assertTrue((module.parent / path).is_file(), f'{member}: {path}')

    def test_datetime_archive_is_self_contained_and_writable(self):
        archive = WORKSPACE / 'crates/intl_datetimeformat/data/compiled-locales.tar.xz'
        with tarfile.open(archive) as bundle:
            members = bundle.getmembers()
            files = {member.name for member in members if member.isfile()}
            module = bundle.extractfile('compiled_locale_data.rs').read().decode()
            records = re.findall(r'include_bytes!\("([^"]+)"\)', module)
            self.assertTrue(records)
            self.assertTrue(set(records).issubset(files))
            for member in members:
                self.assertTrue(member.mode & 0o200, member.name)
                self.assertFalse(Path(member.name).is_absolute(), member.name)
                self.assertNotIn('..', Path(member.name).parts)


if __name__ == '__main__':
    unittest.main()
