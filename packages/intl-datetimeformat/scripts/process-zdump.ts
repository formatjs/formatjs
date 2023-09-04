import minimist from 'minimist'
import {execFile as _execFile} from 'child_process'
import {readFile as _readFile} from 'fs'
import {promisify} from 'util'
import {outputFileSync} from 'fs-extra'
import {UnpackedData, ZoneData} from '../src/types'
import {pack} from '../src/packer'
import stringify from 'json-stable-stringify'

const readFile = promisify(_readFile)
const SPACE_REGEX = /[\s\t]+/

const MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
]

function pad(n: number) {
  if (n < 10) {
    return `0${n}`
  }
  return n
}

const GOLDEN_TIMEZONES = new Set([
  'Africa/Abidjan',
  'Africa/Accra',
  'Africa/Algiers',
  'Africa/Bissau',
  'Africa/Cairo',
  'Africa/Casablanca',
  'Africa/Ceuta',
  'Africa/El_Aaiun',
  'Africa/Johannesburg',
  'Africa/Khartoum',
  'Africa/Lagos',
  'Africa/Maputo',
  'Africa/Monrovia',
  'Africa/Nairobi',
  'Africa/Ndjamena',
  'Africa/Tripoli',
  'Africa/Tunis',
  'Africa/Windhoek',
  'America/Anchorage',
  'America/Araguaina',
  'America/Asuncion',
  'America/Bahia_Banderas',
  'America/Bahia',
  'America/Barbados',
  'America/Belem',
  'America/Belize',
  'America/Bogota',
  'America/Boise',
  'America/Campo_Grande',
  'America/Cancun',
  'America/Caracas',
  'America/Cayenne',
  'America/Cayman',
  'America/Chicago',
  'America/Chihuahua',
  'America/Costa_Rica',
  'America/Cuiaba',
  'America/Curacao',
  'America/Dawson_Creek',
  'America/Denver',
  'America/Detroit',
  'America/Edmonton',
  'America/Eirunepe',
  'America/El_Salvador',
  'America/Fortaleza',
  'America/Glace_Bay',
  'America/Godthab',
  'America/Guatemala',
  'America/Guayaquil',
  'America/Guyana',
  'America/Halifax',
  'America/Havana',
  'America/Hermosillo',
  'America/Jamaica',
  'America/Juneau',
  'America/La_Paz',
  'America/Lima',
  'America/Los_Angeles',
  'America/Maceio',
  'America/Managua',
  'America/Manaus',
  'America/Martinique',
  'America/Matamoros',
  'America/Mazatlan',
  'America/Merida',
  'America/Mexico_City',
  'America/Moncton',
  'America/Monterrey',
  'America/Montevideo',
  'America/Nassau',
  'America/New_York',
  'America/Ojinaga',
  'America/Panama',
  'America/Paramaribo',
  'America/Phoenix',
  'America/Port_of_Spain',
  'America/Port-au-Prince',
  'America/Porto_Velho',
  'America/Puerto_Rico',
  'America/Recife',
  'America/Regina',
  'America/Rio_Branco',
  'America/Santa_Isabel',
  'America/Santarem',
  'America/Santiago',
  'America/Santo_Domingo',
  'America/Sao_Paulo',
  'America/St_Johns',
  'America/Swift_Current',
  'America/Tegucigalpa',
  'America/Thunder_Bay',
  'America/Tijuana',
  'America/Toronto',
  'America/Vancouver',
  'America/Whitehorse',
  'America/Winnipeg',
  'America/Yellowknife',
  'Asia/Almaty',
  'Asia/Amman',
  'Asia/Anadyr',
  'Asia/Aqtau',
  'Asia/Aqtobe',
  'Asia/Ashgabat',
  'Asia/Baghdad',
  'Asia/Baku',
  'Asia/Bangkok',
  'Asia/Beirut',
  'Asia/Bishkek',
  'Asia/Brunei',
  'Asia/Chita',
  'Asia/Choibalsan',
  'Asia/Colombo',
  'Asia/Damascus',
  'Asia/Dhaka',
  'Asia/Dili',
  'Asia/Dubai',
  'Asia/Dushanbe',
  'Asia/Gaza',
  'Asia/Hebron',
  'Asia/Ho_Chi_Minh',
  'Asia/Hong_Kong',
  'Asia/Hovd',
  'Asia/Irkutsk',
  'Asia/Jakarta',
  'Asia/Jayapura',
  'Asia/Jerusalem',
  'Asia/Kabul',
  'Asia/Kamchatka',
  'Asia/Karachi',
  'Asia/Kathmandu',
  'Asia/Kolkata',
  'Asia/Krasnoyarsk',
  'Asia/Kuala_Lumpur',
  'Asia/Kuching',
  'Asia/Macau',
  'Asia/Magadan',
  'Asia/Makassar',
  'Asia/Manila',
  'Asia/Nicosia',
  'Asia/Novokuznetsk',
  'Asia/Novosibirsk',
  'Asia/Omsk',
  'Asia/Oral',
  'Asia/Pontianak',
  'Asia/Pyongyang',
  'Asia/Qatar',
  'Asia/Qyzylorda',
  'Asia/Rangoon',
  'Asia/Riyadh',
  'Asia/Sakhalin',
  'Asia/Samarkand',
  'Asia/Seoul',
  'Asia/Shanghai',
  'Asia/Singapore',
  'Asia/Taipei',
  'Asia/Tashkent',
  'Asia/Tbilisi',
  'Asia/Tehran',
  'Asia/Thimphu',
  'Asia/Tokyo',
  'Asia/Tomsk',
  'Asia/Ulaanbaatar',
  'Asia/Urumqi',
  'Asia/Vladivostok',
  'Asia/Yakutsk',
  'Asia/Yekaterinburg',
  'Asia/Yerevan',
  'Atlantic/Azores',
  'Atlantic/Bermuda',
  'Atlantic/Canary',
  'Atlantic/Cape_Verde',
  'Atlantic/Faroe',
  'Atlantic/Madeira',
  'Atlantic/Reykjavik',
  'Australia/Adelaide',
  'Australia/Brisbane',
  'Australia/Broken_Hill',
  'Australia/Darwin',
  'Australia/Hobart',
  'Australia/Melbourne',
  'Australia/Perth',
  'Australia/Sydney',
  'Europe/Amsterdam',
  'Europe/Andorra',
  'Europe/Athens',
  'Europe/Belgrade',
  'Europe/Berlin',
  'Europe/Brussels',
  'Europe/Bucharest',
  'Europe/Budapest',
  'Europe/Chisinau',
  'Europe/Copenhagen',
  'Europe/Dublin',
  'Europe/Gibraltar',
  'Europe/Helsinki',
  'Europe/Istanbul',
  'Europe/Kaliningrad',
  'Europe/Kiev',
  'Europe/Kirov',
  'Europe/Lisbon',
  'Europe/London',
  'Europe/Luxembourg',
  'Europe/Madrid',
  'Europe/Malta',
  'Europe/Minsk',
  'Europe/Monaco',
  'Europe/Moscow',
  'Europe/Oslo',
  'Europe/Paris',
  'Europe/Prague',
  'Europe/Riga',
  'Europe/Rome',
  'Europe/Samara',
  'Europe/Simferopol',
  'Europe/Sofia',
  'Europe/Stockholm',
  'Europe/Tallinn',
  'Europe/Tirane',
  'Europe/Uzhgorod',
  'Europe/Vienna',
  'Europe/Vilnius',
  'Europe/Volgograd',
  'Europe/Warsaw',
  'Europe/Zaporozhye',
  'Europe/Zurich',
  'Indian/Mahe',
  'Indian/Maldives',
  'Indian/Mauritius',
  'Indian/Reunion',
  'Pacific/Apia',
  'Pacific/Auckland',
  'Pacific/Bougainville',
  'Pacific/Chuuk',
  'Pacific/Efate',
  'Pacific/Fiji',
  'Pacific/Galapagos',
  'Pacific/Guadalcanal',
  'Pacific/Guam',
  'Pacific/Honolulu',
  'Pacific/Kwajalein',
  'Pacific/Majuro',
  'Pacific/Norfolk',
  'Pacific/Noumea',
  'Pacific/Palau',
  'Pacific/Pohnpei',
  'Pacific/Port_Moresby',
  'Pacific/Rarotonga',
  'Pacific/Tahiti',
  'Pacific/Tarawa',
  'Pacific/Tongatapu',
  'Pacific/Wake',
])

