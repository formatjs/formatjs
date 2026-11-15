import com.ibm.icu.util.Calendar;
import com.ibm.icu.util.GregorianCalendar;
import com.ibm.icu.util.TimeZone;
import java.io.PrintWriter;
import java.nio.charset.StandardCharsets;
import java.math.BigInteger;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Date;

public final class TemporalZonedDifferenceOracle {
  private static final String[] UNITS = {"year", "month", "week", "day", "hour", "minute", "second", "millisecond", "microsecond", "nanosecond"};
  private static final String[] MODES = {"ceil", "floor", "expand", "trunc", "halfCeil", "halfFloor", "halfExpand", "halfTrunc", "halfEven"};
  private static final long[] CLOCK = {3600000000000L, 60000000000L, 1000000000L, 1000000L, 1000L, 1L};

  public static void main(String[] args) throws Exception {
    try (PrintWriter out = new PrintWriter(args[0], StandardCharsets.UTF_8)) {
      out.println("# ICU4J Gregorian zoned calendar spans and BigDecimal signed rounding");
      for (String zone : new String[] {"UTC", "America/New_York", "Australia/Lord_Howe", "Pacific/Apia", "Europe/Paris", "Asia/Kolkata"}) {
        GregorianCalendar start = new GregorianCalendar(TimeZone.getTimeZone(zone, TimeZone.TIMEZONE_ICU));
        start.setGregorianChange(new Date(Long.MIN_VALUE));
        start.setRepeatedWallTimeOption(Calendar.WALLTIME_FIRST);
        start.setSkippedWallTimeOption(Calendar.WALLTIME_LAST);
        start.clear();
        if (zone.equals("Pacific/Apia")) start.set(2011, 6, 1, 12, 0, 0);
        else if (zone.equals("Australia/Lord_Howe")) start.set(2020, 9, 3, 12, 0, 0);
        else if (zone.equals("America/New_York")) start.set(2020, 2, 7, 12, 0, 0);
        else start.set(2019, 0, 1, 0, 0, 0);
        BigInteger origin = nanos(start);
        for (int unit = 0; unit < UNITS.length; unit++) {
          int[] increments = unit == 4 ? new int[] {1, 2, 3} : new int[] {1, 2, 5};
          for (int increment : increments) for (int count : new int[] {1, 2, -1, -2}) {
            int sign = Integer.signum(count);
            BigInteger a = endpoint(start, origin, unit, count * increment);
            BigInteger b = endpoint(start, origin, unit, (count + sign) * increment);
            BigInteger span = b.subtract(a);
            for (int numerator : new int[] {1, 2, 3}) {
              BigInteger end = a.add(span.multiply(BigInteger.valueOf(numerator)).divide(BigInteger.valueOf(4)));
              BigDecimal fraction = new BigDecimal(end.subtract(a)).divide(new BigDecimal(span), 40, RoundingMode.HALF_EVEN);
              BigDecimal value = BigDecimal.valueOf(count).add(fraction.multiply(BigDecimal.valueOf(sign)));
              for (String mode : MODES) {
                long until = rounded(value, mode) * increment;
                long since = rounded(value.negate(), mode) * increment;
                out.println(zone + "\t" + origin + "\t" + end + "\t" + UNITS[unit] + "\t" + increment + "\t" + mode + "\t" + until + "\t" + since);
              }
            }
          }
        }
      }
    }
  }
  private static BigInteger nanos(Calendar calendar) {return BigInteger.valueOf(calendar.getTimeInMillis()).multiply(BigInteger.valueOf(1000000));}
  private static BigInteger endpoint(Calendar start, BigInteger origin, int unit, int count) {
    if (unit >= 4) return origin.add(BigInteger.valueOf(CLOCK[unit - 4]).multiply(BigInteger.valueOf(count)));
    Calendar calendar = (Calendar) start.clone();
    int[] fields = {Calendar.YEAR, Calendar.MONTH, Calendar.DATE, Calendar.DATE};
    calendar.add(fields[unit], count * (unit == 2 ? 7 : 1));
    return nanos(calendar);
  }
  private static long rounded(BigDecimal value, String mode) {
    RoundingMode rounding = switch (mode) {
      case "ceil" -> RoundingMode.CEILING;
      case "floor" -> RoundingMode.FLOOR;
      case "expand" -> RoundingMode.UP;
      case "trunc" -> RoundingMode.DOWN;
      case "halfCeil" -> value.signum() < 0 ? RoundingMode.HALF_DOWN : RoundingMode.HALF_UP;
      case "halfFloor" -> value.signum() < 0 ? RoundingMode.HALF_UP : RoundingMode.HALF_DOWN;
      case "halfExpand" -> RoundingMode.HALF_UP;
      case "halfTrunc" -> RoundingMode.HALF_DOWN;
      case "halfEven" -> RoundingMode.HALF_EVEN;
      default -> throw new IllegalArgumentException(mode);
    };
    return value.setScale(0, rounding).longValueExact();
  }
}
