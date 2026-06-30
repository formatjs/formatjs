import com.ibm.icu.text.MessageFormat;
import com.ibm.icu.util.ULocale;
import java.text.FieldPosition;

public class MessageFormatEscapingConformanceTest {
    public static void main(String[] args) {
        assertFormatsTo("Use '}}' to close", "Use }} to close");
        assertFormatsTo("Use '}''}' to close", "Use }'} to close");
    }

    private static void assertFormatsTo(String pattern, String expected) {
        MessageFormat formatter = new MessageFormat(pattern, ULocale.ENGLISH);
        String actual = formatter
            .format(new Object[0], new StringBuffer(), new FieldPosition(0))
            .toString();

        if (!actual.equals(expected)) {
            throw new AssertionError(
                "Expected pattern \""
                    + pattern
                    + "\" to format as \""
                    + expected
                    + "\", got \""
                    + actual
                    + "\""
            );
        }
    }
}
