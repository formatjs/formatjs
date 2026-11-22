# Exact-integer proof aid; not production execution or external calendar oracle.
D = 86400000
M = D * 295305888531 // 10000000000
Y = D * 146097 // 400
T = Y // 12
E = 730125 * D + 65640000

def dayfromyear(y):
    return 365 * (y - 1970) + (y - 1969) // 4 - (y - 1901) // 100 + (y - 1601) // 400

def before(date, base, period):
    return base + (date * D - base + D - 1) // period * period

def approx(calendar, y):
    offset = 27940000 if y < 1900 else 28800000 if calendar == 'chinese' else 32400000
    solar = before(dayfromyear(y) + 719162, 730110 * D + 27840000 + offset, Y)
    moon = before(solar // D, 730125 * D + 65640000 + offset, M)
    nextmoon = moon + M
    solarTerm = -2
    hadLeap = False
    while solarTerm < 0 or (nextmoon // D <= solar // D and (not hadLeap)):
        if nextmoon // D <= solar // D and (not hadLeap):
            hadLeap = True
        else:
            solarTerm += 1
            solar += T
        moon = nextmoon
        nextmoon += M
    newyear = moon // D
    lengths = {}
    leap = 0
    while solarTerm < 12 or (nextmoon // D <= solar // D and (not hadLeap)):
        index = solarTerm + int(leap != 0)
        if index < 13:
            lengths[index] = nextmoon // D - moon // D
        if nextmoon // D <= solar // D and (not hadLeap):
            hadLeap = True
            leap = solarTerm
        else:
            solarTerm += 1
            solar += T
        moon = nextmoon
        nextmoon += M
    earliest = dayfromyear(y) + 18
    start = earliest + (newyear - (earliest + 719163) & 63)
    count = 13 if leap else 12
    return {'year': y, 'start': start, 'end': start + sum((lengths[i] for i in range(count))), 'leap': leap, 'lengths': [lengths.get(i) for i in range(count)], 'unmodded_start': newyear - 719163, 'shift': start - (newyear - 719163)}
