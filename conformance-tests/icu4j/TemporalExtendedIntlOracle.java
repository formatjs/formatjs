import com.ibm.icu.util.Calendar;
import com.ibm.icu.util.GregorianCalendar;
import com.ibm.icu.util.TimeZone;
import java.io.PrintWriter;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.TreeSet;

/** Gregorian civil fields outside JavaScript Date's clipping boundary. */
public final class TemporalExtendedIntlOracle {
  private static final long LIMIT = 8640000000000000L;
  private static final long DAY = 86400000L;
  private static final long CYCLE = 146097L * DAY;
  private static void row(PrintWriter out, GregorianCalendar calendar, String kind, long milliseconds) {
    calendar.setTimeInMillis(milliseconds);
    out.println(kind + "\t" + milliseconds + "\t" + calendar.get(Calendar.EXTENDED_YEAR) + "\t" +
      (calendar.get(Calendar.MONTH) + 1) + "\t" + calendar.get(Calendar.DATE) + "\t" +
      calendar.get(Calendar.HOUR_OF_DAY) + "\t" + calendar.get(Calendar.MINUTE) + "\t" +
      calendar.get(Calendar.SECOND) + "\t" + calendar.get(Calendar.MILLISECOND) + "\t" +
      ((calendar.get(Calendar.DAY_OF_WEEK) + 5) % 7 + 1) + "\t" + calendar.get(Calendar.YEAR));
  }
  private static long civil(GregorianCalendar calendar, int year, int month, int day) {
    calendar.clear();
    calendar.set(Calendar.EXTENDED_YEAR, year);
    calendar.set(Calendar.MONTH, month - 1);
    calendar.set(Calendar.DATE, day);
    calendar.set(Calendar.HOUR_OF_DAY, 12);
    return calendar.getTimeInMillis();
  }
  public static void main(String[] args) throws Exception {
    GregorianCalendar calendar = new GregorianCalendar(TimeZone.getTimeZone("UTC"));
    calendar.setGregorianChange(new Date(Long.MIN_VALUE));
    TreeSet<Long> samples = new TreeSet<>();
    for (long value : new long[] {
      -LIMIT - DAY + 1, -LIMIT - 1, -LIMIT, -LIMIT + 1,
      LIMIT - 1, LIMIT, LIMIT + 1, LIMIT + DAY - 1,
      -LIMIT + DAY - 1, LIMIT - DAY + 1,
      -LIMIT - DAY + 1 + CYCLE, LIMIT + DAY - 1 - CYCLE
    }) samples.add(value);
    for (int[] date : new int[][] {{0, 12, 31}, {1, 1, 1}, {1900, 2, 28}, {2000, 2, 29}, {2020, 2, 29}})
      samples.add(civil(calendar, date[0], date[1], date[2]));
    try (PrintWriter out = new PrintWriter(args[0], StandardCharsets.UTF_8)) {
      out.println("# ICU4J 79.1 proleptic Gregorian; kind, milliseconds, year, month, day, hour, minute, second, millisecond, ISO weekday, era year");
      for (long value : samples) row(out, calendar, "datetime", value);
      row(out, calendar, "yearmonth", civil(calendar, -271821, 4, 1));
      row(out, calendar, "yearmonth", civil(calendar, 275760, 9, 1));
    }
  }
}
