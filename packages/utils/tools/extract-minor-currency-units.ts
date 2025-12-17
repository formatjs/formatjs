import {XMLParser} from 'fast-xml-parser'
import {outputJsonSync} from 'fs-extra/esm'
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

  outputJsonSync(
    out,
    data.ISO_4217.CcyTbl.CcyNtry.filter(
      k => !isNaN(Number(k.CcyMnrUnts))
    ).reduce<Record<string, number>>((all, k) => {
      all[k.Ccy] = +k.CcyMnrUnts
      return all
    }, {})
  )
}

if (require.main === module) {
  main(minimist<Args>(process.argv))
}
