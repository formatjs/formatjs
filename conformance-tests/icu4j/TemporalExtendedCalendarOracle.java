import com.ibm.icu.util.Calendar;
import java.io.PrintWriter;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.nio.file.Files;
import java.nio.file.Path;

/** Forward ICU fields at extended plain bounds; same era policy as calendar controls. */
public final class TemporalExtendedCalendarOracle {
  private static final long LIMIT = 8640000000000000L;
  private static final long DAY = 86400000L;
  public static void main(String[] args) throws Exception {
    String[] ids = {"buddhist", "japanese", "roc", "coptic", "ethiopic", "ethioaa", "indian", "islamic-civil", "islamic-tbla", "islamic-umalqura"};
    long[] samples = {-LIMIT-DAY+1, -LIMIT-1, LIMIT+1, LIMIT+DAY-1,
      LocalDate.of(-271821,4,1).toEpochDay()*DAY, LocalDate.of(275760,9,30).toEpochDay()*DAY};
    try (PrintWriter out = new PrintWriter(args[0], StandardCharsets.UTF_8)) {
      out.println("# ICU4J79.1 forward fields; normalized Temporal era policy; Hebrew/Persian and astronomical calendars retain their existing oracle limits");
      for (String id : ids) {
        Calendar calendar = TemporalArithmeticCalendarOracle.calendar(id);
        for (int index=0; index<samples.length; index++) {
          long ms=samples[index], epoch=Math.floorDiv(ms,DAY);
          LocalDate iso=LocalDate.ofEpochDay(epoch);
          calendar.setTimeInMillis(ms);
          int year=TemporalArithmeticCalendarOracle.year(calendar,id);
          String[] era=TemporalArithmeticCalendarOracle.era(id,calendar,epoch,year);
          out.println((index<4?"datetime":"yearmonth")+"\t"+id+"\t"+ms+"\t"+
            iso.getYear()+"\t"+iso.getMonthValue()+"\t"+iso.getDayOfMonth()+"\t"+
            calendar.get(Calendar.HOUR_OF_DAY)+"\t"+calendar.get(Calendar.MINUTE)+"\t"+calendar.get(Calendar.SECOND)+"\t"+calendar.get(Calendar.MILLISECOND)+"\t"+
            year+"\t"+(calendar.get(Calendar.MONTH)+1)+"\t"+calendar.get(Calendar.DATE)+"\t"+era[0]+"\t"+era[1]+"\t"+iso.getDayOfWeek().getValue());
        }
      }
    }
    if (args.length>1) {
      String value=Files.readString(Path.of(args[0]),StandardCharsets.UTF_8);
      String literal=value.replace("\\","\\\\").replace("\"","\\\"").replace("\r","\\r").replace("\n","\\n").replace("\t","\\t");
      Files.writeString(Path.of(args[1]),"globalThis.__formatjsExtendedCalendarOracle = \""+literal+"\";\n",StandardCharsets.UTF_8);
    }
  }
}
