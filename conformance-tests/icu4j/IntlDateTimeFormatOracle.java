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
import java.util.Map;
import java.util.LinkedHashMap;

public final class IntlDateTimeFormatOracle {
    record Profile(String options, String skeleton, int dateStyle, int timeStyle, String hourCycle) {
        Profile(String options, String skeleton) { this(options, skeleton, -1, -1, null); }
        Profile(String options, String skeleton, String hourCycle) { this(options, skeleton, -1, -1, hourCycle); }
        Profile(String options, String skeleton, int dateStyle, int timeStyle) { this(options, skeleton, dateStyle, timeStyle, null); }
    }
    static final Profile[] PROFILES = {
        new Profile("\"year\":\"numeric\",\"month\":\"numeric\",\"day\":\"numeric\"", "yMd"),
        new Profile("\"weekday\":\"long\",\"year\":\"numeric\",\"month\":\"long\",\"day\":\"numeric\"", "yMMMMEEEEd"),
        new Profile("\"year\":\"numeric\",\"month\":\"short\",\"day\":\"numeric\",\"hour\":\"numeric\",\"minute\":\"2-digit\",\"second\":\"2-digit\"", "yMMMdjmmss"),
        new Profile("\"hour\":\"2-digit\",\"minute\":\"2-digit\",\"second\":\"2-digit\",\"hourCycle\":\"h23\"", "HHmmss", "h23"),
        new Profile("\"hour\":\"2-digit\",\"minute\":\"2-digit\",\"second\":\"2-digit\",\"fractionalSecondDigits\":3,\"hourCycle\":\"h23\"", "HHmmssSSS", "h23"),
        new Profile("\"hour\":\"numeric\",\"minute\":\"2-digit\",\"timeZoneName\":\"long\"", "jmmzzzz"),
        new Profile("\"month\":\"short\",\"day\":\"numeric\",\"hour\":\"numeric\",\"minute\":\"2-digit\",\"timeZoneName\":\"shortGeneric\"", "MMMdjmmv"),
        new Profile("\"hour\":\"numeric\",\"dayPeriod\":\"long\",\"hourCycle\":\"h12\"", "hBBBB", "h12"),
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
        return singleParts(formatter, milliseconds, cyclic, false);
    }
    static String singleParts(SimpleDateFormat formatter, long milliseconds, boolean cyclic, boolean range) {
        var iterator = formatter.formatToCharacterIterator(new Date(milliseconds));
        String text = formatter.format(new Date(milliseconds));
        String[] kinds = new String[text.length()], sources = new String[text.length()];
        Arrays.fill(kinds, "literal"); Arrays.fill(sources, "shared");
        for (int i = iterator.getBeginIndex(); i < iterator.getEndIndex(); i++) {
            iterator.setIndex(i);
            for (var field : iterator.getAttributes().keySet()) kinds[i] = kind(field);
        }
        return parts(text, kinds, sources, range, cyclic);
    }
    static Map<String, String> fieldValues(SimpleDateFormat formatter, long milliseconds) {
        var iterator = formatter.formatToCharacterIterator(new Date(milliseconds));
        Map<String, String> values = new LinkedHashMap<>();
        for (int i = iterator.getBeginIndex(); i < iterator.getEndIndex(); i++) {
            iterator.setIndex(i);
            for (var field : iterator.getAttributes().keySet()) {
                String type = kind(field);
                if (!type.equals("literal")) values.merge(type, Character.toString(iterator.current()), String::concat);
            }
        }
        return values;
    }
    static boolean relevantFieldsEqual(SimpleDateFormat formatter, long start, long end) {
        if (start == end) return true;
        var first = fieldValues(formatter, start);
        var second = fieldValues(formatter, end);
        first.remove("timeZoneName"); second.remove("timeZoneName");
        if (!first.equals(second)) return false;
        int last = first.keySet().stream().anyMatch(type -> List.of("hour", "minute", "second", "fractionalSecond", "dayPeriod", "day", "weekday").contains(type)) ? 3
            : first.containsKey("month") ? 2 : first.containsKey("year") || first.containsKey("relatedYear") || first.containsKey("yearName") ? 1 : 0;
        Calendar a = (Calendar)formatter.getCalendar().clone(), b = (Calendar)a.clone();
        a.setTimeInMillis(start); b.setTimeInMillis(end);
        int[] fields = {Calendar.ERA, Calendar.YEAR, Calendar.MONTH, Calendar.DATE};
        for (int i = 0; i <= last; i++) if (a.get(fields[i]) != b.get(fields[i])) return false;
        return true;
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
    static char hourSymbol(String cycle) {
        return switch (cycle) { case "h11" -> 'K'; case "h12" -> 'h'; case "h23" -> 'H'; case "h24" -> 'k'; default -> throw new AssertionError(cycle); };
    }
    static String hourPattern(String pattern, char symbol) {
        StringBuilder result = new StringBuilder();
        boolean quoted = false;
        for (int i = 0; i < pattern.length(); i++) {
            char c = pattern.charAt(i);
            if (c == '\'') {
                if (i + 1 < pattern.length() && pattern.charAt(i + 1) == '\'') { result.append("''"); i++; continue; }
                quoted = !quoted;
            }
            result.append(!quoted && "hHKk".indexOf(c) >= 0 ? symbol : c);
        }
        return result.toString();
    }
    static SimpleDateFormat[] fieldFormatters(String[] patterns, ULocale locale, String zone) {
        return Arrays.stream(patterns).map(pattern -> {
            var formatter = new SimpleDateFormat(pattern, locale);
            formatter.setTimeZone(TimeZone.getTimeZone(zone));
            return formatter;
        }).toArray(SimpleDateFormat[]::new);
    }
    static String fieldEvidence(SimpleDateFormat[] formatters, long start, long end, String field) {
        List<String> endpoints = new ArrayList<>();
        for (long time : new long[]{start, end}) {
            List<String> names = new ArrayList<>();
            for (var formatter : formatters) names.add(json(formatter.toPattern()) + ":" + json(fieldValues(formatter, time).get(field)));
            endpoints.add("{" + String.join(",", names) + "}");
        }
        return "{\"start\":" + endpoints.get(0) + ",\"end\":" + endpoints.get(1) + "}";
    }
    static long periodTime(SimpleDateFormat formatter, long time) {
        var fields = fieldValues(formatter, time);
        if (!fields.containsKey("hour")) return time;
        var calendar = (Calendar)formatter.getCalendar().clone();
        calendar.setTimeInMillis(time);
        if (!fields.containsKey("minute")) calendar.set(Calendar.MINUTE, 0);
        if (!fields.containsKey("second")) calendar.set(Calendar.SECOND, 0);
        if (!fields.containsKey("fractionalSecond")) calendar.set(Calendar.MILLISECOND, 0);
        return calendar.getTimeInMillis();
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
        rows(rows, locale, calendar, numbers, zone, profile, ranges, dates, RANGES);
    }
    static void rows(List<String> rows, String locale, String calendar, String numbers, String zone, Profile profile, boolean ranges, long[] dates, long[][] pairs) {
        ULocale.Builder localeBuilder = new ULocale.Builder().setLanguageTag(locale).setUnicodeLocaleKeyword("ca",calendar).setUnicodeLocaleKeyword("nu",numbers);
        if (profile.hourCycle != null) localeBuilder.setUnicodeLocaleKeyword("hc", profile.hourCycle);
        ULocale icuLocale = localeBuilder.build();
        DateTimePatternGenerator generator = DateTimePatternGenerator.getInstance(icuLocale);
        SimpleDateFormat formatter = profile.dateStyle >= 0 && profile.timeStyle >= 0 ? (SimpleDateFormat)DateFormat.getDateTimeInstance(profile.dateStyle, profile.timeStyle, icuLocale)
            : profile.dateStyle >= 0 ? (SimpleDateFormat)DateFormat.getDateInstance(profile.dateStyle, icuLocale)
            : profile.timeStyle >= 0 ? (SimpleDateFormat)DateFormat.getTimeInstance(profile.timeStyle, icuLocale)
            : new SimpleDateFormat(generator.getBestPattern(profile.skeleton, DateTimePatternGenerator.MATCH_ALL_FIELDS_LENGTH), icuLocale);
        formatter.setTimeZone(TimeZone.getTimeZone(zone));
        if (formatter.getCalendar().getType().equals("gregorian")) ((GregorianCalendar)formatter.getCalendar()).setGregorianChange(new Date(Long.MIN_VALUE));
        SimpleDateFormat rawFormatter = (SimpleDateFormat)formatter.clone();
        if (profile.hourCycle != null) formatter.applyPattern(hourPattern(formatter.toPattern(), hourSymbol(profile.hourCycle)));
        // ECMA-402 numeric years use the resolved NumberFormat, without ICU's jpanyear override.
        if (calendar.equals("japanese")) formatter.setNumberFormat(NumberFormat.getIntegerInstance(icuLocale));
        String skeleton = generator.getSkeleton(formatter.toPattern());
        boolean cyclic = cyclic(formatter.toPattern());
        String options = "{\"calendar\":" + json(calendar) + ",\"numberingSystem\":" + json(numbers) + ",\"timeZone\":" + json(zone) + "," + profile.options + "}";
        for (long start : dates) {
            String text = formatter.format(new Date(start)), parts = singleParts(formatter,start,cyclic);
            rows.add(String.join("\t", locale, options, icuLocale.toLanguageTag(), skeleton, Long.toString(start), "", text, parts, rawFormatter.format(new Date(start)), singleParts(rawFormatter,start,cyclic), "{}"));
        }
        if (!ranges) return;
        DateIntervalFormat interval = DateIntervalFormat.getInstance(skeleton,icuLocale);
        interval.setTimeZone(TimeZone.getTimeZone(zone));
        var displayFields = fieldValues(formatter, dates.length == 0 ? pairs[0][0] : dates[0]);
        var periods = displayFields.containsKey("dayPeriod")
            ? fieldFormatters(profile.options.contains("dayPeriod") ? new String[]{"B", "BBBB", "BBBBB"} : new String[]{"a"}, icuLocale, zone) : new SimpleDateFormat[0];
        var clocks = profile.hourCycle != null && displayFields.containsKey("hour")
            ? fieldFormatters(new String[]{"" + hourSymbol(profile.hourCycle), "" + hourSymbol(profile.hourCycle) + hourSymbol(profile.hourCycle)}, icuLocale, zone) : new SimpleDateFormat[0];
        var zones = displayFields.containsKey("timeZoneName")
            ? fieldFormatters(new String[]{"z", "zzzz", "v", "vvvv", "O", "OOOO"}, icuLocale, zone) : new SimpleDateFormat[0];
        for (long[] pair : pairs) {
            var value = interval.formatToValue(new DateInterval(pair[0],pair[1]));
            boolean collapsed = relevantFieldsEqual(formatter, pair[0], pair[1]);
            String rawParts = rangeParts(value,cyclic);
            rows.add(String.join("\t", locale, options, icuLocale.toLanguageTag(), skeleton, Long.toString(pair[0]), Long.toString(pair[1]),
                collapsed ? formatter.format(new Date(pair[0])) : value.toString(),
                collapsed ? singleParts(formatter,pair[0],cyclic,true) : rawParts,
                value.toString(), rawParts,
                "{" + String.join(",", Arrays.stream(new String[]{
                    periods.length == 0 ? null : "\"periods\":" + fieldEvidence(periods, periodTime(formatter, pair[0]), periodTime(formatter, pair[1]), "dayPeriod"),
                    zones.length == 0 ? null : "\"zones\":" + fieldEvidence(zones, pair[0], pair[1], "timeZoneName"),
                    clocks.length == 0 ? null : "\"clocks\":" + fieldEvidence(clocks, pair[0], pair[1], "hour")
                }).filter(java.util.Objects::nonNull).toList()) + "}"));
        }
    }
    public static void main(String[] args) throws Exception {
        if (VersionInfo.ICU_VERSION.getMajor() != 79) throw new AssertionError("ICU 79 required");
        List<String> rows = new ArrayList<>();
        rows.add("locale\toptions\ticuLocale\tskeleton\tstart\tend\ttext\tparts\trawText\trawParts\toracleFields");
        if (args.length == 1) {
            for (String locale : new String[]{"en","en-GB","fr","de","es","ru","ar","he","fa","hi","bn","ja","zh-Hans","ko","th","pl","fi"})
                for (String zone : new String[]{"UTC","America/New_York","Europe/Paris","Asia/Kathmandu","Pacific/Auckland"})
                    for (Profile profile : PROFILES) rows(rows,locale,"gregory","latn",zone,profile,true,DATES);
            for (String locale : new String[]{"en", "en-GB", "ru", "fa", "ja", "zh-Hans"}) {
                long midnight = 1705276800000L, noon = midnight + 43200000L;
                for (String cycle : new String[]{"h11", "h12", "h23", "h24"}) {
                    Profile clock = new Profile("\"hour\":\"2-digit\",\"minute\":\"2-digit\",\"hourCycle\":" + json(cycle), "" + hourSymbol(cycle) + hourSymbol(cycle) + "mm", cycle);
                    rows(rows, locale, "gregory", "latn", "UTC", clock, true,
                        new long[]{midnight, midnight + 60000L, noon, noon + 60000L},
                        new long[][]{{midnight, midnight + 3600000L}, {noon - 60000L, noon + 900000L}, {noon, noon + 3600000L}, {midnight + 86340000L, midnight + 86460000L}});
                }
            }
            for (String calendar : new String[]{"buddhist","coptic","ethiopic","ethioaa","roc","japanese","indian","islamic-civil","islamic-tbla","persian","hebrew","islamic-umalqura","chinese","dangi","iso8601"})
                for (String locale : new String[]{"en","ja","ar","he"})
                    for (int p : new int[]{0,1}) rows(rows,locale,calendar,"latn","Asia/Tokyo",PROFILES[p],true,new long[]{1556636399999L,1556636400000L,1705313700123L});
            for (String numbers : new String[]{"arab","arabext","beng","deva","fullwide","adlm"})
                for (int p : new int[]{0,3,4}) rows(rows,"en","gregory",numbers,"UTC",PROFILES[p],true,DATES);
            rows(rows,"en","gregory","latn","UTC",PROFILES[1],false,new long[]{-8640000000000000L,-62167219200000L,8640000000000000L});
        }
        long midnight = java.time.Instant.parse("2026-11-06T00:00:00Z").toEpochMilli();
        long[][] boundaries = new long[4][2];
        int[] hours = {5, 11, 17, 20};
        for (int i = 0; i < hours.length; i++) {
            boundaries[i][0] = midnight + hours[i] * 3600000L;
            boundaries[i][1] = midnight + (hours[i] + 1) * 3600000L + 900000;
        }
        for (String locale : new String[]{"en", "en-GB", "nl", "ru", "fa", "zh-Hans"})
            for (boolean withDate : new boolean[]{false, true})
                for (Profile time : new Profile[]{
                    new Profile("\"hour\":\"2-digit\",\"minute\":\"2-digit\",\"hour12\":false", "HHmm"),
                    new Profile("\"hour\":\"2-digit\",\"minute\":\"2-digit\",\"hour12\":true", "hhmm"),
                    new Profile("\"hour\":\"numeric\",\"minute\":\"2-digit\",\"hourCycle\":\"h12\",\"dayPeriod\":\"long\"", "hmmBBBB", "h12")
                }) {
                    Profile profile = withDate
                        ? new Profile("\"weekday\":\"short\",\"month\":\"short\",\"day\":\"numeric\"," + time.options, "MMMEd" + time.skeleton, time.hourCycle)
                        : time;
                    rows(rows, locale, "gregory", "latn", "UTC", profile, true, new long[]{}, boundaries);
                }
        rows(rows, "en-GB", "gregory", "latn", "Europe/Amsterdam",
            new Profile("\"weekday\":\"short\",\"month\":\"short\",\"day\":\"numeric\",\"hour\":\"2-digit\",\"minute\":\"2-digit\",\"hour12\":false", "MMMEdHHmm"),
            true, new long[]{}, new long[][]{{midnight + 19 * 3600000L, midnight + 20 * 3600000L + 900000}});
        if (args.length == 1) {
            String[][] dates = {
                {"2024-01-31T10:15:00Z", "2024-02-01T10:45:00Z"},
                {"2024-12-31T10:15:00Z", "2025-01-01T10:45:00Z"},
                {"2024-01-31T10:15:00Z", "2025-02-01T10:45:00Z"},
            };
            long[][] dateBoundaries = new long[dates.length][2];
            for (int i = 0; i < dates.length; i++) for (int j = 0; j < 2; j++) dateBoundaries[i][j] = java.time.Instant.parse(dates[i][j]).toEpochMilli();
            for (String locale : new String[]{"en", "en-GB", "nl", "ru", "fa", "zh-Hans"})
                for (int profile : new int[]{0, 1, 2, 3}) rows(rows, locale, "gregory", "latn", "UTC", PROFILES[profile], true, new long[]{}, dateBoundaries);
        }
        rows = new ArrayList<>(new LinkedHashSet<>(rows));
        if (rows.size() != (args.length == 1 ? 12809 : 146)) throw new AssertionError("Incomplete DateTimeFormat matrix " + rows.size());
        for (String row : rows) if (!StandardCharsets.UTF_8.newEncoder().canEncode(row)) throw new AssertionError("Invalid ICU UTF-16");
        Files.write(Path.of(args[0]), rows, StandardCharsets.UTF_8);
        System.out.println((rows.size()-1) + " ICU 79 DateTimeFormat fixtures");
    }
}
