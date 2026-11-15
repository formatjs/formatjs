import com.ibm.icu.util.BasicTimeZone;
import com.ibm.icu.util.TimeZone;
import com.ibm.icu.util.TimeZoneTransition;
import java.io.PrintWriter;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.Arrays;
import java.util.TreeSet;

public final class TemporalTransitionOracle {
  private static final long LIMIT = 8_640_000_000_000_000L;

  public static void main(String[] args) throws Exception {
    try (PrintWriter out = new PrintWriter(args[0], StandardCharsets.UTF_8)) {
      out.println("# ICU tzdb " + TimeZone.getTZDataVersion() + "; strict offset transitions");
      String[] identifiers = TimeZone.getAvailableIDs();
      Arrays.sort(identifiers);
      for (String id : identifiers) {
        BasicTimeZone zone = (BasicTimeZone) TimeZone.getTimeZone(id, TimeZone.TIMEZONE_ICU);
        TreeSet<Long> samples = new TreeSet<>();
        for (int year : new int[] {1970, 2000, 2100, 2101, 2400, 2500, 10000, 275000}) {
          for (int month : new int[] {1, 7}) samples.add(millis(year, month));
          TimeZoneTransition event = event(zone, millis(year, 1), true);
          if (event != null && event.getTime() < millis(year + 1, 1)) {
            samples.add(event.getTime() - 1);
            samples.add(event.getTime());
            samples.add(event.getTime() + 1);
          }
        }
        if (id.equals("America/New_York") || id.equals("Europe/Paris") || id.equals("Asia/Kolkata")) {
          samples.add(millis(1880, 1));
          samples.add(millis(1900, 1));
        }
        for (long query : samples) {
          out.println(id + "\t" + query + "\t" + text(event(zone, query, true)) + "\t" + text(event(zone, query, false)));
        }
      }
    }
  }

  private static TimeZoneTransition event(BasicTimeZone zone, long query, boolean next) {
    for (int count = 0; count < 1000; count++) {
      TimeZoneTransition event = next ? zone.getNextTransition(query, false) : zone.getPreviousTransition(query, false);
      if (event == null || event.getTime() < -LIMIT || event.getTime() > LIMIT) return null;
      if (event.getFrom().getRawOffset() + event.getFrom().getDSTSavings() != event.getTo().getRawOffset() + event.getTo().getDSTSavings()) return event;
      query = event.getTime();
    }
    throw new IllegalStateException("Nonadvancing offset transitions");
  }

  private static String text(TimeZoneTransition event) {
    return event == null ? "null" : Long.toString(event.getTime());
  }
  private static long millis(int year, int month) {
    return LocalDate.of(year, month, 1).atStartOfDay().toInstant(ZoneOffset.UTC).toEpochMilli();
  }
}
