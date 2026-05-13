import com.ibm.icu.text.Collator;
import com.ibm.icu.text.RuleBasedCollator;
import com.ibm.icu.util.ULocale;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.List;

public class IntlCollatorConformanceTest {
    private static final class TestCase {
        final String description;
        final String locale;
        final String sensitivity;
        final String numeric;
        final String caseFirst;
        final String ignorePunctuation;
        final String left;
        final String right;
        final int expected;

        TestCase(String line) {
            String[] parts = line.split("\t", -1);
            if (parts.length != 9) {
                throw new IllegalArgumentException("Invalid fixture row: " + line);
            }
            description = parts[0];
            locale = parts[1];
            sensitivity = parts[2];
            numeric = parts[3];
            caseFirst = parts[4];
            ignorePunctuation = parts[5];
            left = parts[6];
            right = parts[7];
            expected = Integer.parseInt(parts[8]);
        }
    }

    public static void main(String[] args) throws Exception {
        List<TestCase> cases = readCases();
        List<String> failures = new ArrayList<>();
        for (TestCase testCase : cases) {
            int actual = sign(
                collator(testCase).compare(testCase.left, testCase.right)
            );
            if (actual != testCase.expected) {
                failures.add(
                    testCase.description +
                    ": expected " +
                    testCase.expected +
                    ", got " +
                    actual
                );
            }
        }

        if (!failures.isEmpty()) {
            for (String failure : failures) {
                System.err.println(failure);
            }
            throw new AssertionError(failures.size() + " ICU4J collator checks failed");
        }
        System.out.println(cases.size() + " ICU4J collator conformance checks passed");
    }

    private static List<TestCase> readCases() throws IOException {
        String fixturePath = System.getenv("COLLATOR_CONFORMANCE_FIXTURES");
        if (fixturePath == null || fixturePath.isEmpty()) {
            throw new IllegalStateException("COLLATOR_CONFORMANCE_FIXTURES is required");
        }
        List<String> lines = Files.readAllLines(
            Paths.get(fixturePath),
            StandardCharsets.UTF_8
        );
        List<TestCase> cases = new ArrayList<>();
        for (int i = 1; i < lines.size(); i++) {
            String line = lines.get(i);
            if (!line.isEmpty()) {
                cases.add(new TestCase(line));
            }
        }
        return cases;
    }

    private static RuleBasedCollator collator(TestCase testCase) {
        RuleBasedCollator collator = (RuleBasedCollator) Collator.getInstance(
            ULocale.forLanguageTag(testCase.locale)
        );
        if (!testCase.sensitivity.equals("-")) {
            // ECMA-402 sensitivity maps onto UCA comparison levels. ICU4J's
            // case level is the closest reference behavior for sensitivity
            // "case": primary differences plus case, but not accents.
            // https://tc39.es/ecma402/#sec-properties-of-intl-collator-instances
            if (testCase.sensitivity.equals("case")) {
                collator.setStrength(Collator.PRIMARY);
                collator.setCaseLevel(true);
            } else {
                collator.setStrength(strength(testCase.sensitivity));
            }
        }
        if (!testCase.numeric.equals("-")) {
            // ECMA-402 numeric / Unicode kn=true is ICU numeric collation.
            // https://tc39.es/ecma402/#sec-initializecollator
            collator.setNumericCollation(Boolean.parseBoolean(testCase.numeric));
        }
        if (testCase.caseFirst.equals("upper")) {
            // ECMA-402 caseFirst / Unicode kf maps to ICU upper/lower first.
            // https://tc39.es/ecma402/#sec-initializecollator
            collator.setUpperCaseFirst(true);
        } else if (testCase.caseFirst.equals("lower")) {
            collator.setLowerCaseFirst(true);
        }
        if (testCase.ignorePunctuation.equals("true")) {
            // ECMA-402 ignorePunctuation corresponds to shifted alternate
            // handling for variable UCA elements in the ICU reference.
            // https://www.unicode.org/reports/tr10/#Variable_Weighting
            collator.setAlternateHandlingShifted(true);
        }
        return collator;
    }

    private static int strength(String sensitivity) {
        switch (sensitivity) {
            case "base":
                return Collator.PRIMARY;
            case "accent":
                return Collator.SECONDARY;
            case "variant":
                return Collator.TERTIARY;
            default:
                throw new IllegalArgumentException("Unsupported sensitivity: " + sensitivity);
        }
    }

    private static int sign(int value) {
        return value < 0 ? -1 : value > 0 ? 1 : 0;
    }
}
