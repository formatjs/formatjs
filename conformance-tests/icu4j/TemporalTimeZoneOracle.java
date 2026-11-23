import com.ibm.icu.util.BasicTimeZone;
import com.ibm.icu.util.TimeZone;
import com.ibm.icu.util.TimeZoneTransition;
import java.io.PrintWriter;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.Arrays;
import java.util.TreeSet;

/** Future total offsets, sampled independently from FormatJS transition data. */
public final class TemporalTimeZoneOracle {
  public static void main(String[] args) throws Exception {
    try (PrintWriter out = new PrintWriter(args[0], StandardCharsets.UTF_8)) {
      boolean javascript = args.length > 1 && args[1].equals("--js");
      if (javascript) out.println("var __temporalTimezoneOracle = [");
      if (!javascript) out.println("# ICU tzdb " + TimeZone.getTZDataVersion());
      String[] identifiers = TimeZone.getAvailableIDs();
      Arrays.sort(identifiers);
      for (String id : identifiers) {
        BasicTimeZone zone = (BasicTimeZone) TimeZone.getTimeZone(id, TimeZone.TIMEZONE_ICU);
        TreeSet<Long> samples = new TreeSet<>();
        for (int year : new int[] {2101, 2400, 2500, 10000, 275000}) {
          long begin = millis(year, 1);
          long end = millis(year + 1, 1);
          for (int month : new int[] {1, 4, 7, 10}) samples.add(millis(year, month));
          TimeZoneTransition transition = zone.getNextTransition(begin, true);
          int count = 0;
          while (transition != null && transition.getTime() < end) {
            if (++count > 100) throw new IllegalStateException("Nonadvancing transitions: " + id);
            long instant = transition.getTime();
            samples.add(instant - 1);
            samples.add(instant);
            samples.add(instant + 1);
            transition = zone.getNextTransition(instant, false);
          }
        }
        for (long instant : samples) {
          row(out, javascript, id + "\t" + instant + "\t" + zone.getOffset(instant) / 1000);
        }
      }
      if (javascript) out.println("]; ");
    }
  }

  private static long millis(int year, int month) {
    return LocalDate.of(year, month, 1).atStartOfDay().toInstant(ZoneOffset.UTC).toEpochMilli();
  }
  private static void row(PrintWriter out, boolean javascript, String value) {
    out.println(javascript ? "\"" + value.replace("\\", "\\\\").replace("\"", "\\\"").replace("\t", "\\t") + "\"," : value);
  }

}
