export interface MessageDescriptor {
  id: string
  description?: string | object
  defaultMessage?: string
  file?: string
  start?: number
  end?: number
}

export interface MessageDescriptorValueLocation {
  /** Inclusive source offset for the literal token. */
  start: number
  /** Exclusive source offset for the literal token. */
  end: number
  /** The source syntax used by the writable literal. */
  kind: 'string' | 'template' | 'jsxAttribute'
  /** The literal's parsed value before message normalization. */
  value: string
}

export interface MessageDescriptorOccurrence {
  descriptor: MessageDescriptor
  /**
   * Writable literal locations. Locations are omitted for concatenations,
   * tagged templates, and descriptors containing spreads. Descriptors that
   * cannot be statically extracted are not reported.
   */
  locations: {
    id?: MessageDescriptorValueLocation
    defaultMessage?: MessageDescriptorValueLocation
  }
}

export interface Messages {
  [key: string]: MessageDescriptor
}
