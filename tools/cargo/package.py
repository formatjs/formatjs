#!/usr/bin/env python3
import argparse
import json
from pathlib import Path
import shutil
import tarfile
import tomllib


def archive_metadata(info):
    info.mode = 0o755 if info.isdir() else 0o644
    info.uid = info.gid = info.mtime = 0
    info.uname = info.gname = ''
    return info


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--out', required=True, type=Path)
    parser.add_argument('--inputs', required=True, type=Path)
    args = parser.parse_args()
    inputs = json.loads(args.inputs.read_text())
    out = args.out
    out.mkdir(parents=True, exist_ok=True)
    for source, destination in inputs['sources'].items():
        target = out / destination
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(source, target)
    for manifest in sorted((out / 'crates').glob('*/Cargo.toml')):
        package = tomllib.loads(manifest.read_text())['package']
        if not package['name'].startswith('formatjs_intl_'):
            continue
        if package.get('publish') is not True:
            raise ValueError(f'{manifest}: publishing is disabled')
        name = manifest.parent.name
        target = manifest.parent
        for notice in ('LICENSE.md', 'THIRD_PARTY_NOTICES.html'):
            shutil.copyfile(inputs['notices'][notice], target / notice)
        data = target / 'data'
        variables = {}

        def copy(path):
            data.mkdir(exist_ok=True)
            destination = data / path.name
            if path.is_dir():
                shutil.copytree(path, destination)
            else:
                shutil.copyfile(path, destination)
            return 'data/' + path.name

        for key, paths in inputs['metadata'].get(name, {}).items():
            paths = [Path(path) for path in paths]
            if len(paths) != 1:
                raise ValueError(f'{name} {key}: expected one output')
            variables[key] = copy(paths[0])
        if name in inputs['compiled']:
            paths = [Path(path) for path in inputs['compiled'][name]]
            if name == 'intl_datetimeformat':
                # Cross-locale repetitions exceed gzip's window and the crates.io size limit.
                data.mkdir(exist_ok=True)
                archive = data / 'compiled-locales.tar.xz'
                with tarfile.open(archive, 'w:xz', preset=6, dereference=True) as bundle:
                    for path in paths:
                        bundle.add(path, arcname=path.name, filter=archive_metadata)
                variables['FORMATJS_COMPILED_LOCALES'] = '@out/compiled_locale_data.rs'
            else:
                for path in paths:
                    destination = copy(path)
                    if path.suffix == '.rs':
                        variables['FORMATJS_COMPILED_LOCALES'] = destination
        if name == 'intl_datetimeformat_calendars':
            for source in inputs['calendars']:
                path = Path(source)
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


if __name__ == '__main__':
    main()
