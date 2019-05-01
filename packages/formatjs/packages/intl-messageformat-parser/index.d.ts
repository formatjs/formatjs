type Selector = string
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
interface PluralFormat extends PluralStyle {
    ordinal: false
}
interface SelectFormat {
    type: 'selectFormat'
    options: OptionalFormatPattern[],
    location: Location
}
interface SelectOrdinalFormat extends PluralStyle {
    ordinal: true,
}
type ElementFormat = SimpleFormat | PluralFormat | SelectOrdinalFormat | SelectFormat
interface OptionalFormatPattern {
    type: 'optionalFormatPattern',
    selector: Selector
    value: MessageFormatPattern
    location: Location
}
interface PluralStyle {
    type: 'pluralFormat',
    offset: number
    options: OptionalFormatPattern[],
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
    format: ElementFormat
    location: Location 
}
type Element = MessageTextElement | ArgumentElement

export interface MessageFormatPattern {
    type: 'messageFormatPattern',
    elements: Array<Element>,
    location: Location
}
interface Parser {
    parse (msg: string): MessageFormatPattern
}
declare const parser: Parser
export default parser 