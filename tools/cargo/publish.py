import argparse
from dataclasses import asdict, dataclass
import json
from pathlib import Path
import subprocess
import time
import tomllib
from urllib.error import HTTPError
from urllib.request import Request, urlopen


@dataclass(frozen=True)
class Crate:
    name: str
    version: str
    manifest: str
    assembled: bool


class Registry:
    def __init__(self):
        self.versions = {}

    def published(self, crate, refresh=False):
        name = crate.name
        if refresh or name not in self.versions:
            if len(name) == 1:
                path = f'1/{name}'
            elif len(name) == 2:
                path = f'2/{name}'
            elif len(name) == 3:
                path = f'3/{name[0]}/{name}'
            else:
                path = f'{name[:2]}/{name[2:4]}/{name}'
            request = Request(
                f'https://index.crates.io/{path.lower()}',
                headers={
                    'User-Agent': 'formatjs-crates-release (https://github.com/formatjs/formatjs)',
                    'Cache-Control': 'no-cache',
                },
            )
            try:
                with urlopen(request, timeout=30) as response:
                    rows = [json.loads(line) for line in response.read().decode().splitlines() if line]
            except HTTPError as error:
                if error.code != 404:
                    raise
                rows = []
            self.versions[name] = {row['vers']: row for row in rows}
        version = self.versions[name].get(crate.version)
        if version and version.get('yanked'):
            raise ValueError(f'{name} {crate.version} is yanked; refusing to republish or depend on it')
        return version is not None


def plan_release(workspace, selected, registry):
    workspace = workspace.resolve()
    root = tomllib.loads((workspace / 'Cargo.toml').read_text())['workspace']
    manifests = {}
    packages = {}
    for member in root['members']:
        for directory in sorted(workspace.glob(member)):
            path = directory / 'Cargo.toml'
            manifest = tomllib.loads(path.read_text())
            name = manifest['package']['name']
            if name in packages:
                raise ValueError(f'Duplicate workspace crate: {name}')
            packages[name] = (path, manifest)
            manifests[path.resolve()] = name

    result = []
    visited = set()
    active = set()

    def visit(name):
        if name in active:
            raise ValueError(f'Workspace dependency cycle at {name}')
        if name in visited:
            return
        if name not in packages:
            raise ValueError(f'Unknown workspace crate: {name}')
        path, manifest = packages[name]
        package = manifest['package']
        publish = package.get('publish', True)
        if publish is not True and (not isinstance(publish, list) or 'crates-io' not in publish):
            raise ValueError(f'{name} is not publishable on crates.io')
        crate = Crate(
            name,
            package['version'],
            str(path.relative_to(workspace)),
            path.parent.name.startswith('intl_') or name == 'formatjs_temporal',
        )
        if registry.published(crate):
            print(f'Skipping published {name} {crate.version}')
            visited.add(name)
            return
        active.add(name)
        sections = [manifest, *manifest.get('target', {}).values()]
        for section in sections:
            for kind in ('dependencies', 'build-dependencies', 'dev-dependencies'):
                for alias, dependency in section.get(kind, {}).items():
                    if not isinstance(dependency, dict):
                        continue
                    base = path.parent
                    if dependency.get('workspace'):
                        inherited = root.get('dependencies', {})[alias]
                        dependency = {**inherited, **dependency} if isinstance(inherited, dict) else {}
                        base = workspace
                    if 'path' not in dependency:
                        continue
                    # Cargo drops dev path dependencies without a registry version when packaging.
                    if kind == 'dev-dependencies' and 'version' not in dependency:
                        continue
                    dependency_path = (base / dependency['path'] / 'Cargo.toml').resolve()
                    if dependency_path not in manifests:
                        raise ValueError(f'{name}: dependency outside workspace: {dependency_path}')
                    if 'version' not in dependency:
                        raise ValueError(f'{name}: path dependency {alias} has no registry version')
                    visit(manifests[dependency_path])
        active.remove(name)
        visited.add(name)
        result.append(crate)

    for name in selected:
        visit(name)
    return result


def publish_release(plan, workspace, release_dir, registry, dry_run=False):
    directory = release_dir or workspace
    if any(crate.assembled for crate in plan) and not release_dir:
        raise ValueError('Generated-data crates require the Bazel-assembled release directory')
    for crate in plan:
        manifest = tomllib.loads((directory / crate.manifest).read_text())['package']
        if (manifest['name'], manifest['version']) != (crate.name, crate.version):
            raise ValueError(f'Release manifest differs from plan: {crate.name}')
    if dry_run:
        if plan:
            command = ['cargo', 'publish', '--locked', '--dry-run']
            if any(crate.assembled for crate in plan):
                command.append('--all-features')
            for crate in plan:
                command.extend(['-p', crate.name])
            subprocess.run(command, cwd=directory, check=True)
        return
    for crate in plan:
        if registry.published(crate, refresh=True):
            print(f'Skipping published {crate.name} {crate.version}')
            continue
        command = ['cargo', 'publish', '--locked', '-p', crate.name]
        if crate.assembled:
            command.append('--all-features')
        subprocess.run(command, cwd=directory, check=True)
        for attempt in range(30):
            if registry.published(crate, refresh=True):
                print(f'Published and verified {crate.name} {crate.version}')
                break
            if attempt == 29:
                raise TimeoutError(f'{crate.name} {crate.version} did not appear in crates.io index')
            time.sleep(20)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--workspace', required=True, type=Path)
    parser.add_argument('--plan', required=True, type=Path)
    parser.add_argument('--crate', action='append', default=[])
    parser.add_argument('--plan-only', action='store_true')
    parser.add_argument('--github-output', type=Path)
    parser.add_argument('--release-dir', type=Path)
    parser.add_argument('--dry-run', action='store_true')
    args = parser.parse_args()
    registry = Registry()
    if args.plan_only:
        plan = plan_release(args.workspace, args.crate, registry)
        args.plan.write_text(json.dumps([asdict(crate) for crate in plan], indent=2) + '\n')
        if args.github_output:
            with args.github_output.open('a') as output:
                output.write(f'has_crates={str(bool(plan)).lower()}\n')
                output.write(f'has_intl={str(any(crate.assembled for crate in plan)).lower()}\n')
                output.write(f'has_temporal={str(any(crate.name == "formatjs_temporal" for crate in plan)).lower()}\n')
                output.write('names<<EOF\n' + ''.join(f'{crate.name}\n' for crate in plan) + 'EOF\n')
    else:
        plan = [Crate(**crate) for crate in json.loads(args.plan.read_text())]
        publish_release(plan, args.workspace, args.release_dir, registry, args.dry_run)


if __name__ == '__main__':
    main()
