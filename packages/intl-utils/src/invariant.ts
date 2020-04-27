export function invariant(
  condition: boolean,
  message: string,
  Err: any = Error
) {
  if (!condition) {
    throw new Err(message);
  }
}
