export interface PackedData {
  zones: string[];
  abbrvs: string;
  offsets: string;
}

export interface UnpackedData {
  zones: Record<string, ZoneData[]>;
  abbrvs: string[];
  /**
   * Offset in seconds, base 36
   */
  offsets: number[];
}

export type ZoneData = [
  // Seconds from UTC Time, empty string if NULL
  number | string,
  // Index of abbreviation in abbrvs like EST/EDT
  number,
  // Index of offsets in seconds
  number,
  // Whether it's daylight, 0|1
  number
];

export type UnpackedZoneData = [
  // Seconds from UTC Time, -Infinity if NULL
  number,
  // abbrvs like EST/EDT
  string,
  // offsets in seconds
  number,
  // Whether it's daylight, 0|1
  boolean
];
