import {NodePath} from '@babel/core';
import {SourceLocation, StringLiteral} from '@babel/types';

export interface MessageDescriptor {
  id: string;
  defaultMessage?: string;
  description?: string;
}

export interface State {
  ReactIntlMessages: Map<string, ExtractedMessageDescriptor>;
  ReactIntlMeta: Record<string, string>;
}

export type ExtractedMessageDescriptor = MessageDescriptor &
  Partial<SourceLocation> & {file?: string};

export type MessageDescriptorPath = Record<
  keyof MessageDescriptor,
  NodePath<StringLiteral> | undefined
>;
