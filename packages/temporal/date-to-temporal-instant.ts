import {createInstant, type InstantObject} from '#packages/temporal/instant.js'

import {createDateToTemporalInstant} from '#packages/temporal/date-bridge.js'

export const toTemporalInstant: (this: unknown) => InstantObject =
  createDateToTemporalInstant(createInstant)
