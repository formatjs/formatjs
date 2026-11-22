# Exact-integer proof aid; not production execution or external calendar oracle.
from temporal_lunisolar_partition_proof import D, E, M, T, Y, approx, dayfromyear
import json
from collections import Counter
from pathlib import Path
import argparse, time

def serial(e):
    return ((e + 719178) * D - E) // M

def verify(c, lo, hi):
    counts = Counter()
    lengths = Counter()
    shifts = Counter()
    fail = []
    prev = None
    months = 0
    offsets = []
    for y in range(lo, hi + 1):
        a = approx(c, y)
        if prev is not None and prev['end'] != a['start']:
            fail.append({'kind': 'adjacency', 'previous': prev, 'current': a})
            break
        if len(a['lengths']) not in [12, 13] or any((x not in [29, 30] for x in a['lengths'])):
            fail.append({'kind': 'partition', 'year': a})
            break
        if not 0 <= a['leap'] <= 12 or (len(a['lengths']) == 13) != (a['leap'] != 0):
            fail.append({'kind': 'leap', 'year': a})
            break
        counts[len(a['lengths'])] += 1
        lengths[a['end'] - a['start']] += 1
        shifts[a['shift']] += 1
        offsets.append(a['start'] - dayfromyear(y))
        e = a['start']
        base = serial(e)
        for i, n in enumerate(a['lengths']):
            if serial(e) != base + i:
                fail.append({'kind': 'month_serial', 'year': a, 'month': i + 1, 'epoch': e})
                break
            e += n
            months += 1
        if serial(a['end']) != base + len(a['lengths']):
            fail.append({'kind': 'end_serial', 'year': a})
            break
        if fail:
            break
        prev = a
    return {'calendar': c, 'first_year': lo, 'last_year': hi, 'years_checked': sum(counts.values()), 'month_identities': months, 'month_counts': dict(counts), 'year_lengths': dict(lengths), 'new_year_bitmask_shifts': dict(shifts), 'new_year_day_offsets': [min(offsets), max(offsets)], 'failures': fail, 'first': approx(c, lo), 'last': prev}

def main():
    parser = argparse.ArgumentParser(description='Finite exact-integer proof aid for chosen host lunisolar chronology.')
    parser.add_argument('--output', type=Path, default=Path(__file__).with_name('finite-rerun.json'))
    args = parser.parse_args()
    start = time.time()
    results = [verify('chinese', -400001, 400001), verify('dangi', -400001, 400001)]
    args.output.write_text(json.dumps({'elapsed_seconds': time.time() - start, 'constants': {'day': D, 'month': M, 'year': Y, 'term': T}, 'results': results}, indent=2) + '\n')
    for r in results:
        print({k: v for k, v in r.items() if k not in ['first', 'last']})

if __name__ == '__main__':
    main()
