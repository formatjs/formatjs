import com.ibm.icu.util.Calendar;
import com.ibm.icu.util.GregorianCalendar;
import com.ibm.icu.util.TimeZone;
import java.io.PrintWriter;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.math.BigInteger;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Date;

public final class TemporalPlainRelativeOracle {
  private static final String[] UNITS = {"year", "month", "week", "day", "hour", "minute", "second", "millisecond", "microsecond", "nanosecond"};
  private static final String[] MODES = {"ceil", "floor", "expand", "trunc", "halfCeil", "halfFloor", "halfExpand", "halfTrunc", "halfEven"};
  private static final long[] CLOCK = {3600000000000L, 60000000000L, 1000000000L, 1000000L, 1000L, 1L};
  private static final BigInteger DAY = BigInteger.valueOf(86400000000000L);

  public static void main(String[] args) throws Exception {
    try (PrintWriter out = new PrintWriter(args[0], StandardCharsets.UTF_8)) {
      out.println("# ICU4J proleptic Gregorian plain spans; BigDecimal signed rounding/totals");
      for (int[] date : new int[][] {{2019,1,1}, {2020,1,31}, {2020,2,29}, {2021,3,31}, {0,2,29}, {-44,3,15}, {275000,1,1}, {-270000,3,1}}) {
        GregorianCalendar start = new GregorianCalendar(TimeZone.getTimeZone("UTC", TimeZone.TIMEZONE_ICU));
        start.setGregorianChange(new Date(Long.MIN_VALUE));
        start.clear();
        start.set(Calendar.EXTENDED_YEAR, date[0]);
        start.set(Calendar.MONTH, date[1] - 1);
        start.set(Calendar.DATE, date[2]);
        BigInteger origin = nanos(start);
        for (int unit = 0; unit < UNITS.length; unit++) {
          int[] increments = unit == 4 ? new int[] {1,2,3} : new int[] {1,2,5};
          for (int increment : increments) for (int count : new int[] {1,2,-1,-2}) {
            int sign = Integer.signum(count);
            BigInteger a = endpoint(start, origin, unit, count * increment);
            BigInteger b = endpoint(start, origin, unit, (count + sign) * increment);
            BigInteger span = b.subtract(a);
            for (int divisor : new int[] {4,7}) for (int numerator : new int[] {1,2,3}) {
              BigInteger end = a.add(span.multiply(BigInteger.valueOf(numerator)).divide(BigInteger.valueOf(divisor)));
              row(out, "R", origin, end, unit, increment, count, sign, a, span);
              if (unit < 4) {
                BigInteger[] parts = end.divideAndRemainder(DAY);
                BigInteger day = parts[0].subtract(parts[1].signum() < 0 ? BigInteger.ONE : BigInteger.ZERO);
                row(out, "D", origin, day.multiply(DAY), unit, increment, count, sign, a, span);
              }
            }
          }
        }
        String[] durations = {"P1Y", "P12M", "P365D", "P366D", "P1M", "P28D", "P29D", "P30D", "P31D", "P4W", "P1W", "P7D", "PT24H", "PT25H", "P1DT0.000000001S", "P1DT23H"};
        BigInteger[] ends = new BigInteger[durations.length * 2];
        for (int sign : new int[] {1,-1}) for (int i = 0; i < durations.length; i++) {
          int unit = switch (i) { case 0 -> 0; case 1,4 -> 1; case 9,10 -> 2; case 12,13 -> 4; default -> 3; };
          int count = new int[] {1,12,365,366,1,28,29,30,31,4,1,7,24,25,1,1}[i];
          BigInteger end = endpoint(start, origin, unit, count * sign);
          if (i == 14) end = end.add(BigInteger.valueOf(sign));
          if (i == 15) end = end.add(BigInteger.valueOf(CLOCK[0]).multiply(BigInteger.valueOf(23L * sign)));
          ends[i + (sign < 0 ? durations.length : 0)] = end;
        }
        for (int i = 0; i < ends.length; i++) for (int j = 0; j <= i; j++) {
          String one = (i >= durations.length ? "-" : "") + durations[i % durations.length];
          String two = (j >= durations.length ? "-" : "") + durations[j % durations.length];
          out.println("C\t" + origin + "\t" + one + "\t" + two + "\t" + ends[i].compareTo(ends[j]));
        }
      }
    }
    if (args.length > 1) {
      String fixture = Files.readString(Path.of(args[0]), StandardCharsets.UTF_8);
      String literal = fixture.replace("\\", "\\\\").replace("\"", "\\\"").replace("\r", "\\r").replace("\n", "\\n").replace("\t", "\\t");
      Files.writeString(Path.of(args[1]), "globalThis.__formatjsTemporalPlainRelative = \"" + literal + "\";\n", StandardCharsets.UTF_8);
    }
  }
  private static void row(PrintWriter out, String kind, BigInteger origin, BigInteger end, int unit, int increment, int count, int sign, BigInteger a, BigInteger span) {
    BigDecimal fraction = new BigDecimal(end.subtract(a)).divide(new BigDecimal(span), 80, RoundingMode.HALF_EVEN);
    BigDecimal value = BigDecimal.valueOf(count).add(fraction.multiply(BigDecimal.valueOf(sign)));
    for (String mode : MODES) {
      out.println(kind + "\t" + origin + "\t" + end + "\t" + UNITS[unit] + "\t" + increment + "\t" + mode + "\t" + (rounded(value, mode) * increment) + "\t" + (rounded(value.negate(), mode) * increment) + "\t" + (increment == 1 ? Double.toString(value.doubleValue()) : "null"));
    }
  }
  private static BigInteger nanos(Calendar calendar) { return BigInteger.valueOf(calendar.getTimeInMillis()).multiply(BigInteger.valueOf(1000000)); }
  private static BigInteger endpoint(Calendar start, BigInteger origin, int unit, int count) {
    if (unit >= 4) return origin.add(BigInteger.valueOf(CLOCK[unit - 4]).multiply(BigInteger.valueOf(count)));
    Calendar calendar = (Calendar) start.clone();
    calendar.add(new int[] {Calendar.YEAR, Calendar.MONTH, Calendar.DATE, Calendar.DATE}[unit], count * (unit == 2 ? 7 : 1));
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
