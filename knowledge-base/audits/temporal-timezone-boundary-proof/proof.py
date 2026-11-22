# Exact integer endpoint proof aid; not production execution.
import argparse, json, re, hashlib
from pathlib import Path
L = 8640000000000
WINDOW = 172800
MONTHS = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334]

def firstday(y):
    return 365 * (y - 1970) + (y - 1969) // 4 - (y - 1901) // 100 + (y - 1601) // 400

def rule(y, r):
    leap = y % 4 == 0 and (y % 100 != 0 or y % 400 == 0)
    if r['kind'] == 'month':
        m = r['month']
        first = firstday(y) + MONTHS[m - 1] + int(leap and m > 2)
        day = first + (r['weekday'] - (first + 4) % 7) % 7 + (r['week'] - 1) * 7
        nxt = firstday(y + 1) if m == 12 else firstday(y) + MONTHS[m] + int(leap and m >= 2)
        if day >= nxt:
            day -= 7
    else:
        day = firstday(y) + r['day']
        if r['kind'] == 'julian':
            day += -1 + int(leap and r['day'] >= 60)
    return day * 86400 + r['seconds']

def literal(path, marker):
    s = path.read_text()
    tail = s[s.index(marker) + len(marker):]
    value, end = json.JSONDecoder().raw_decode(tail.lstrip())
    return value

