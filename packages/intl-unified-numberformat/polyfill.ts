import {UnifiedNumberFormat, isUnitSupported} from './src/core';

if (!isUnitSupported('bit')) {
  Intl.NumberFormat = UnifiedNumberFormat as any;
}
