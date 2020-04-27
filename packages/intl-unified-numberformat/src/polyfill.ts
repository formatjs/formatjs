import {UnifiedNumberFormat, isUnitSupported} from './core';

if (!isUnitSupported('bit')) {
  Intl.NumberFormat = UnifiedNumberFormat as any;
}
