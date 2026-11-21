// Internal allocation must not call a replacement installed by user code.
export const createObject: typeof Object.create = Object.create
