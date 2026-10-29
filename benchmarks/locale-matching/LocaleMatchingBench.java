import com.ibm.icu.util.LocaleMatcher;
import com.ibm.icu.util.ULocale;
import com.ibm.icu.util.VersionInfo;
import java.nio.file.*;
import java.util.*;

public class LocaleMatchingBench {
    static volatile ULocale sink;
    static volatile LocaleMatcher matcherSink;
    static volatile List<ULocale> requests;
    static List<ULocale> parse(String tags) {
        List<ULocale> result = new ArrayList<>();
        for (String tag : tags.split(","))
            result.add(ULocale.createCanonical(ULocale.forLanguageTag(tag)));
        return result;
    }
    static LocaleMatcher build(String supported) {
        return LocaleMatcher.builder()
            .setSupportedULocales(parse(supported))
            .setDefaultULocale(ULocale.ENGLISH)
            .build();
    }
    static ULocale work(LocaleMatcher matcher, boolean prepared, boolean cycle, String tags,
        String[] individual, int i) {
        if (prepared && cycle)
            return matcher.getBestMatch(requests.get(i % requests.size()));
        return matcher.getBestMatch(
            prepared ? requests : parse(cycle ? individual[i % individual.length] : tags));
    }
    public static void main(String[] args) throws Exception {
        List<String[]> rows = new ArrayList<>();
        Map<String, String> sets = new LinkedHashMap<>();
        for (String line : Files.readAllLines(Paths.get(args[0]))) {
            String[] fields = line.split("\t");
            if (fields[0].equals("support"))
                sets.put(fields[1], fields[2]);
            else
                rows.add(fields);
        }
        if (args.length > 1 && args[1].equals("--once")) {
            System.out.println(
                build(sets.get("full")).getBestMatch(ULocale.ENGLISH).toLanguageTag());
            return;
        }
        int count = args.length > 1 ? Integer.parseInt(args[1]) : 200_000;
        System.err.println("ICU4J " + VersionInfo.ICU_VERSION + "; Java "
            + System.getProperty("java.version") + "; iterations " + count);
        for (Map.Entry<String, String> set : sets.entrySet()) {
            for (int i = 0; i < 1000; i++) matcherSink = build(set.getValue());
            long start = System.nanoTime();
            for (int i = 0; i < 100; i++) matcherSink = build(set.getValue());
            System.out.printf(Locale.ROOT, "icu4j\tconstruct\t%s\t%.2f\t-%n", set.getKey(),
                (System.nanoTime() - start) / 100.0);
        }
        for (String[] row : rows) {
            LocaleMatcher matcher = build(sets.get(row[2]));
            requests = parse(row[3]);
            String expected = matcher.getBestMatch(requests).toLanguageTag();
            boolean cycle = row[0].equals("cycle");
            int iterations = cycle ? Math.max(1000, count / 20) : count;
            String[] individual = row[3].split(",");
            for (boolean prepared : new boolean[] {true, false}) {
                for (int i = 0; i < iterations; i++)
                    sink = work(matcher, prepared, cycle, row[3], individual, i);
                long start = System.nanoTime();
                for (int i = 0; i < iterations; i++)
                    sink = work(matcher, prepared, cycle, row[3], individual, i);
                System.out.printf(Locale.ROOT, "icu4j\t%s\t%s\t%.2f\t%s%n",
                    prepared ? "prepared" : "strings", row[1],
                    (System.nanoTime() - start) / (double) iterations, expected);
            }
        }
    }
}
