import com.ibm.icu.text.TimeZoneFormat;
import com.ibm.icu.util.TimeZone;
import com.ibm.icu.util.ULocale;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Instant;

public final class HistoricalTimeZoneOracle {
  public static void main(String[] args) throws Exception {
    var format = TimeZoneFormat.getInstance(ULocale.ENGLISH);
    String[] widths = {"long", "short", "longOffset", "shortOffset"};
    TimeZoneFormat.Style[] styles = {
      TimeZoneFormat.Style.SPECIFIC_LONG, TimeZoneFormat.Style.SPECIFIC_SHORT,
      TimeZoneFormat.Style.LOCALIZED_GMT, TimeZoneFormat.Style.LOCALIZED_GMT_SHORT
    };
    try (var out = Files.newBufferedWriter(Path.of(args[0]), StandardCharsets.UTF_8)) {
      for (String zone : new String[]{"Europe/London", "America/New_York", "Europe/Paris", "Asia/Kathmandu"}) {
        for (String date : new String[]{"1900-06-01T12:00:00Z", "1960-01-01T12:00:00Z", "1960-06-01T12:00:00Z", "2000-06-01T12:00:00Z"}) {
          long epoch = Instant.parse(date).toEpochMilli();
          for (int index = 0; index < widths.length; index++) {
            out.write(zone + "\t" + epoch + "\t" + widths[index] + "\t"
                + format.format(styles[index], TimeZone.getTimeZone(zone, TimeZone.TIMEZONE_ICU), epoch) + "\n");
          }
        }
      }
    }
  }
}