def main():
    a = argparse.ArgumentParser()
    a.add_argument('--packed', type=Path, required=True)
    a.add_argument('--compact', type=Path, required=True)
    a.add_argument('--native', type=Path, required=True)
    a.add_argument('--output', type=Path, required=True)
    args = a.parse_args()
    packed = literal(args.packed, '} = ')
    compact = literal(args.compact, ' = ')
    offsets = [int(x, 36) for x in packed['offsets'].split('|')]
    assert max(map(abs, offsets)) < 86400
    assert max(map(abs, compact['offsets'])) < 86400
    rows = []
    futures = {}
    explicit_min = None
    explicit_max = None
    fail = []
    for zone in packed['zones']:
        xs = zone.split('|')
        name = xs[0]
        parts = xs[1:]
        finite = [p for p in parts if not p.startswith(',')]
        first = int(finite[0].split(',')[0], 36) if finite else None
        last = int(finite[-1].split(',')[0], 36) if finite else None
        if first is not None:
            explicit_min = first if explicit_min is None else min(explicit_min, first)
            explicit_max = last if explicit_max is None else max(explicit_max, last)
            if first <= -L + WINDOW or last >= L - WINDOW:
                fail.append({'kind': 'explicit_boundary', 'zone': name})
        f = packed.get('future', {}).get(name)
        if f:
            if f.get('daylightOffset', f['standardOffset']) != f['standardOffset']:
                assert first is not None and last is not None
            futures.setdefault(json.dumps(f, sort_keys=True), []).append(name)
        rows.append({'zone': name, 'first_explicit': first, 'last_explicit': last, 'future': f})
    rules = []
    for key, names in futures.items():
        f = json.loads(key)
        sd = f['standardOffset']
        dd = f.get('daylightOffset')
        negative = []
        if dd is not None and dd != sd:
            assert abs(dd) < 86400 and abs(sd) < 86400
            for y in [-271822, -271821, -271820, 275759, 275760, 275761]:
                events = [('start', rule(y, f['start']) - sd, sd, dd), ('end', rule(y, f['end']) - dd, dd, sd)]
                for label, t, before, after in events:
                    if after < before:
                        distance = min(abs(t + L), abs(t - L))
                        negative.append({'year': y, 'event': label, 'epoch_seconds': t, 'before': before, 'after': after, 'nearest_boundary_distance_seconds': distance})
                        if y > 0 and distance <= WINDOW:
                            fail.append({'kind': 'future_negative_boundary', 'zones': names, 'rule': f, 'event': negative[-1]})
        rules.append({'future': f, 'zones': names, 'negative_events': negative})
    compact_rows = []
    for name, (initial, fi, fixed, spans) in compact['zones'].items():
        events = list(fixed[::2])
        for i in range(0, len(spans), 4):
            lo, hi, rid, oid = spans[i:i + 4]
            events.extend([rule(lo, compact['rules'][rid]), rule(hi, compact['rules'][rid])])
        first = min(events) if events else None
        last = max(events) if events else None
        if first is not None and (first <= -L + WINDOW or last >= L - WINDOW):
            fail.append({'kind': 'compact_explicit_boundary', 'zone': name})
        future = compact['futures'][fi] if fi >= 0 else None
        original = next((r for r in rows if r['zone'] == name))
        assert future == original['future']
        compact_rows.append({'zone': name, 'first_offset_event': first, 'last_offset_event': last})
    ns = args.native.read_text()
    native = []
    for line in ns.splitlines():
        m = re.fullmatch('TimeZoneRecord \\{ identifier: "([^"]+)", provider: checked_zone\\((-?\\d+), &\\[(.*)\\], (.*)\\) \\},', line)
        if not m:
            continue
        name, initial, transitions, future = m.groups()
        original = next((r for r in rows if r['zone'] == name))
        events = re.findall('OffsetTransition \\{ epoch_seconds: (-?\\d+), offset_seconds: (-?\\d+) \\}', transitions)
        first = int(events[0][0]) if events else None
        last = int(events[-1][0]) if events else None
        assert (first, last) == (original['first_explicit'], original['last_explicit'])
        native.append({'zone': name, 'first_explicit': first, 'last_explicit': last})
    assert native

    def emit_rule(r):
        if r['kind'] == 'month':
            return 'TransitionRule::Month { month: %d, week: %d, weekday: %d, seconds: %d }' % (r['month'], r['week'], r['weekday'], r['seconds'])
        return 'TransitionRule::%s { day: %d, seconds: %d }' % ('Day' if r['kind'] == 'day' else 'Julian', r['day'], r['seconds'])

    def emit_future(f):
        if f is None:
            return 'None'
        dst = 'None' if 'daylightOffset' not in f else 'Some((%d, %s, %s))' % (f['daylightOffset'], emit_rule(f['start']), emit_rule(f['end']))
        return 'Some(checked_future(%d, %s))' % (f['standardOffset'], dst)
    for line in ns.splitlines():
        m = re.fullmatch('TimeZoneRecord \\{ identifier: "([^"]+)", provider: checked_zone\\((-?\\d+), &\\[(.*)\\], (.*)\\) \\},', line)
        if m:
            assert m[4] == emit_future(next((r for r in rows if r['zone'] == m[1]))['future'])
    nearest = min((e for r in rules for e in r['negative_events'] if e['year'] > 0), key=lambda e: e['nearest_boundary_distance_seconds'])
    out = {'source_hashes': {str(p): hashlib.sha256(p.read_bytes()).hexdigest() for p in [args.packed, args.compact, args.native]}, 'limit_seconds': L, 'window_seconds': WINDOW, 'offset_extrema_seconds': [min(offsets), max(offsets)], 'packed_zones': len(rows), 'compact_zones': len(compact_rows), 'native_zones': len(native), 'explicit_epoch_extrema_seconds': [explicit_min, explicit_max], 'unique_future_rules': len(rules), 'nearest_upper_boundary_negative_transition': nearest, 'failures': fail, 'packed_endpoint_rows': rows, 'compact_endpoint_rows': compact_rows, 'native_endpoint_rows': native, 'deduplicated_future_analysis': rules}
    args.output.write_text(json.dumps(out, indent=2) + '\n')
    print({k: v for k, v in out.items() if k not in ['packed_endpoint_rows', 'compact_endpoint_rows', 'native_endpoint_rows', 'deduplicated_future_analysis', 'source_hashes']})
if __name__ == '__main__':
    main()
