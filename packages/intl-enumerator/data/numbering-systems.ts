export type NumberingSystem = typeof numberingSystems[number];

export const numberingSystems = [
  "adlm", "ahom", "arab", "arabext", "armn", "armnlow", "bali", "beng",
  "bhks", "brah", "cakm", "cham", "cyrl", "deva", "diak", "ethi", "fullwide",
  "geor", "gong", "gonm", "grek", "greklow", "gujr", "guru", "hanidays",
  "hanidec", "hans", "hansfin", "hant", "hantfin", "hebr", "hmng", "hmnp",
  "java", "jpan", "jpanfin", "jpanyear", "kali", "khmr", "knda", "lana",
  "lanatham", "laoo", "latn", "lepc", "limb", "mathbold", "mathdbl",
  "mathmono", "mathsanb", "mathsans", "mlym", "modi", "mong", "mroo", "mtei",
  "mymr", "mymrshan", "mymrtlng", "newa", "nkoo", "olck", "orya", "osma",
  "rohg", "roman", "romanlow", "saur", "segment", "shrd", "sind", "sinh",
  "sora", "sund", "takr", "talu", "taml", "tamldec", "telu", "thai", "tibt",
  "tirh", "vaii", "wara", "wcho"
] as const;