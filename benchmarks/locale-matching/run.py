#!/usr/bin/env python3
"""Build with Bazel, then compare the same locale workloads in fresh processes."""
import argparse
import datetime
import json
import os
from pathlib import Path
import platform
import statistics
import subprocess
import tempfile
import time

ROOT = Path(__file__).resolve().parents[2]

def command(args):
    result = subprocess.run(args, cwd=ROOT, text=True, capture_output=True)
    if result.returncode:
        raise RuntimeError(result.stdout + result.stderr)
    return result

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--icu4c-prefix', default=os.environ.get('ICU4C_PREFIX'))
    parser.add_argument('--iterations', type=int, default=100000)
    parser.add_argument('--repetitions', type=int, default=5)
    parser.add_argument('--output', default=str(ROOT / 'benchmarks/locale-matching/results.json'))
    args = parser.parse_args()
    prefix = args.icu4c_prefix
    if not prefix:
        prefix = command(['pkg-config', '--variable=prefix', 'icu-uc']).stdout.strip()
    prefix = Path(prefix).resolve()
    if not (prefix / 'include/unicode/localematcher.h').exists():
        raise RuntimeError('ICU4C prefix must contain include/unicode/localematcher.h')
    with tempfile.TemporaryDirectory(prefix='formatjs-icu4c-bench-') as tmp:
        repo = Path(tmp)
        (repo / 'include').symlink_to(prefix / 'include', target_is_directory=True)
        (repo / 'lib').symlink_to(prefix / 'lib', target_is_directory=True)
        (repo / 'REPO.bazel').touch()
        extension = 'dylib' if platform.system() == 'Darwin' else 'so'
        (repo / 'BUILD.bazel').write_text(f'''load("@rules_cc//cc:cc_import.bzl", "cc_import")
cc_import(name="data", shared_library="lib/libicudata.{extension}")
cc_import(name="icu", shared_library="lib/libicuuc.{extension}", hdrs=glob(["include/unicode/*.h"]), includes=["include"], deps=[":data"], visibility=["//visibility:public"])
''')
        flags = ['-c', 'opt', f'--inject_repository=icu4c_benchmark_local={repo}']
        labels = {key: f'//benchmarks/locale-matching:{target}' for key,target in [
            ('rust','rust_bench'),('icu4c','icu4c_bench'),('icu4j','icu4j_bench'),('icu4x_fallback','icu4x_bench'),('cases','cases')]}
        print('Building release benchmarks...', flush=True)
        command(['bazel','build',*flags,*labels.values()])
        paths = {}
        for key,label in labels.items():
            files = command(['bazel','cquery',*flags,'--output=files',label]).stdout.splitlines()
            paths[key] = str(ROOT / next(f for f in files if not f.endswith('.jar')))
        records = []
        cold = {name: [] for name in ('rust','icu4c','icu4j','icu4x_fallback')}
        versions = {}
        for repetition in range(args.repetitions):
            names = ['rust','icu4c','icu4j','icu4x_fallback'] if repetition % 2 == 0 else ['icu4x_fallback','icu4j','icu4c','rust']
            for name in names:
                start = time.perf_counter_ns()
                first = command([paths[name], paths['cases'], '--once'])
                cold[name].append((time.perf_counter_ns()-start)/1e6)
                if first.stdout.strip() != 'en':
                    raise RuntimeError(f'{name}: wrong cold match: {first.stdout}')
                result = command([paths[name],paths['cases'],str(args.iterations)])
                versions[name] = result.stderr.strip()
                for line in result.stdout.splitlines():
                    runtime,mode,case,ns,matched = line.split('\t')
                    records.append(dict(runtime=runtime,mode=mode,case=case,ns=float(ns),matched=matched,repetition=repetition))
                print(f'{repetition+1}/{args.repetitions}: {name} complete', flush=True)
        groups = {}
        selections = {}
        fallback_selections = {}
        for row in records:
            key = (row['runtime'],row['mode'],row['case'])
            groups.setdefault(key,[]).append(row['ns'])
            if row['mode'] != 'construct':
                target = fallback_selections if row['runtime']=='icu4x_fallback' else selections
                target.setdefault(row['case'],set()).add(row['matched'])
        mismatches = {case: sorted(values) for case,values in selections.items() if len(values) != 1}
        if mismatches: raise RuntimeError(f'Matchers disagree: {mismatches}')
        if any(len(values)!=1 for values in fallback_selections.values()):
            raise RuntimeError('ICU4X prepared/string selections disagree')
        differences = {case: dict(distance=next(iter(selections[case])), icu4x_fallback=next(iter(values))) for case,values in fallback_selections.items() if values != selections[case]}
        report = dict(
            timestamp=datetime.datetime.now(datetime.timezone.utc).isoformat(),
            platform=platform.platform(), architecture=platform.machine(), icu4c_prefix=str(prefix),
            processor=command(['sysctl','-n','machdep.cpu.brand_string']).stdout.strip() if platform.system()=='Darwin' else platform.processor(),
            supported_counts={fields[1]: len(fields[2].split(',')) for fields in (line.split('\t') for line in Path(paths['cases']).read_text().splitlines()) if fields[0]=='support'},
            iterations=args.iterations, repetitions=args.repetitions, versions=versions,
            iterations_by_case={case: max(1000,args.iterations//20) if case=='full_unseen' else args.iterations for case in selections},
            methodology={
                'prepared': 'Rust DesiredLocale contains maximized LSRs; ICU4C/J receive reusable locale objects. Rust closest-match cache enabled.',
                'strings': 'Parse, canonicalize, and match on every iteration.',
                'full_unseen': 'Cycle 520 private-use languages; exceeds Rust cache capacity of 256.',
                'construct': 'Parse supported tags and construct matcher; 100 timed constructions after warmup.',
                'cold_process': 'Fresh process startup, read cases, construct full matcher, match en once.',
                'icu4x_fallback': 'LocaleFallbacker plus benchmark membership/default glue; parent fallback, not distance matching; selections may differ.',
                'jvm': '1000 construction warmups; per-case warmup equals measured iterations; 256 MiB heap, Serial GC.',
            },
            cold_process_ms={name: dict(median=statistics.median(values), samples=values) for name,values in cold.items()},
            results=[dict(runtime=key[0],mode=key[1],case=key[2],median_ns=statistics.median(values),samples_ns=values) for key,values in sorted(groups.items())],
            selections={case: next(iter(values)) for case,values in selections.items()},
            icu4x_fallback_selections={case: next(iter(values)) for case,values in fallback_selections.items()},
            icu4x_fallback_differences=differences,
        )
        Path(args.output).write_text(json.dumps(report,indent=2)+'\n')
        print(f'Distance matcher selections agree; ICU4X fallback differs in {len(differences)} cases. Results: {args.output}')

if __name__ == '__main__': main()
