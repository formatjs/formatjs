import UnifiedNumberFormat, {isUnitSupported} from './core';
import en from './en';

UnifiedNumberFormat.__addUnitLocaleData(en);

if (!isUnitSupported('bit')) {
  Intl.NumberFormat = UnifiedNumberFormat as any;
}
