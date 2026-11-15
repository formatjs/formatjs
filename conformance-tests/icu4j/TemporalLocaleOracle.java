import com.ibm.icu.text.DateFormat;
import com.ibm.icu.text.DateTimePatternGenerator;
import com.ibm.icu.text.SimpleDateFormat;
import com.ibm.icu.util.GregorianCalendar;
import com.ibm.icu.util.TimeZone;
import com.ibm.icu.util.ULocale;
import java.io.PrintWriter;
import java.nio.charset.StandardCharsets;
import java.util.Date;

public final class TemporalLocaleOracle {
  public static void main(String[] args) throws Exception {
    long[] samples = {-2208988800123L, 123L, 1580725840321L, 1725453296789L};
    try (PrintWriter out = new PrintWriter(args[0], StandardCharsets.UTF_8)) {
      out.println("# ICU4J locale styles and skeletons; Gregorian calendar, proleptic fields");
      for (String name : new String[] {"en", "de", "fr", "ja"}) {
        ULocale locale = ULocale.forLanguageTag(name).setKeywordValue("calendar", "gregorian");
        for (long epoch : samples) for (String zone : new String[] {"UTC", "America/New_York", "Europe/Paris", "Europe/Dublin"}) {
          for (String kind : new String[] {"PlainDate", "PlainTime", "PlainDateTime", "PlainYearMonth", "PlainMonthDay", "Instant", "ZonedDateTime"}) {
            int variants = kind.equals("PlainDate") || kind.equals("Instant") ? 3 : kind.equals("PlainTime") ? 2 : 1;
            for (int variant = 0; variant < variants; variant++) {
              String options;
              DateFormat format;
              switch (kind) {
                case "PlainDate" -> {
                  int[] styles = {DateFormat.FULL, DateFormat.LONG, DateFormat.SHORT};
                  String[] names = {"full", "long", "short"};
                  format = DateFormat.getDateInstance(styles[variant], locale);
                  options = "\"dateStyle\":\"" + names[variant] + "\"";
                }
                case "PlainTime" -> {
                  format = DateFormat.getTimeInstance(variant == 0 ? DateFormat.MEDIUM : DateFormat.SHORT, locale);
                  options = "\"timeStyle\":\"" + (variant == 0 ? "medium" : "short") + "\"";
                }
                case "PlainDateTime" -> {
                  format = DateFormat.getDateTimeInstance(DateFormat.MEDIUM, DateFormat.MEDIUM, locale);
                  options = "\"dateStyle\":\"medium\",\"timeStyle\":\"medium\"";
                }
                case "PlainYearMonth", "PlainMonthDay" -> {
                  boolean year = kind.equals("PlainYearMonth");
                  format = new SimpleDateFormat(DateTimePatternGenerator.getInstance(locale).getBestPattern(year ? "yMMMM" : "MMMMd"), locale);
                  options = year ? "\"year\":\"numeric\",\"month\":\"long\"" : "\"month\":\"long\",\"day\":\"numeric\"";
                }
                case "Instant" -> {
                  if (variant == 0) {
                    format = DateFormat.getDateTimeInstance(DateFormat.FULL, DateFormat.LONG, locale);
                    options = "\"dateStyle\":\"full\",\"timeStyle\":\"long\"";
                  } else {
                    DateTimePatternGenerator generator = DateTimePatternGenerator.getInstance(locale);
                    // Honor component widths before applying the locale's zone append pattern.
                    String clock = generator.getBestPattern("HHmmss", DateTimePatternGenerator.MATCH_ALL_FIELDS_LENGTH);
                    String pattern = generator.getAppendItemFormat(DateTimePatternGenerator.ZONE)
                        .replace("{0}", clock).replace("{1}", variant == 1 ? "OOOO" : "O");
                    format = new SimpleDateFormat(pattern, locale);
                    options = "\"hour\":\"2-digit\",\"minute\":\"2-digit\",\"second\":\"2-digit\",\"hourCycle\":\"h23\",\"timeZoneName\":\"" + (variant == 1 ? "longOffset" : "shortOffset") + "\"";
                  }
                }
                default -> {
                  format = DateFormat.getDateTimeInstance(DateFormat.LONG, DateFormat.SHORT, locale);
                  options = "\"dateStyle\":\"long\",\"timeStyle\":\"short\"";
                }
              }
              boolean zoned = kind.equals("Instant") || kind.equals("ZonedDateTime");
              TimeZone timeZone = TimeZone.getTimeZone(zoned ? zone : "UTC", TimeZone.TIMEZONE_ICU);
              GregorianCalendar calendar = new GregorianCalendar(timeZone, locale);
              calendar.setGregorianChange(new Date(Long.MIN_VALUE));
              format.setCalendar(calendar);
              if (!kind.equals("ZonedDateTime")) options += ",\"timeZone\":\"" + zone + "\"";
              options = "{\"calendar\":\"gregory\"," + options + "}";
              String expected = format.format(new Date(epoch));
              boolean missingMetaZone = kind.equals("Instant") && variant == 0 && !zone.equals("UTC")
                  && com.ibm.icu.text.TimeZoneNames.getInstance(locale).getMetaZoneID(zone, epoch) == null;
              out.println(kind + "\t" + name + "\t" + zone + "\t" + epoch + "\t" + options + "\t" + expected + "\t" + missingMetaZone);
            }
          }
        }
      }
    }
  }
}
