import com.ibm.icu.math.BigDecimal;
import java.io.PrintWriter;
import java.nio.charset.StandardCharsets;
import java.util.TreeSet;

/** Independent field-relative clock rounding, including odd half-even quotients. */
public final class TemporalTimeOracle {
  public static void main(String[] args) throws Exception {
    long day = 86400000000000L;
    String[] units = {"hour", "minute", "second", "millisecond", "microsecond", "nanosecond"};
    long[] factors = {3600000000000L, 60000000000L, 1000000000L, 1000000, 1000, 1};
    int[][] increments = {{1, 3, 8, 12}, {1, 12, 20}, {1, 12, 20}, {1, 8, 125}, {1, 8, 125}, {1, 8, 125}};
    String[] modes = {"ceil", "floor", "expand", "trunc", "halfCeil", "halfFloor", "halfExpand", "halfTrunc", "halfEven"};
    int[] rounding = {BigDecimal.ROUND_CEILING, BigDecimal.ROUND_FLOOR, BigDecimal.ROUND_UP, BigDecimal.ROUND_DOWN, BigDecimal.ROUND_HALF_UP, BigDecimal.ROUND_HALF_DOWN, BigDecimal.ROUND_HALF_UP, BigDecimal.ROUND_HALF_DOWN, BigDecimal.ROUND_HALF_EVEN};
    try (PrintWriter out = new PrintWriter(args[0], StandardCharsets.UTF_8)) {
      out.println("# ICU4J 79.1 BigDecimal; clock nanoseconds, unit, increment, mode, wrapped clock nanoseconds");
      for (int unit = 0; unit < units.length; unit++) {
        long parent = unit == 0 ? day : factors[unit - 1];
        for (int increment : increments[unit]) {
          long quantum = factors[unit] * increment;
          TreeSet<Long> samples = new TreeSet<>();
          for (long base : new long[] {0, parent, 3 * parent, day - parent}) {
            for (long edge : new long[] {0, quantum / 2, quantum, 3 * quantum / 2, parent - 1}) {
              for (int delta = -1; delta <= 1; delta++) {
                long value = base + edge + delta;
                if (value >= 0 && value < day) samples.add(value);
              }
            }
          }
          for (long value : samples) {
            long base = value / parent * parent;
            for (int mode = 0; mode < modes.length; mode++) {
              long rounded = new BigDecimal(value - base).divide(new BigDecimal(quantum), 0, rounding[mode]).longValueExact() * quantum;
              out.println(value + "\t" + units[unit] + "\t" + increment + "\t" + modes[mode] + "\t" + ((base + rounded) % day));
            }
          }
        }
      }
    }
  }
}
