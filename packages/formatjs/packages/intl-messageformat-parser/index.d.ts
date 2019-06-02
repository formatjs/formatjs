export type Selector = string
export interface LocationDetails {
    offset: number
    line: number
    column: number
}
export interface Location {
    start: LocationDetails, 
    end: LocationDetails
}
export interface SimpleFormat {
    type: 'numberFormat' | 'dateFormat' | 'timeFormat'
    style: string
    location: Location
}
export interface PluralFormat extends PluralStyle {
    ordinal: false
}
export interface SelectFormat {
    type: 'selectFormat'
    options: OptionalFormatPattern[],
    location: Location
}
export interface SelectOrdinalFormat extends PluralStyle {
    ordinal: true,
}
export type ElementFormat = SimpleFormat | PluralFormat | SelectOrdinalFormat | SelectFormat
export interface OptionalFormatPattern {
    type: 'optionalFormatPattern',
    selector: Selector
    value: MessageFormatPattern
    location: Location
}
export interface PluralStyle {
    type: 'pluralFormat',
    offset: number
    options: OptionalFormatPattern[],
    location: Location
}
export interface MessageTextElement {
    type: 'messageTextElement'
    value: string
    location: Location
}
export interface ArgumentElement {
    type: 'argumentElement'
    id: string
    format: ElementFormat
    location: Location 
}
export type Element = MessageTextElement | ArgumentElement

export interface MessageFormatPattern {
    type: 'messageFormatPattern',
    elements: Array<Element>,
    location: Location
}
interface Parser {
    parse (msg: string): MessageFormatPattern
    SyntaxError: Error
}
declare const parser: Parser
export default parser 