function utTimeToSeconds(utTime: string) {
  const [, month, date, hourMinSec, year] = utTime.split(SPACE_REGEX)
  const [hour, min, sec] = hourMinSec.split(':')
  return (
    new Date(
      `${year}-${pad(MONTHS.indexOf(month) + 1)}-${pad(
        +date
      )}T${hour}:${min}:${sec}Z`
    ).getTime() / 1e3
  )
}

const LINE_REGEX = /^(.*?)\s+(.*?) UTC? = (.*?) isdst=(0|1) gmtoff=(.*?)$/i

function processZone(
  content: string,
  {zones, abbrvs, offsets}: UnpackedData,
  golden?: string
) {
  const lines = content.split('\n')
  for (const line of lines) {
    if (line.endsWith('NULL')) {
      continue
    }
    const chunks = LINE_REGEX.exec(line)
    if (!chunks) {
      continue
    }

    const [, zonePath, utTime, localTime, dst, offsetStr] = chunks
    const zone = zonePath.split('zic/')[1]
    if (golden && !GOLDEN_TIMEZONES.has(zone)) {
      continue
    }
    const abbrv = localTime.split(SPACE_REGEX).pop()!
    let abbrvIndex = abbrvs.indexOf(abbrv)
    if (abbrvIndex < 0) {
      abbrvIndex = abbrvs.length
      abbrvs.push(abbrv)
    }
    const offset = +offsetStr
    let offsetIndex = offsets.indexOf(offset)
    if (offsetIndex < 0) {
      ;(offsetIndex = offsets.length), offsets.push(offset)
    }
    if (!zones[zone]) {
      zones[zone] = [['', abbrvIndex, offsetIndex, +dst]]
    } else {
      zones[zone].push([utTimeToSeconds(utTime), abbrvIndex, offsetIndex, +dst])
    }
  }
}

