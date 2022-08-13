// See: https://github.com/formatjs/formatjs/issues/3630
export type GetMetaType<State> = State extends {
  meta: infer Meta extends string
} 
  ? Meta 
  : never;
