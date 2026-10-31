import com.ibm.icu.text.*;
import com.ibm.icu.util.*;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Date;
import java.util.LinkedHashSet;

public final class IntlDateTimeFormatOracle {
    record Profile(String options, String skeleton, int dateStyle, int timeStyle) {
        Profile(String options, String skeleton) { this(options, skeleton, -1, -1); }
    }
    static final Profile[] PROFILES = {
        new Profile("\"year\":\"numeric\",\"month\":\"numeric\",\"day\":\"numeric\"", "yMd"),
        new Profile("\"weekday\":\"long\",\"year\":\"numeric\",\"month\":\"long\",\"day\":\"numeric\"", "yMMMMEEEEd"),
        new Profile("\"year\":\"numeric\",\"month\":\"short\",\"day\":\"numeric\",\"hour\":\"numeric\",\"minute\":\"2-digit\",\"second\":\"2-digit\"", "yMMMdjmmss"),
        new Profile("\"hour\":\"2-digit\",\"minute\":\"2-digit\",\"second\":\"2-digit\",\"hourCycle\":\"h23\"", "HHmmss"),
        new Profile("\"hour\":\"2-digit\",\"minute\":\"2-digit\",\"second\":\"2-digit\",\"fractionalSecondDigits\":3,\"hourCycle\":\"h23\"", "HHmmssSSS"),
        new Profile("\"hour\":\"numeric\",\"minute\":\"2-digit\",\"timeZoneName\":\"long\"", "jmmzzzz"),
        new Profile("\"month\":\"short\",\"day\":\"numeric\",\"hour\":\"numeric\",\"minute\":\"2-digit\",\"timeZoneName\":\"shortGeneric\"", "MMMdjmmv"),
        new Profile("\"hour\":\"numeric\",\"dayPeriod\":\"long\",\"hourCycle\":\"h12\"", "hBBBB"),
        new Profile("\"dateStyle\":\"full\"", "", DateFormat.FULL, -1),
        new Profile("\"dateStyle\":\"medium\",\"timeStyle\":\"short\"", "", DateFormat.MEDIUM, DateFormat.SHORT),
        new Profile("\"timeStyle\":\"long\"", "", -1, DateFormat.LONG),
    };
    static final long[] DATES = {0, 1705313700123L, 1709251199999L, 1710053999000L, 1710054000000L, 1730613599000L, 1730613600000L};
    static final long[][] RANGES = {{1705313700123L,1705313700123L},{1705313700123L,1705319100456L},{1705313700123L,1705488300789L},{1710053999000L,1710054000000L},{1730613599000L,1730613600000L}};
    static String json(String s) { return "\"" + s.replace("\\", "\\\\").replace("\"", "\\\"").replace("\t", "\\t").replace("\n", "\\n").replace("\r", "\\r") + "\""; }
    static String kind(Object field) {
        if (field == DateFormat.Field.ERA) return "era";
        if (field == DateFormat.Field.YEAR || field == DateFormat.Field.EXTENDED_YEAR || field == DateFormat.Field.YEAR_WOY) return "year";
        if (field == DateFormat.Field.RELATED_YEAR) return "relatedYear";
        if (field == DateFormat.Field.MONTH) return "month";
        if (field == DateFormat.Field.DAY_OF_MONTH) return "day";
        if (field == DateFormat.Field.DAY_OF_WEEK || field == DateFormat.Field.DOW_LOCAL) return "weekday";
        if (field == DateFormat.Field.AM_PM || field == DateFormat.Field.AM_PM_MIDNIGHT_NOON || field == DateFormat.Field.FLEXIBLE_DAY_PERIOD) return "dayPeriod";
        if (field == DateFormat.Field.HOUR0 || field == DateFormat.Field.HOUR1 || field == DateFormat.Field.HOUR_OF_DAY0 || field == DateFormat.Field.HOUR_OF_DAY1) return "hour";
        if (field == DateFormat.Field.MINUTE) return "minute";
        if (field == DateFormat.Field.SECOND) return "second";
        if (field == DateFormat.Field.MILLISECOND) return "fractionalSecond";
        if (field == DateFormat.Field.TIME_ZONE) return "timeZoneName";
        if (field == DateFormat.Field.TIME_SEPARATOR) return "literal";
        throw new AssertionError("Unmapped ICU date field " + field);
    }
    static String parts(String text, String[] kinds, String[] sources, boolean range, boolean cyclic) {
        List<String> result = new ArrayList<>();
        for (int i = 0; i < text.length();) {
            int j = i + 1;
            while (j < text.length() && kinds[i].equals(kinds[j]) && sources[i].equals(sources[j])) j++;
            String type = cyclic && kinds[i].equals("year") ? "yearName" : kinds[i];
            result.add("{\"type\":" + json(type) + ",\"value\":" + json(text.substring(i,j)) + (range ? ",\"source\":" + json(sources[i]) : "") + "}");
            i = j;
        }
        return "[" + String.join(",", result) + "]";
    }
    static String singleParts(SimpleDateFormat formatter, long milliseconds, boolean cyclic) {
        var iterator = formatter.formatToCharacterIterator(new Date(milliseconds));
        String text = formatter.format(new Date(milliseconds));
        String[] kinds = new String[text.length()], sources = new String[text.length()];
        Arrays.fill(kinds, "literal"); Arrays.fill(sources, "shared");
        for (int i = iterator.getBeginIndex(); i < iterator.getEndIndex(); i++) {
            iterator.setIndex(i);
            for (var field : iterator.getAttributes().keySet()) kinds[i] = kind(field);
        }
        return parts(text, kinds, sources, false, cyclic);
    }
    static String rangeParts(DateIntervalFormat.FormattedDateInterval value, boolean cyclic) {
        String text = value.toString();
        String[] kinds = new String[text.length()], sources = new String[text.length()];
        Arrays.fill(kinds, "literal"); Arrays.fill(sources, "shared");
        var position = new ConstrainedFieldPosition();
        while (value.nextPosition(position)) {
            if (position.getField() == DateIntervalFormat.SpanField.DATE_INTERVAL_SPAN) {
                Arrays.fill(sources, position.getStart(), position.getLimit(), position.getFieldValue().equals(0) ? "startRange" : "endRange");
            } else {
                Arrays.fill(kinds, position.getStart(), position.getLimit(), kind(position.getField()));
            }
        }
        return parts(text, kinds, sources, true, cyclic);
    }
    static boolean cyclic(String pattern) {
        boolean quoted = false;
        for (int i = 0; i < pattern.length(); i++) {
            char c = pattern.charAt(i);
            if (c == '\'') {
                if (i + 1 < pattern.length() && pattern.charAt(i+1) == '\'') i++;
                else quoted = !quoted;
            } else if (!quoted && c == 'U') return true;
        }
        return false;
    }
    static void rows(List<String> rows, String locale, String calendar, String numbers, String zone, Profile profile, boolean ranges, long[] dates) {
        ULocale icuLocale = new ULocale.Builder().setLanguageTag(locale).setUnicodeLocaleKeyword("ca",calendar).setUnicodeLocaleKeyword("nu",numbers).build();
        DateTimePatternGenerator generator = DateTimePatternGenerator.getInstance(icuLocale);
        SimpleDateFormat formatter = profile.dateStyle >= 0 && profile.timeStyle >= 0 ? (SimpleDateFormat)DateFormat.getDateTimeInstance(profile.dateStyle, profile.timeStyle, icuLocale)
            : profile.dateStyle >= 0 ? (SimpleDateFormat)DateFormat.getDateInstance(profile.dateStyle, icuLocale)
            : profile.timeStyle >= 0 ? (SimpleDateFormat)DateFormat.getTimeInstance(profile.timeStyle, icuLocale)
            : new SimpleDateFormat(generator.getBestPattern(profile.skeleton, DateTimePatternGenerator.MATCH_ALL_FIELDS_LENGTH), icuLocale);
        formatter.setTimeZone(TimeZone.getTimeZone(zone));
        if (formatter.getCalendar().getType().equals("gregorian")) ((GregorianCalendar)formatter.getCalendar()).setGregorianChange(new Date(Long.MIN_VALUE));
        String skeleton = generator.getSkeleton(formatter.toPattern());
        boolean cyclic = cyclic(formatter.toPattern());
        String options = "{\"calendar\":" + json(calendar) + ",\"numberingSystem\":" + json(numbers) + ",\"timeZone\":" + json(zone) + "," + profile.options + "}";
        for (long start : dates) rows.add(String.join("\t", locale, options, icuLocale.toLanguageTag(), skeleton, Long.toString(start), "", formatter.format(new Date(start)), singleParts(formatter,start,cyclic)));
        if (!ranges) return;
        DateIntervalFormat interval = DateIntervalFormat.getInstance(skeleton,icuLocale);
        interval.setTimeZone(TimeZone.getTimeZone(zone));
        for (long[] pair : RANGES) {
            var value = interval.formatToValue(new DateInterval(pair[0],pair[1]));
            rows.add(String.join("\t", locale, options, icuLocale.toLanguageTag(), skeleton, Long.toString(pair[0]), Long.toString(pair[1]), value.toString(), rangeParts(value,cyclic)));
        }
    }
    public static void main(String[] args) throws Exception {
        if (VersionInfo.ICU_VERSION.getMajor() != 79) throw new AssertionError("ICU 79 required");
        List<String> rows = new ArrayList<>();
        rows.add("locale\toptions\ticuLocale\tskeleton\tstart\tend\ttext\tparts");
        for (String locale : new String[]{"en","en-GB","fr","de","es","ru","ar","he","fa","hi","bn","ja","zh-Hans","ko","th","pl","fi"})
            for (String zone : new String[]{"UTC","America/New_York","Europe/Paris","Asia/Kathmandu","Pacific/Auckland"})
                for (Profile profile : PROFILES) rows(rows,locale,"gregory","latn",zone,profile,true,DATES);
        for (String calendar : new String[]{"buddhist","coptic","ethiopic","ethioaa","roc","japanese","indian","islamic-civil","islamic-tbla","persian","hebrew","islamic-umalqura","chinese","dangi","iso8601"})
            for (String locale : new String[]{"en","ja","ar","he"})
                for (int p : new int[]{0,1}) rows(rows,locale,calendar,"latn","Asia/Tokyo",PROFILES[p],true,new long[]{1556636399999L,1556636400000L,1705313700123L});
        for (String numbers : new String[]{"arab","arabext","beng","deva","fullwide","adlm"})
            for (int p : new int[]{0,3,4}) rows(rows,"en","gregory",numbers,"UTC",PROFILES[p],true,DATES);
        rows(rows,"en","gregory","latn","UTC",PROFILES[1],false,new long[]{-8640000000000000L,-62167219200000L,8640000000000000L});
        rows = new ArrayList<>(new LinkedHashSet<>(rows));
        if (rows.size() < 12000) throw new AssertionError("Incomplete DateTimeFormat matrix " + rows.size());
        for (String row : rows) if (!StandardCharsets.UTF_8.newEncoder().canEncode(row)) throw new AssertionError("Invalid ICU UTF-16");
        Files.write(Path.of(args[0]), rows, StandardCharsets.UTF_8);
        System.out.println((rows.size()-1) + " ICU 79 DateTimeFormat fixtures");
    }
}
