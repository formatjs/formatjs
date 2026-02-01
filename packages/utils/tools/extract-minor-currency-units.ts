import {XMLParser} from 'fast-xml-parser'
import {outputFileSync} from 'fs-extra/esm'
import minimist from 'minimist'
import {readFileSync} from 'fs'

interface Args {
  input: string
  out: string
}

const parser = new XMLParser()

interface Data {
  ISO_4217: {
    CcyTbl: {
      CcyNtry: {
        CtryNm: string
        CcyNm: string
        Ccy: string
        CcyMnrUnts: string
      }[]
    }
  }
}

function main({input, out}: Args) {
  const data: Data = parser.parse(readFileSync(input, 'utf8'))

  const serializedData = data.ISO_4217.CcyTbl.CcyNtry.filter(
    k => !isNaN(Number(k.CcyMnrUnts))
  ).reduce<Record<string, number>>((all, k) => {
    all[k.Ccy] = +k.CcyMnrUnts
    return all
  }, {})
  outputFileSync(
    out,
    `
      // This is a generated file. Do not edit directly.
      export default ${JSON.stringify(serializedData, null, 2)} as const;`
  )
}

if (import.meta.filename === process.argv[1]) {
  main(minimist<Args>(process.argv))
}
