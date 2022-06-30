export type Region = typeof regions[number];

export const regions = [
  'AC~G', 'AI', 'AL~M', 'AO', 'AQ~U', 'AW~X', 'AZ', 'BA~B', 'BD~J', 'BL~O',
  'BQ~T', 'BV~W', 'BY~Z', 'CA', 'CC~D', 'CF~I', 'CK~P', 'CR', 'CU~Z', 'DE',
  'DG', 'DJ~K', 'DM', 'DO', 'DZ', 'EA', 'EC', 'EE', 'EG~H', 'ER~T', 'FI~K',
  'FM', 'FO', 'FR', 'GA~B', 'GD~I', 'GL~N', 'GP~U', 'GW', 'GY', 'HK', 'HM~N',
  'HR', 'HT~U', 'IC~E', 'IL~O', 'IQ~T', 'JE', 'JM', 'JO~P', 'KE', 'KG~I',
  'KM~N', 'KP', 'KR', 'KW', 'KY~Z', 'LA~C', 'LI', 'LK', 'LR~V', 'LY', 'MA',
  'MC~H', 'MK~Z', 'NA', 'NC', 'NE~G', 'NI', 'NL', 'NO~P', 'NR', 'NU', 'NZ',
  'OM', 'PA', 'PE~H', 'PK~N', 'PR~T', 'PW', 'PY', 'QA', 'RE', 'RO', 'RS', 'RU',
  'RW', 'SA~E', 'SG~O', 'SR~T', 'SV', 'SX~Z', 'TA', 'TC~D', 'TF~H', 'TJ~O',
  'TR', 'TT', 'TV~W', 'TZ', 'UA', 'UG', 'UM', 'US', 'UY~Z', 'VA', 'VC', 'VE',
  'VG', 'VI', 'VN', 'VU', 'WF', 'WS', 'XK', 'YE', 'YT', 'ZA', 'ZM', 'ZW',
  'XA~B', '001~3', '005', '009', '011', '013~5', '017~9', '021', '029', '030',
  '034~5', '039', '053~4', '057', '061', '142~3', '145', '150~1', '154~5',
  '202', '419', 'EU', 'EZ', 'QO', 'UN', 'AN', 'BU', 'CS', 'DD', 'FX', 'NT',
  'QU', 'SU', 'TP', 'YD', 'YU', 'ZR', 'AA', 'QM~N', 'QP~T', 'QV~Z', 'XC~J',
  'XL~Z', 'ZZ'
] as const;