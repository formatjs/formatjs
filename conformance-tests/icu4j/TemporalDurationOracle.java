import com.ibm.icu.math.BigDecimal;
import com.ibm.icu.math.MathContext;
import java.io.PrintWriter;
import java.math.BigInteger;
import java.nio.charset.StandardCharsets;
import java.util.TreeSet;

/** Signed duration rounding and exact rational-to-double totals, independent of FormatJS. */
public final class TemporalDurationOracle {
  private static void row(PrintWriter out, boolean javascript, String value) {
    out.println(javascript ? "[\"" + value.replace("\t", "\",\"") + "\"]," : value);
  }
  public static void main(String[] args) throws Exception {
    BigInteger limit = new BigInteger("9007199254740992000000000");
    long[] factors = {1, 1000, 1000000, 1000000000, 60000000000L, 3600000000000L, 86400000000000L};
    String[] units = {"nanosecond", "microsecond", "millisecond", "second", "minute", "hour", "day"};
    String[] modes = {"ceil", "floor", "expand", "trunc", "halfCeil", "halfFloor", "halfExpand", "halfTrunc", "halfEven"};
    MathContext precise = new MathContext(200, MathContext.SCIENTIFIC, false, BigDecimal.ROUND_HALF_EVEN);
    try (PrintWriter out = new PrintWriter(args[0], StandardCharsets.UTF_8)) {
      boolean javascript = args.length > 1 && args[1].equals("--js");
      if (javascript) out.println("var __temporalDurationOracle = [");
      else out.println("# ICU4J 79.1 BigDecimal; kind, nanoseconds, unit, mode, expected");
      for (int unit = 0; unit < factors.length; unit++) {
        BigInteger quantum = BigInteger.valueOf(factors[unit]);
        TreeSet<BigInteger> values = new TreeSet<>();
        for (BigInteger edge : new BigInteger[] {BigInteger.ZERO, quantum, quantum.divide(BigInteger.TWO),
            quantum.multiply(BigInteger.valueOf(3)).divide(BigInteger.TWO),
            quantum.multiply(BigInteger.valueOf(5)).divide(BigInteger.TWO),
            BigInteger.ONE.shiftLeft(53), BigInteger.ONE.shiftLeft(63), limit.subtract(quantum), limit}) {
          for (int delta = -3; delta <= 3; delta++) {
            BigInteger value = edge.add(BigInteger.valueOf(delta));
            if (value.abs().compareTo(limit) < 0) {values.add(value); values.add(value.negate());}
          }
        }
        for (BigInteger value : values) {
          BigDecimal number = new BigDecimal(value.toString());
          BigDecimal divisor = new BigDecimal(quantum.toString());
          double total = number.divide(divisor, precise).doubleValue();
          row(out, javascript, "total\t" + value + "\t" + units[unit] + "\t-\t" + Double.toString(total));
          int[] rounding = {BigDecimal.ROUND_CEILING, BigDecimal.ROUND_FLOOR, BigDecimal.ROUND_UP, BigDecimal.ROUND_DOWN,
            value.signum() < 0 ? BigDecimal.ROUND_HALF_DOWN : BigDecimal.ROUND_HALF_UP,
            value.signum() < 0 ? BigDecimal.ROUND_HALF_UP : BigDecimal.ROUND_HALF_DOWN,
            BigDecimal.ROUND_HALF_UP, BigDecimal.ROUND_HALF_DOWN, BigDecimal.ROUND_HALF_EVEN};
          for (int mode = 0; mode < modes.length; mode++) {
            BigInteger rounded = number.divide(divisor, 0, rounding[mode]).toBigIntegerExact().multiply(quantum);
            row(out, javascript, "round\t" + value + "\t" + units[unit] + "\t" + modes[mode] + "\t" + rounded);
          }
        }
      }
      if (javascript) out.println("];");
    }
  }
}
