import com.ibm.icu.util.Calendar;
import com.ibm.icu.util.HebrewCalendar;
import com.ibm.icu.util.TimeZone;
import java.io.PrintWriter;
import java.nio.charset.StandardCharsets;
import java.util.TreeSet;

/** Hebrew fields sampled independently across modern dates and positive calendar years. */
public final class TemporalCalendarOracle {
  public static void main(String[] args) throws Exception {
    Calendar calendar = new HebrewCalendar(TimeZone.getTimeZone("UTC"));
    TreeSet<Integer> days = new TreeSet<>();
    for (int day = -1000000; day <= 1000000; day += 997) days.add(day);
    for (int day = -25567; day <= 47847; day += 17) days.add(day);
    try (PrintWriter out = new PrintWriter(args[0], StandardCharsets.UTF_8)) {
      out.println("# ICU4J Hebrew calendar");
      for (int day : days) {
        calendar.setTimeInMillis((long) day * 86400000L);
        int year = calendar.get(Calendar.EXTENDED_YEAR);
        int month = calendar.get(Calendar.MONTH);
        boolean leap = Math.floorMod(7 * year + 1, 19) < 7;
        int ordinal = month + 1 - (!leap && month >= 6 ? 1 : 0);
        String code = month == 5 ? "M05L" : String.format("M%02d", month < 5 ? month + 1 : month);
        out.println(day + "\t" + year + "\t" + ordinal + "\t" + code + "\t" + calendar.get(Calendar.DATE));
      }
    }
  }
}
