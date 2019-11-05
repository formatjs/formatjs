export interface MessageDescriptor {
  id?: string;
  description?: string;
  defaultMessage?: string;
  file?: string;
  start?: number;
  end?: number;
}

export interface Messages {
  [key: string]: MessageDescriptor;
}
