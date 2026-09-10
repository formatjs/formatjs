import collationData from 'cldr-bcp47/bcp47/collation.json' with {type: 'json'}

const canonicalTypes = new Map<string, string>()
const types: Record<string, string | {_description: string; _alias?: string}> =
  collationData.keyword.u.co
for (const type of Object.keys(types)) {
  const data = types[type]
  if (type.startsWith('_')) continue
  canonicalTypes.set(type, type)
  if (typeof data === 'object' && typeof data._alias === 'string') {
    for (const alias of data._alias.split(' ')) canonicalTypes.set(alias, type)
  }
}

// ECMA-402 §9.1 [[LocaleData]] uses canonical Unicode extension values.
// LDML collation names such as phonebook have BCP 47 aliases such as phonebk.
// This is a locale-data constraint, not an algorithm step.
// https://tc39.es/ecma402/#sec-internal-slots
// https://github.com/tc39/ecma402/blob/b1c961988b9a07894b1dc3dc2b5626ea48387d61/spec/negotiation.html#L26
export function canonicalCollation(type: string): string {
  return canonicalTypes.get(type) || type
}
