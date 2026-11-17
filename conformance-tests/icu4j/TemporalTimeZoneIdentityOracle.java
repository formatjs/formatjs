import com.ibm.icu.util.TimeZone;
import java.io.PrintWriter;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;

public final class TemporalTimeZoneIdentityOracle {
  public static void main(String[] args) throws Exception {
    try (PrintWriter out = new PrintWriter(args[0], StandardCharsets.UTF_8)) {
      boolean javascript = args.length > 1 && args[1].equals("--js");
      if (javascript) out.println("var __temporalTimezoneIdentityOracle = [");
      if (!javascript) out.println("# ICU tzdb " + TimeZone.getTZDataVersion());
      String[] identifiers = TimeZone.getAvailableIDs();
      Arrays.sort(identifiers);
      for (String id : identifiers) {
        String primary = TimeZone.getIanaID(id);
        if (primary == null) throw new IllegalStateException("Unknown ICU zone: " + id);
        if (primary.equals("Etc/UTC") || primary.equals("Etc/GMT") || primary.equals("GMT")) primary = "UTC";
        row(out, javascript, id + "\t" + primary);
      }
      if (javascript) out.println("]; ");
    }
  }
  private static void row(PrintWriter out, boolean javascript, String value) {
    out.println(javascript ? "\"" + value.replace("\\", "\\\\").replace("\"", "\\\"").replace("\t", "\\t") + "\"," : value);
  }

}
