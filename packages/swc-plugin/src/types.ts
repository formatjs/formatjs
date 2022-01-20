export interface MessageDescriptor {
  id: string
  description?: string | object
  defaultMessage?: string
  file?: string
  start?: number
  end?: number
}

export interface Messages {
  [key: string]: MessageDescriptor
}
