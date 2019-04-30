type Selector = string
type Format = null | SimpleFormat | PluralFormat | SelectFormat | SelectOrdinalFormat
interface LocationDetails {
    offset: number
    line: number
    column: number
}
interface Location {
    start: LocationDetails, 
    end: LocationDetails
}
interface SimpleFormat {
    type: 'numberFormat' | 'dateFormat' | 'timeFormat'
    style: string
    location: Location
}
interface PluralFormat {
    type: 'pluralFormat'
    ordinal: false
    offset: number
    options: OptionalFormatPattern[]
    location: Location 
}
interface SelectFormat {
    type: 'selectFormat'
    options: OptionalFormatPattern[],
    location: Location
}
interface SelectOrdinalFormat {
    type: 'selectordinalFormat',
    ordinal: true,
    offset: number,
    options: OptionalFormatPattern[]
    location: Location
}
interface OptionalFormatPattern {
    type: 'optionalFormatPattern',
    selector: Selector
    value: MessageFormatPattern
    location: Location
}
interface PluralStyle {
    type: 'pluralFormat',
    offset: number
    options: OptionalFormatPattern,
    location: Location
}
interface MessageTextElement {
    type: 'messageTextElement'
    value: string
    location: Location
}
interface ArgumentElement {
    type: 'argumentElement'
    id: string
    format: Format
    location: Location 
}
type ICUElement = MessageTextElement | ArgumentElement

interface MessageFormatPattern {
    type: 'messageFormatPattern',
    elements: Array<ICUElement>,
    location: Location
}
interface Parser {
    parse (msg: string): MessageFormatPattern
}
declare const parser: Parser
export default parser 