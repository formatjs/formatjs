import com.ibm.icu.util.Calendar;
import com.ibm.icu.util.GregorianCalendar;
import com.ibm.icu.util.TimeZone;
import java.io.PrintWriter;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.util.Date;

public final class TemporalZonedRoundingOracle {
  private static final String[] MODES = {"ceil", "floor", "expand", "trunc", "halfCeil", "halfFloor", "halfExpand", "halfTrunc", "halfEven"};

  public static void main(String[] args) throws Exception {
    String[][] seeds = {
      {"UTC", "1969-12-31"}, {"America/New_York", "2020-03-08"},
      {"America/New_York", "2020-11-01"}, {"Australia/Lord_Howe", "2020-10-04"},
      {"Australia/Lord_Howe", "2020-04-05"}, {"Pacific/Apia", "2011-12-30"},
      {"Europe/Paris", "1900-01-01"}, {"Asia/Kathmandu", "1986-01-01"},
      {"Antarctica/Casey", "2010-03-05"}, {"America/Vancouver", "2000-04-02"},
      {"America/Sao_Paulo", "2018-11-04"}, {"America/Havana", "2020-11-01"},
      {"Pacific/Kwajalein", "1969-09-30"}, {"Pacific/Apia", "1892-07-04"}
    };
    try (PrintWriter out = new PrintWriter(args[0], StandardCharsets.UTF_8)) {
      out.println("# ICU4J earliest civil boundaries; TC39 repeated-date rounding cap");
      for (String[] seed : seeds) {
        GregorianCalendar calendar = new GregorianCalendar(TimeZone.getTimeZone(seed[0], TimeZone.TIMEZONE_ICU));
        calendar.setGregorianChange(new Date(Long.MIN_VALUE));
        calendar.setRepeatedWallTimeOption(Calendar.WALLTIME_FIRST);
        calendar.setSkippedWallTimeOption(Calendar.WALLTIME_NEXT_VALID);
        LocalDate date = LocalDate.parse(seed[1]);
        long origin = boundary(calendar, date.getYear(), date.getMonthValue(), date.getDayOfMonth());
        for (int hour = -12; hour <= 48; hour += 3) for (int minute : new int[] {0, 30}) {
          long instant = origin + hour * 3600000L + minute * 60000L;
          calendar.setTimeInMillis(instant);
          int year = calendar.get(Calendar.EXTENDED_YEAR), month = calendar.get(Calendar.MONTH) + 1, day = calendar.get(Calendar.DATE);
          long start = boundary(calendar, year, month, day);
          LocalDate next = LocalDate.of(year, month, day).plusDays(1);
          long end = boundary(calendar, next.getYear(), next.getMonthValue(), next.getDayOfMonth());
          long elapsed = Math.min(instant, end - 1) - start, length = end - start;
          if (elapsed < 0 || length <= 0) throw new AssertionError(seed[0]);
          for (String mode : MODES) {
            boolean up = elapsed != 0 && switch (mode) {
              case "ceil", "expand" -> true;
              case "floor", "trunc" -> false;
              default -> elapsed * 2 > length || elapsed * 2 == length && (mode.equals("halfCeil") || mode.equals("halfExpand"));
            };
            out.println(seed[0] + "\t" + instant + "\t" + start + "\t" + end + "\t" + mode + "\t" + (up ? end : start));
          }
        }
      }
    }
  }
  private static long boundary(Calendar calendar, int year, int month, int day) {
    calendar.clear();
    calendar.set(Calendar.EXTENDED_YEAR, year);
    calendar.set(Calendar.MONTH, month - 1);
    calendar.set(Calendar.DATE, day);
    return calendar.getTimeInMillis();
  }
}
