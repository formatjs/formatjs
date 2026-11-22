# Exact-integer proof aid; not production execution or external calendar oracle.
from temporal_lunisolar_partition_proof import D, E, M, T, Y, approx, dayfromyear
import json
from pathlib import Path
import argparse, re, hashlib

def serial(e):
    return ((e + 719178) * D - E) // M

def main():
    parser = argparse.ArgumentParser(description='Validate explicit generated host calendar files and compact/approximation joins.')
    parser.add_argument('--chinese', type=Path, action='append', required=True, help='Generated host-chinese.ts; repeat to compare configured copies.')
    parser.add_argument('--dangi', type=Path, action='append', required=True, help='Generated host-dangi.ts; repeat to compare configured copies.')
    parser.add_argument('--output', type=Path, default=Path(__file__).with_name('compact-join-rerun.json'))
    args = parser.parse_args()
    results = []
    for c in ['chinese', 'dangi']:
        paths = args.chinese if c == 'chinese' else args.dangi
        hashes = {str(p): hashlib.sha256(p.read_bytes()).hexdigest() for p in paths}
        assert len(set(hashes.values())) == 1, hashes
        p = paths[0]
        s = p.read_text()
        matches = list(re.finditer('\\{firstYear: (-?\\d+), startDay: (-?\\d+), years: (\\[[\\d,\\s]+\\])\\}', s))
        assert len(matches) == 1
        m = matches[0]
        first = int(m[1])
        start = int(m[2])
        ys = json.loads(m[3])
        cursor = start
        failures = []
        monthtotal = 0
        offsets = []
        firstserial = serial(start)
        for i, packed in enumerate(ys):
            offsets.append(cursor - dayfromyear(first + i))
            leap = packed >> 13
            count = 13 if leap else 12
            assert 0 <= leap <= 12
            assert (packed & 8191) >> count == 0
            for j in range(count):
                if serial(cursor) != firstserial + monthtotal:
                    failures.append({'kind': 'serial', 'year': first + i, 'month': j + 1, 'cursor': cursor})
                cursor += 29 + (packed >> j & 1)
                monthtotal += 1
        before = approx(c, first - 1)
        after = approx(c, first + len(ys))
        if before['end'] != start:
            failures.append({'kind': 'lower_join', 'approx_end': before['end'], 'compact_start': start})
        if cursor != after['start']:
            failures.append({'kind': 'upper_join', 'compact_end': cursor, 'approx_start': after['start']})
        if serial(cursor) != firstserial + monthtotal:
            failures.append({'kind': 'end_serial'})
        results.append({'calendar': c, 'source_hashes': hashes, 'first_year': first, 'last_year': first + len(ys) - 1, 'compact_start': start, 'compact_end': cursor, 'month_identities': monthtotal, 'new_year_day_offsets': [min(offsets), max(offsets)], 'lower_approximation_year': before, 'upper_approximation_year': after, 'failures': failures})
    args.output.write_text(json.dumps(results, indent=2) + '\n')
    for r in results:
        print({k: v for k, v in r.items() if k not in ['source_hashes', 'lower_approximation_year', 'upper_approximation_year']})

if __name__ == '__main__':
    main()
