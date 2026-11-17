import com.ibm.icu.math.BigDecimal;
import com.ibm.icu.util.Calendar;
import com.ibm.icu.util.GregorianCalendar;
import com.ibm.icu.util.TimeZone;
import java.io.PrintWriter;
import java.nio.charset.StandardCharsets;
import java.util.Date;

/** Independent Gregorian month arithmetic and calendar-span decimal rounding. */
public final class TemporalShortDateOracle {
  private static final GregorianCalendar calendar = new GregorianCalendar(TimeZone.getTimeZone("UTC"));
  private static long firstDay(int year, int month) {
    calendar.clear(); calendar.set(Calendar.EXTENDED_YEAR,year); calendar.set(Calendar.MONTH,month-1); calendar.set(Calendar.DATE,1);
    return Math.floorDiv(calendar.getTimeInMillis(),86400000L);
  }
  private static long serialDay(long serial) {return firstDay((int)Math.floorDiv(serial,12), (int)Math.floorMod(serial,12)+1);}
  public static void main(String[] args) throws Exception {
    calendar.setGregorianChange(new Date(Long.MIN_VALUE));
    try (PrintWriter out = new PrintWriter(args[0],StandardCharsets.UTF_8)) {
      boolean javascript = args.length > 1 && args[1].equals("--js");
      if (javascript) out.println("var __temporalShortDateOracle = [");
      else out.println("# ICU4J 79.1 Gregorian and BigDecimal; kind-specific arithmetic, reference-date, metadata and rounding cases");
      for (int year : new int[] {-271821,-100000,-400,-1,0,1,1900,1972,2000,2020,275760}) for (int month=1;month<=12;month++) {
        if ((year == -271821 && month < 4) || (year == 275760 && month > 9)) continue;
        long origin=firstDay(year,month); int length=calendar.getActualMaximum(Calendar.DATE);
        for (int reference : new int[] {1,length}) for (int[] duration : new int[][] {{0,0},{1,1},{-1,-1},{4,13},{-4,-13}}) {
          firstDay(year,month); calendar.add(Calendar.YEAR,duration[0]); calendar.add(Calendar.MONTH,duration[1]);
          long target=Math.floorDiv(calendar.getTimeInMillis(),86400000L);
          row(out, javascript, "ym\t"+year+"\t"+month+"\t"+reference+"\t"+duration[0]+"\t"+duration[1]+"\t"+calendar.get(Calendar.EXTENDED_YEAR)+"\t"+(calendar.get(Calendar.MONTH)+1)+"\t"+calendar.getActualMaximum(Calendar.DATE)+"\t"+calendar.getActualMaximum(Calendar.DAY_OF_YEAR)+"\t"+(origin >= -100000001 && origin <= 100000000 && target >= -100000001 && target <= 100000000));
        }
      }
      for (int month=1;month<=12;month++) {
        firstDay(1972,month);int length=calendar.getActualMaximum(Calendar.DATE);
        for (int day : new int[] {1,length}) for (int reference : new int[] {1972,2000}) for (int year : new int[] {-271821,-1,0,1900,1972,2000,275760}) {
          firstDay(year,month);int targetDay=Math.min(day,calendar.getActualMaximum(Calendar.DATE)); calendar.set(Calendar.DATE,targetDay);
          long target=Math.floorDiv(calendar.getTimeInMillis(),86400000L);
          row(out, javascript, "md\t"+month+"\t"+day+"\t"+reference+"\t"+year+"\t"+targetDay+"\t"+(target >= -100000001 && target <= 100000000));
        }
      }
      String[] modes={"ceil","floor","expand","trunc","halfCeil","halfFloor","halfExpand","halfTrunc","halfEven"};
      for (int[] pair : new int[][] {{2021,1,2021,2},{2020,1,2020,7},{2021,1,2021,7},{2021,3,2020,2},{2000,2,2004,11},{2004,11,2000,2}}) {
        long start=pair[0]*12L+pair[1]-1, end=pair[2]*12L+pair[3]-1, delta=end-start, sign=delta<0?-1:1;
        for (String unit : new String[] {"month","year"}) for (int increment : new int[] {1,2,3,5}) {
          long quantum=increment*(unit.equals("year")?12:1), q=delta/quantum;
          long low=serialDay(start+q*quantum),high=serialDay(start+(q+sign)*quantum),target=serialDay(end),span=(high-low)*sign;
          for (int mode=0;mode<modes.length;mode++) {
            long[] expected=new long[2];
            for (int operation=0;operation<2;operation++) {
              int direction=operation==0?1:-1; long value=(q*span+(target-low))*direction;
              int[] rounding={BigDecimal.ROUND_CEILING,BigDecimal.ROUND_FLOOR,BigDecimal.ROUND_UP,BigDecimal.ROUND_DOWN,value<0?BigDecimal.ROUND_HALF_DOWN:BigDecimal.ROUND_HALF_UP,value<0?BigDecimal.ROUND_HALF_UP:BigDecimal.ROUND_HALF_DOWN,BigDecimal.ROUND_HALF_UP,BigDecimal.ROUND_HALF_DOWN,BigDecimal.ROUND_HALF_EVEN};
              expected[operation]=new BigDecimal(value).divide(new BigDecimal(span),0,rounding[mode]).longValueExact()*quantum;
            }
            row(out, javascript, "round\t"+pair[0]+"\t"+pair[1]+"\t"+pair[2]+"\t"+pair[3]+"\t"+unit+"\t"+increment+"\t"+modes[mode]+"\t"+expected[0]+"\t"+expected[1]);
          }
        }
      }
      if (javascript) out.println("];");
    }
  }
  private static void row(PrintWriter out, boolean javascript, String value) {
    out.println(javascript ? "\"" + value.replace("\t", "\\t") + "\"," : value);
  }
}
