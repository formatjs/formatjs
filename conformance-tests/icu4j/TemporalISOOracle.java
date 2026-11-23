import com.ibm.icu.util.Calendar;
import com.ibm.icu.util.GregorianCalendar;
import com.ibm.icu.util.TimeZone;
import java.io.PrintWriter;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.TreeSet;

/** Proleptic Gregorian fields across Temporal's full instant range. */
public final class TemporalISOOracle {
  public static void main(String[] args) throws Exception {
    GregorianCalendar calendar = new GregorianCalendar(TimeZone.getTimeZone("UTC"));
    calendar.setGregorianChange(new Date(Long.MIN_VALUE));
    TreeSet<Long> samples = new TreeSet<>();
    for (long day = -100000000; day <= 100000000; day += 7919) {
      samples.add(day * 86400000L + Math.floorMod(day * 1234567L, 86400000L));
    }
    for (long edge : new long[] {-8640000000000000L, -1, 0, 1, 8640000000000000L}) {
      samples.add(edge);
      samples.add(edge - 1);
      samples.add(edge + 1);
    }
    samples.add(-8640000086400000L + 1);
    samples.add(8640000086400000L - 1);
    try (PrintWriter out = new PrintWriter(args[0], StandardCharsets.UTF_8)) {
      boolean javascript = args.length > 1 && args[1].equals("--js");
      if (javascript) {
        out.println("var __temporalISOOracle = [");
      } else {
        out.println("# ICU4J 79.1 proleptic Gregorian; epoch milliseconds, year, month, day, hour, minute, second, millisecond");
      }
      for (long milliseconds : samples) {
        calendar.setTimeInMillis(milliseconds);
        String row = milliseconds + "\t" + calendar.get(Calendar.EXTENDED_YEAR) + "\t" +
          (calendar.get(Calendar.MONTH) + 1) + "\t" + calendar.get(Calendar.DATE) + "\t" +
          calendar.get(Calendar.HOUR_OF_DAY) + "\t" + calendar.get(Calendar.MINUTE) + "\t" +
          calendar.get(Calendar.SECOND) + "\t" + calendar.get(Calendar.MILLISECOND);
        out.println(javascript ? "[" + row.replace('\t', ',') + "]," : row);
      }
      if (javascript) out.println("];");
    }
  }
}
