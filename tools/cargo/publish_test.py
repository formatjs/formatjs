import io
from pathlib import Path
import subprocess
import tempfile
import unittest
from unittest.mock import patch
from urllib.error import HTTPError

from tools.cargo.publish import Crate, Registry, plan_release, publish_release


class MemoryRegistry:
    def __init__(self, published=()):
        self.available = set(published)

    def published(self, crate, refresh=False):
        return crate.name in self.available


class PublishTest(unittest.TestCase):
    def setUp(self):
        temporary = tempfile.TemporaryDirectory()
        self.addCleanup(temporary.cleanup)
        self.workspace = Path(temporary.name)
        (self.workspace / 'Cargo.toml').write_text('[workspace]\nmembers = ["crates/*"]\n')

    def crate(self, name, dependencies=''):
        directory = self.workspace / 'crates' / name.removeprefix('formatjs_')
        directory.mkdir(parents=True)
        path = directory / 'Cargo.toml'
        path.write_text(f'[package]\nname = "{name}"\nversion = "1.0.0"\n{dependencies}')
        return Crate(name, '1.0.0', str(path.relative_to(self.workspace)), False)

    def test_temporal_release_expands_missing_dependencies_in_publish_order(self):
        self.crate('formatjs_intl_pluralrules')
        self.crate('formatjs_intl_numberformat', '''
[dependencies]
formatjs_intl_pluralrules = {path = "../intl_pluralrules", version = "1.0.0"}
''')
        self.crate('formatjs_intl_datetimeformat', '''
[dependencies]
formatjs_intl_numberformat = {path = "../intl_numberformat", version = "1.0.0"}
''')
        self.crate('formatjs_intl_datetimeformat_calendars', '''
[dependencies]
formatjs_intl_datetimeformat = {path = "../intl_datetimeformat", version = "1.0.0", optional = true}
''')
        self.crate('formatjs_temporal', '''
[dependencies]
formatjs_intl_datetimeformat_calendars = {path = "../intl_datetimeformat_calendars", version = "1.0.0", default-features = false}
''')
        self.crate('unrelated')
        plan = plan_release(self.workspace, ['formatjs_temporal'], MemoryRegistry(['formatjs_intl_pluralrules']))
        self.assertEqual([crate.name for crate in plan], [
            'formatjs_intl_numberformat',
            'formatjs_intl_datetimeformat',
            'formatjs_intl_datetimeformat_calendars',
            'formatjs_temporal',
        ])
        self.assertTrue(all(crate.assembled for crate in plan))

    def test_published_root_skips_its_changed_workspace_dependencies(self):
        self.crate('dependency')
        self.crate('root', '[dependencies]\ndependency = {path = "../dependency", version = "1.0.0"}\n')
        self.assertEqual(plan_release(self.workspace, ['root'], MemoryRegistry(['root'])), [])

    def test_inherited_renamed_target_build_dependency_and_shared_roots(self):
        (self.workspace / 'Cargo.toml').write_text('''
[workspace]
members = ["crates/*"]
[workspace.dependencies]
alias = {package = "dependency", path = "crates/dependency", version = "1.0.0"}
''')
        self.crate('dependency')
        self.crate('root', '''
[target.'cfg(unix)'.build-dependencies]
alias = {workspace = true}
''')
        plan = plan_release(self.workspace, ['root', 'dependency', 'root'], MemoryRegistry())
        self.assertEqual([crate.name for crate in plan], ['dependency', 'root'])

    def test_cycle_and_private_dependencies_are_rejected(self):
        self.crate('a', '[dependencies]\nb = {path = "../b", version = "1.0.0"}\n')
        b = self.crate('b', '[dependencies]\na = {path = "../a", version = "1.0.0"}\n')
        with self.assertRaisesRegex(ValueError, 'cycle'):
            plan_release(self.workspace, ['a'], MemoryRegistry())
        (self.workspace / b.manifest).write_text('[package]\nname = "b"\nversion = "1.0.0"\npublish = false\n')
        with self.assertRaisesRegex(ValueError, 'not publishable'):
            plan_release(self.workspace, ['a'], MemoryRegistry())

    @patch('tools.cargo.publish.time.sleep')
    @patch('tools.cargo.publish.subprocess.run')
    def test_publish_waits_for_index_visibility_before_dependent(self, run, sleep):
        dependency = self.crate('dependency')
        root = self.crate('root')
        registry = MemoryRegistry()
        checks = []

        def visible(crate, refresh=False):
            checks.append(crate.name)
            return checks.count(crate.name) >= (3 if crate.name == 'dependency' else 2)

        registry.published = visible
        run.side_effect = lambda command, **kwargs: self.assertTrue(
            command[-1] != 'root' or checks.count('dependency') == 3
        )
        publish_release([dependency, root], self.workspace, None, registry)
        self.assertEqual([call.args[0] for call in run.call_args_list], [
            ['cargo', 'publish', '--locked', '-p', 'dependency'],
            ['cargo', 'publish', '--locked', '-p', 'root'],
        ])
        sleep.assert_called_once_with(20)

    @patch('tools.cargo.publish.subprocess.run')
    def test_partial_retry_skips_published_crates(self, run):
        dependency, root = self.crate('dependency'), self.crate('root')
        registry = MemoryRegistry(['dependency'])
        run.side_effect = lambda command, **kwargs: registry.available.add(command[-1])
        publish_release([dependency, root], self.workspace, None, registry)
        run.assert_called_once_with(['cargo', 'publish', '--locked', '-p', 'root'], cwd=self.workspace, check=True)

    @patch('tools.cargo.publish.subprocess.run', side_effect=subprocess.CalledProcessError(1, 'cargo'))
    def test_failed_publish_stops_dependents(self, run):
        dependency, root = self.crate('dependency'), self.crate('root')
        with self.assertRaises(subprocess.CalledProcessError):
            publish_release([dependency, root], self.workspace, None, MemoryRegistry())
        self.assertEqual(run.call_count, 1)

    @patch('tools.cargo.publish.subprocess.run')
    def test_dry_run_batches_missing_dependencies_without_uploads(self, run):
        dependency, root = self.crate('dependency'), self.crate('root')
        publish_release([dependency, root], self.workspace, None, MemoryRegistry(), dry_run=True)
        run.assert_called_once_with(
            ['cargo', 'publish', '--locked', '--dry-run', '-p', 'dependency', '-p', 'root'],
            cwd=self.workspace, check=True,
        )

    @patch('tools.cargo.publish.time.sleep')
    @patch('tools.cargo.publish.subprocess.run')
    def test_index_timeout_stops_dependents(self, run, sleep):
        dependency, root = self.crate('dependency'), self.crate('root')
        with self.assertRaises(TimeoutError):
            publish_release([dependency, root], self.workspace, None, MemoryRegistry())
        self.assertEqual(run.call_count, 1)
        self.assertEqual(sleep.call_count, 29)

    @patch('tools.cargo.publish.subprocess.run')
    def test_generated_release_requires_assembly_and_matching_versions(self, run):
        crate = self.crate('formatjs_temporal')
        plan = [Crate(crate.name, crate.version, crate.manifest, True)]
        with self.assertRaisesRegex(ValueError, 'Bazel-assembled'):
            publish_release(plan, self.workspace, None, MemoryRegistry())
        (self.workspace / crate.manifest).write_text(
            '[package]\nname = "formatjs_temporal"\nversion = "0.9.0"\n'
        )
        with self.assertRaisesRegex(ValueError, 'differs from plan'):
            publish_release(plan, self.workspace, self.workspace, MemoryRegistry(), dry_run=True)
        run.assert_not_called()

    @patch('tools.cargo.publish.urlopen')
    def test_registry_only_treats_404_as_missing(self, open_url):
        crate = Crate('formatjs_temporal', '1.1.0', '', True)
        open_url.side_effect = HTTPError('https://index.crates.io', 503, 'unavailable', {}, None)
        with self.assertRaises(HTTPError):
            Registry().published(crate)
        open_url.side_effect = HTTPError('https://index.crates.io', 404, 'missing', {}, None)
        self.assertFalse(Registry().published(crate))
        open_url.side_effect = None
        open_url.return_value = io.BytesIO(b'{"vers":"1.1.0","yanked":true}\n')
        with self.assertRaisesRegex(ValueError, 'yanked'):
            Registry().published(crate)


if __name__ == '__main__':
    unittest.main()
