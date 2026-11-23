import com.ibm.icu.text.DateFormat;
import com.ibm.icu.text.DateTimePatternGenerator;
import com.ibm.icu.text.SimpleDateFormat;
import com.ibm.icu.util.GregorianCalendar;
import com.ibm.icu.util.TimeZone;
import com.ibm.icu.util.ULocale;
import java.io.PrintWriter;
import java.nio.charset.StandardCharsets;
import java.util.Date;

public final class TemporalShortStyleOracle {
  public static void main(String[] args) throws Exception {
    long[] samples = {-62198755200123L, -2208988800123L, 123L,
        1580725840321L, 1725453296789L, 4102444800123L};
    int[] styles = {DateFormat.FULL, DateFormat.LONG, DateFormat.MEDIUM, DateFormat.SHORT};
    String[] names = {"full", "long", "medium", "short"};
    try (PrintWriter out = new PrintWriter(args[0], StandardCharsets.UTF_8)) {
      out.println("# ICU4J projected YearMonth/MonthDay styles; proleptic Gregorian, UTC");
      for (String name : new String[] {"en", "de", "fr", "ja", "ar-EG", "hi", "ru", "zh"}) {
        ULocale locale = ULocale.forLanguageTag(name).setKeywordValue("calendar", "gregorian");
        DateTimePatternGenerator generator = DateTimePatternGenerator.getInstance(locale);
        for (String kind : new String[] {"PlainYearMonth", "PlainMonthDay"}) {
          String allowed = kind.equals("PlainYearMonth") ? "GyML" : "MLd";
          for (int index = 0; index < styles.length; index++) {
            SimpleDateFormat source = (SimpleDateFormat) DateFormat.getDateInstance(styles[index], locale);
            String skeleton = generator.getSkeleton(source.toPattern());
            StringBuilder selected = new StringBuilder();
            for (int at = 0; at < skeleton.length(); at++) {
              char field = skeleton.charAt(at);
              if (allowed.indexOf(field) >= 0) selected.append(field);
            }
            SimpleDateFormat format = new SimpleDateFormat(generator.getBestPattern(selected.toString()), locale);
            StringBuilder options = new StringBuilder("{");
            for (int at = 0; at < selected.length();) {
              char field = selected.charAt(at);
              int end = at + 1;
              while (end < selected.length() && selected.charAt(end) == field) end++;
              int width = end - at;
              String key = switch (field) {
                case 'G' -> "era";
                case 'y' -> "year";
                case 'M', 'L' -> "month";
                case 'd' -> "day";
                default -> throw new IllegalArgumentException("Unexpected skeleton field " + field);
              };
              String value = field == 'G' ? (width >= 5 ? "narrow" : width == 4 ? "long" : "short")
                  : (field == 'M' || field == 'L') && width >= 3
                      ? (width >= 5 ? "narrow" : width == 4 ? "long" : "short")
                      : width == 2 ? "2-digit" : "numeric";
              if (options.length() > 1) options.append(',');
              options.append('"').append(key).append("\":\"").append(value).append('"');
              at = end;
            }
            options.append('}');
            GregorianCalendar calendar = new GregorianCalendar(TimeZone.getTimeZone("UTC"), locale);
            calendar.setGregorianChange(new Date(Long.MIN_VALUE));
            format.setCalendar(calendar);
            for (long epoch : samples) {
              out.println(kind + "\t" + name + "\t" + epoch + "\t" + names[index]
                  + "\t" + options + "\t" + format.format(new Date(epoch)));
            }
          }
        }
      }
    }
  }
}
