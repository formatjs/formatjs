#!/usr/bin/env python3
import argparse
import json
from pathlib import Path
import shutil
import subprocess
import tarfile
import tomllib

COMPILED = (
    'intl_numberformat', 'intl_datetimeformat', 'intl_pluralrules',
    'intl_listformat', 'intl_displaynames', 'intl_relativetimeformat',
)
INPUTS = {
    'intl_collator': {'FORMATJS_COLLATION_DATA': '//crates/intl_collator:data'},
    'intl_numberformat': {'FORMATJS_NUMBER_METADATA': '//crates/intl_numberformat:metadata'},
    'intl_durationformat': {'FORMATJS_DURATION_METADATA': '//crates/intl_durationformat:metadata'},
    'intl_datetimeformat': {
        'FORMATJS_TIMEZONE_LINKS': '//crates/intl_datetimeformat:timezone_links',
        'FORMATJS_DATETIME_LOCALE_ALIASES': '//crates/intl_datetimeformat:locale_aliases',
        'FORMATJS_COMPILED_TIMEZONES': '//packages/intl-datetimeformat:tz_all_json',
    },
}
CALENDARS = '//crates/intl_datetimeformat_calendars:calendar_data'


def archive_metadata(info):
    info.mode = 0o755 if info.isdir() else 0o644
    info.uid = info.gid = info.mtime = 0
    info.uname = info.gname = ''
    return info


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--out', required=True, type=Path)
    parser.add_argument('--bazel', default='bazel')
    args = parser.parse_args()
    root = Path(__file__).resolve().parents[1]
    out = args.out.resolve()
    if out.exists():
        parser.error('Output directory already exists; choose a fresh directory')
    labels = {label for values in INPUTS.values() for label in values.values()}
    labels.update(f'//crates/{name}:compiled_locale_data' for name in COMPILED)
    labels.add(CALENDARS)
    subprocess.run([args.bazel, 'build', *sorted(labels)], cwd=root, check=True)
    result = subprocess.run([
        args.bazel, 'cquery', 'set(' + ' '.join(sorted(labels)) + ')',
        '--output=starlark',
        '--starlark:expr=json.encode({"label":str(target.label),"files":[f.path for f in target.files.to_list()]})',
    ], cwd=root, check=True, capture_output=True, text=True)
    outputs = {}
    for line in result.stdout.splitlines():
        if line.startswith('{'):
            item = json.loads(line)
            label = item['label'].removeprefix('@@').removeprefix('@')
            outputs[label] = [root / path for path in item['files']]
    members = []
    for manifest in sorted((root / 'crates').glob('intl_*/Cargo.toml')):
        package = tomllib.loads(manifest.read_text())['package']
        if not package['name'].startswith('formatjs_intl_'):
            continue
        if package.get('publish') is not True:
            raise ValueError(f'{manifest}: publishing is disabled')
        name = manifest.parent.name
        target = out / 'crates' / name
        shutil.copytree(manifest.parent, target, ignore=shutil.ignore_patterns('target', 'node_modules'))
        for notice in ('LICENSE.md', 'THIRD_PARTY_NOTICES.html'):
            shutil.copy2(root / 'native/hermes/package' / notice, target / notice)
        members.append('crates/' + name)
        data = target / 'data'
        variables = {}

        def copy(path):
            data.mkdir(exist_ok=True)
            destination = data / path.name
            if path.is_dir():
                shutil.copytree(path, destination)
            else:
                shutil.copy2(path, destination)
            return 'data/' + path.name

        for key, label in INPUTS.get(name, {}).items():
            paths = outputs[label]
            if len(paths) != 1:
                raise ValueError(f'{label}: expected one output')
            variables[key] = copy(paths[0])
        if name in COMPILED:
            paths = outputs[f'//crates/{name}:compiled_locale_data']
            if name == 'intl_datetimeformat':
                # Cross-locale repetitions exceed gzip's window and the crates.io size limit.
                archive = data / 'compiled-locales.tar.xz'
                with tarfile.open(archive, 'w:xz', preset=6) as bundle:
                    for path in paths:
                        bundle.add(path, arcname=path.name, filter=archive_metadata)
                variables['FORMATJS_COMPILED_LOCALES'] = '@out/compiled_locale_data.rs'
                with (target / 'Cargo.toml').open('a') as cargo:
                    cargo.write('\n[build-dependencies]\nlzma-rs = "0.3"\ntar = "0.4"\n')
            else:
                for path in paths:
                    destination = copy(path)
                    if path.suffix == '.rs':
                        variables['FORMATJS_COMPILED_LOCALES'] = destination
        if name == 'intl_datetimeformat_calendars':
            for path in outputs[CALENDARS]:
                key = 'FORMATJS_CALENDAR_' + path.stem.upper().replace('-', '_')
                variables[key] = copy(path)
        if variables:
            body = 'use std::{env, path::PathBuf};\nfn main() {\n'
            body += '    let root = PathBuf::from(env::var_os("CARGO_MANIFEST_DIR").unwrap());\n'
            if name == 'intl_datetimeformat':
                body += '''    let output = PathBuf::from(env::var_os("OUT_DIR").unwrap()).join("locale-data");
    println!("cargo:rerun-if-changed=data/compiled-locales.tar.xz");
    if env::var_os("CARGO_FEATURE_COMPILED_DATA").is_some() {
        std::fs::create_dir_all(&output).unwrap();
        let mut input = std::io::BufReader::new(std::fs::File::open(root.join("data/compiled-locales.tar.xz")).unwrap());
        let unpacked = output.join("compiled-locales.tar");
        lzma_rs::xz_decompress(&mut input, &mut std::fs::File::create(&unpacked).unwrap()).unwrap();
        tar::Archive::new(std::fs::File::open(unpacked).unwrap()).unpack(&output).unwrap();
    }
'''
            for key, path in sorted(variables.items()):
                base, relative = ('output', path[5:]) if path.startswith('@out/') else ('root', path)
                body += f'    println!("cargo:rustc-env={key}={{}}", {base}.join({json.dumps(relative)}).display());\n'
                if base == 'root':
                    body += f'    println!("cargo:rerun-if-changed={relative}");\n'
            (target / 'build.rs').write_text(body + '}\n')
    (out / 'Cargo.toml').write_text('[workspace]\nresolver = "3"\nmembers = ' + json.dumps(members) + '\n')
    shutil.copy2(root / 'Cargo.lock', out / 'Cargo.lock')
    print(f'Staged {len(members)} crates at {out}')


if __name__ == '__main__':
    main()
