import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.FormatFlagsConversionMismatchException;
import java.util.HexFormat;
import java.util.IllegalFormatException;
import java.util.Locale;

public final class FormatterOracle {
  private static final StringBuilder output = new StringBuilder();

  private static void syntax(String format) {
    boolean valid;
    try {
      String unused = String.format(Locale.ROOT, format, (Object[]) null);
      valid = true;
    } catch (FormatFlagsConversionMismatchException error) {
      // Only Formattable arguments accept this otherwise valid conversion.
      valid = error.getConversion() == 's' && error.getFlags().equals("#");
    } catch (IllegalFormatException error) {
      valid = false;
    }
    output.append("syntax\t")
        .append(hex(format)).append('\t').append(valid).append('\n');
  }

  private static String hex(String value) {
    return HexFormat.of().formatHex(value.getBytes(StandardCharsets.UTF_8));
  }

  private static void arguments(String format) {
    String rendered = String.format(Locale.ROOT, format, "A", "B", "C", "D");
    output.append("arguments\t")
        .append(hex(format)).append('\t')
        .append(hex(rendered.replace("\r\n", "\n"))).append('\n');
  }

  public static void main(String[] arguments) throws IOException {
    String[] conversions = {
      "b", "B", "h", "H", "s", "S",
      "c", "C", "d", "o", "x", "X",
      "e", "E", "f", "g", "G", "a",
      "A", "%", "n", "D", "F", "i",
      "u", "q", "t", "T", "tq", "tY",
      "TY"
    };
    String[] flags = {
      "", "-", "#", "+", " ", "0",
      ",", "(", "<", "--", "00", "<<",
      "+ ", "-0", "#0", "+(", "-#", "_"
    };
    for (String conversion : conversions) {
      for (String flag : flags) {
        for (String width : new String[] {"", "8"}) {
          for (String precision : new String[] {"", ".0", ".2"}) {
            syntax("%" + flag + width + precision + conversion);
            syntax("%s %2$" + flag + width + precision + conversion);
          }
        }
      }
    }
    for (char suffix : "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789".toCharArray()) {
      syntax("%t" + suffix);
      syntax("%T" + suffix);
    }
    for (String format : new String[] {
      "",
      "literal 😀",
      "%",
      "%é",
      "%1$",
      "%0$s",
      "%2147483648$s",
      "%2147483648d",
      "%.2147483648f",
      "%.s",
      "%1$.s",
      "%1$s %<s",
      "%1$% %<s",
      "%1$n %<s",
      "%s %% %<s",
      "%s %n %<s",
      "%s %0$<s",
      "%0001$s",
      "%1$%",
      "%1$n"
    }) {
      syntax(format);
    }
    for (String format : new String[] {
      "%s %s",
      "%2$s %s %<s %s",
      "%4$s %1$s %s %<s %s",
      "%s %% %<s %n %s",
      "%s %2$<s",
      "%1$% %s",
      "%1$n%s",
      "%2$s %2$% %<s",
      "%2$s %2$n %<s"
    }) {
      arguments(format);
    }
    Files.writeString(Path.of(arguments[0]), output, StandardCharsets.UTF_8);
  }
}
