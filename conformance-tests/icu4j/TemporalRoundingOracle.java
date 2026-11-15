import com.ibm.icu.math.BigDecimal;
import java.io.PrintWriter;
import java.math.BigInteger;
import java.nio.charset.StandardCharsets;
import java.util.TreeSet;

/** Exact ICU decimal rounding, shifted to a positive origin with even quotient. */
public final class TemporalRoundingOracle {
  public static void main(String[] args) throws Exception {
    BigInteger origin = new BigInteger("8640000000000000000000");
    String[] units = {"nanosecond", "nanosecond", "microsecond", "millisecond", "second", "second", "minute", "minute", "hour", "hour", "hour"};
    long[] factors = {1, 1, 1000, 1000000, 1000000000, 1000000000, 60000000000L, 60000000000L, 3600000000000L, 3600000000000L, 3600000000000L};
    int[] increments = {1, 25, 8, 125, 1, 864, 1, 45, 1, 8, 24};
    String[] modes = {"ceil", "floor", "expand", "trunc", "halfCeil", "halfFloor", "halfExpand", "halfTrunc", "halfEven"};
    int[] icuModes = {BigDecimal.ROUND_CEILING, BigDecimal.ROUND_FLOOR, BigDecimal.ROUND_CEILING, BigDecimal.ROUND_FLOOR, BigDecimal.ROUND_HALF_UP, BigDecimal.ROUND_HALF_DOWN, BigDecimal.ROUND_HALF_UP, BigDecimal.ROUND_HALF_DOWN, BigDecimal.ROUND_HALF_EVEN};
    try (PrintWriter out = new PrintWriter(args[0], StandardCharsets.UTF_8)) {
      out.println("# ICU4J 79.1 BigDecimal; epoch nanoseconds, unit, increment, mode, rounded epoch nanoseconds");
      for (int i = 0; i < units.length; i++) {
        BigInteger quantum = BigInteger.valueOf(factors[i]).multiply(BigInteger.valueOf(increments[i]));
        if (!origin.mod(quantum.multiply(BigInteger.TWO)).equals(BigInteger.ZERO)) throw new IllegalStateException("Origin must be an even quantum multiple");
        TreeSet<BigInteger> samples = new TreeSet<>();
        for (BigInteger edge : new BigInteger[] {origin.negate(), origin.negate().add(quantum), quantum.negate(), quantum.negate().divide(BigInteger.TWO), BigInteger.ZERO, quantum.divide(BigInteger.TWO), quantum, origin.subtract(quantum), origin}) {
          for (int delta : new int[] {-1, 0, 1}) {
            BigInteger value = edge.add(BigInteger.valueOf(delta));
            if (value.abs().compareTo(origin) <= 0) samples.add(value);
          }
        }
        for (BigInteger value : samples) {
          for (int mode = 0; mode < modes.length; mode++) {
            BigDecimal positive = new BigDecimal(value.add(origin).toString());
            BigInteger rounded = positive.divide(new BigDecimal(quantum.toString()), 0, icuModes[mode]).toBigIntegerExact().multiply(quantum).subtract(origin);
            out.println(value + "\t" + units[i] + "\t" + increments[i] + "\t" + modes[mode] + "\t" + rounded);
          }
        }
      }
    }
  }
}
