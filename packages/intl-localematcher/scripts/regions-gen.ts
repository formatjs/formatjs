import rawData from 'cldr-core/supplemental/territoryContainment.json' with {type: 'json'}
import {outputFileSync} from 'fs-extra/esm'
import stringify from 'json-stable-stringify'
import minimist from 'minimist'

interface Args extends minimist.ParsedArgs {
  out: string
}

function flattenRegion(
  region: string,
  regionMap: Record<string, string[]>
): string[] {
  if (!regionMap[region]) {
    return [region]
  }
  return [
    region,
    ...regionMap[region].flatMap(r => flattenRegion(r, regionMap)),
  ]
}

function main({out}: Args) {
  const regionMap = Object.keys(
    rawData.supplemental.territoryContainment
  ).reduce<Record<string, string[]>>((all, region) => {
    const regionData =
      rawData.supplemental.territoryContainment[region as '001']
    all[region] = Object.entries(regionData)[0][1]
    return all
  }, {})

  const processedData: Record<string, Set<string>> = {}
  for (const [region] of Object.entries(regionMap)) {
    if (region.endsWith('deprecated')) {
      continue
    }
    processedData[region] = new Set(flattenRegion(region, regionMap))
  }

  Object.keys(processedData).forEach(regionKey => {
    if (regionKey.includes('status-grouping')) {
      const region = regionKey.replace('-status-grouping', '')
      if (processedData[region]) {
        processedData[regionKey].forEach(r => processedData[region].add(r))
        delete processedData[regionKey]
      } else {
        processedData[region] = processedData[regionKey]
      }
    }
  })

  const data = Object.entries(processedData).reduce<Record<string, string[]>>(
    (all, [k, v]) => {
      all[k] = Array.from(v).sort()
      return all
    },
    {}
  )

  outputFileSync(
    out,
    `// This file is generated from regions-gen.ts
export const regions: Record<string, string[]> = ${stringify(data, {
      space: 2,
    })}`
  )
}
if (import.meta.filename === process.argv[1]) {
  main(minimist<Args>(process.argv))
}
