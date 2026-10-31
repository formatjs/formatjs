import type {
  CompiledNumberPatterns,
  NumberPatternPlan,
  RawNumberData,
} from '#packages/ecma402-abstract/types/number.js'

const values = <T>(data: Record<string, T>): T[] =>
  Object.keys(data).map(key => data[key])

const NUMBER = /[#0](?:[.,][#0]+)*/g
const TOKENS = /({c:[^}]+}|\{approximatelySign\}|\{0\}|[¤%\-+])/g
const cache = new WeakMap<RawNumberData, Map<string, NumberPatternPlan[]>>()
const prepared = new WeakMap<CompiledNumberPatterns, NumberPatternPlan[]>()

function approximate(pattern: string, sign: number): string {
  const index = sign === 0 ? -1 : pattern.indexOf(sign === 1 ? '+' : '-')
  return index < 0
    ? `{approximatelySign}${pattern}`
    : `${pattern.slice(0, index)}{approximatelySign}${pattern.slice(index)}`
}

function compile(pattern: string, compact: boolean): NumberPatternPlan[] {
  if (!pattern.includes(';')) pattern = `${pattern};-${pattern}`
  const [positive, negative] = pattern.split(';')
  const signed = [
    positive,
    negative,
    negative.includes('-') ? negative.replace(/-/g, '+') : `+${positive}`,
  ]
  const variants = [
    ...signed,
    ...signed.map((value, index) =>
      index === 0 && negative.includes('-') && !compact
        ? negative.replace('-', '{approximatelySign}')
        : approximate(value, index === 0 ? 0 : index === 1 ? -1 : 1)
    ),
  ]
  return variants.map((value, index) => {
    if (compact) {
      // Compact literals are identified before the approximate marker is added.
      const base = signed[index % 3]
        .replace(/([^\s;\-+\d¤]+)/g, '{c:$1}')
        .replace(/0+/, '0')
      value =
        index < 3
          ? base
          : approximate(base, index % 3 === 0 ? 0 : index % 3 === 1 ? -1 : 1)
    }
    NUMBER.lastIndex = 0
    const number = NUMBER.exec(value)?.[0]
    if (!number && !compact)
      throw new Error(`Missing number pattern: ${pattern}`)
    const groups = (number || '0').split('.')[0].split(',')
    const primary = groups.length > 1 ? groups[groups.length - 1].length : 3
    const secondary =
      groups.length > 2 ? groups[groups.length - 2].length : primary
    const parts: NumberPatternPlan['parts'] = []
    for (const token of value
      .replace(NUMBER, '{0}')
      .replace(/'(.)'/g, '$1')
      .split(TOKENS)) {
      if (!token) continue
      switch (token) {
        case '{0}':
          parts.push(['number', ''])
          break
        case '{approximatelySign}':
          parts.push(['approximatelySign', ''])
          break
        case '-':
          parts.push(['minusSign', ''])
          break
        case '+':
          parts.push(['plusSign', ''])
          break
        case '%':
          parts.push(['percentSign', ''])
          break
        case '¤':
          parts.push(['currency', ''])
          break
        default:
          parts.push(
            token.startsWith('{c:')
              ? ['compact', token.slice(3, -1)]
              : ['literal', token]
          )
      }
    }
    return {grouping: [primary, secondary], parts}
  })
}

/** Shared wire schema. Identical sign plans and numbering-system aliases share IDs. */
export function compileNumberPatterns(
  data: RawNumberData
): CompiledNumberPatterns {
  const result: CompiledNumberPatterns = {
    version: 1,
    standard: {},
    compact: {},
    plans: [],
    tokens: [],
  }
  const ids = new Map<string, number>()
  const tokens = new Map<string, number>()
  const add = (pattern: string, compact = false) => {
    const table = compact ? result.compact : result.standard
    if (Object.prototype.hasOwnProperty.call(table, pattern)) return
    table[pattern] = compile(pattern, compact).map(plan => {
      const key = JSON.stringify(plan)
      let id = ids.get(key)
      if (id === undefined) {
        id = result.plans.length
        ids.set(key, id)
        result.plans.push([
          ...plan.grouping,
          ...plan.parts.map(token => {
            const key = JSON.stringify(token)
            let id = tokens.get(key)
            if (id === undefined) {
              id = result.tokens.length
              tokens.set(key, id)
              result.tokens.push(token)
            }
            return id
          }),
        ])
      }
      return id
    })
  }
  const compact = (
    patterns: RawNumberData['decimal'][string]['short'] | undefined
  ) => {
    for (const rules of values(patterns || {}))
      for (const pattern of values(rules))
        if (pattern && pattern !== '0') add(pattern, true)
  }
  for (const value of values(data.decimal)) {
    add(value.standard)
    compact(value.short)
    compact(value.long)
  }
  for (const value of values(data.percent)) add(value)
  for (const value of values(data.currency)) {
    add(value.standard)
    add(value.accounting)
    compact(value.short)
  }
  return result
}

export function getNumberPattern(
  data: RawNumberData,
  pattern: string,
  compact: boolean,
  sign: number,
  approximately: boolean
): NumberPatternPlan {
  const index = (sign === 0 ? 0 : sign === -1 ? 1 : 2) + (approximately ? 3 : 0)
  const generated = data.patternPlans
  if (generated?.version === 1) {
    const ids = (compact ? generated.compact : generated.standard)[pattern]
    if (ids) {
      let plans = prepared.get(generated)
      if (!plans) {
        plans = []
        prepared.set(generated, plans)
      }
      const id = ids[index]
      if (!plans[id]) {
        const plan = generated.plans[id]
        plans[id] = {
          grouping: [plan[0], plan[1]],
          parts: plan.slice(2).map(id => generated.tokens[id]),
        }
      }
      return plans[id]
    }
  }
  let patterns = cache.get(data)
  if (!patterns) {
    patterns = new Map()
    cache.set(data, patterns)
  }
  const key = `${compact ? 'compact' : 'standard'}:${pattern}`
  let plans = patterns.get(key)
  if (!plans) {
    plans = compile(pattern, compact)
    patterns.set(key, plans)
  }
  return plans[index]
}