const SPECIAL_CASES = [
  'Etc/GMT-14',
  'Etc/GMT-13',
  'Etc/GMT-12',
  'Etc/GMT-11',
  'Etc/GMT-10',
  'Etc/GMT-9',
  'Etc/GMT-8',
  'Etc/GMT-7',
  'Etc/GMT-6',
  'Etc/GMT-5',
  'Etc/GMT-4',
  'Etc/GMT-3',
  'Etc/GMT-2',
  'Etc/GMT-1',
  'Etc/GMT+1',
  'Etc/GMT+2',
  'Etc/GMT+3',
  'Etc/GMT+4',
  'Etc/GMT+5',
  'Etc/GMT+6',
  'Etc/GMT+7',
  'Etc/GMT+8',
  'Etc/GMT+9',
  'Etc/GMT+10',
  'Etc/GMT+11',
  'Etc/GMT+12',
].map(tz => {
  const offsetInHours = tz.split(/([-+]\d{1,2})/)[1]
  const offsetInHoursNum = +offsetInHours
  const abbrv =
    offsetInHoursNum > 0
      ? `GMT-${offsetInHoursNum}`
      : `GMT+${-offsetInHoursNum}`

  return `zic/${tz}  Mon Jan 1 00:00:00 0000 UTC = doesnotmatter ${abbrv} isdst=0 gmtoff=${
    -offsetInHoursNum * 3600
  }`
})

async function main(args: minimist.ParsedArgs) {
  const {_: files, polyfill, out, golden} = args
  const inputs = files.slice(2)
  inputs.sort() // sort so result is stable

  const zones: Record<string, ZoneData[]> = {}
  const abbrvs: string[] = []
  const offsets: number[] = []
  const data: UnpackedData = {
    zones,
    abbrvs,
    offsets,
  }

  const contents = await Promise.all(
    inputs.map((input: string) => readFile(input, 'utf8'))
  )

  processZone([contents, ...SPECIAL_CASES].join('\n'), data, golden)

  if (polyfill) {
    outputFileSync(
      out,
      `// @generated
// prettier-ignore
if ('DateTimeFormat' in Intl && Intl.DateTimeFormat.__addTZData) {
  Intl.DateTimeFormat.__addTZData(${stringify(pack(data), {space: 2})}) 
}`
    )
  } else {
    outputFileSync(
      out,
      `// @generated
// prettier-ignore
export default ${stringify(pack(data), {
        space: 2,
      })}`
    )
  }
}

if (require.main === module) {
  main(minimist(process.argv))
}
