import com.ibm.icu.util.Calendar;
import com.ibm.icu.util.GregorianCalendar;
import com.ibm.icu.util.TimeZone;
import java.io.PrintWriter;
import java.math.BigInteger;
import java.nio.charset.StandardCharsets;
import java.util.Date;

/** Proleptic ICU Gregorian arithmetic, with exact sub-millisecond clock carry. */
public final class TemporalDateArithmeticOracle {
  public static void main(String[] args) throws Exception {
    long day = 86400000000000L;
    GregorianCalendar calendar = new GregorianCalendar(TimeZone.getTimeZone("UTC"));
    calendar.setGregorianChange(new Date(Long.MIN_VALUE));
    calendar.setFirstDayOfWeek(Calendar.MONDAY);
    calendar.setMinimalDaysInFirstWeek(4);
    long[][] durations = {{0,0,0,0,1},{0,0,0,0,90000000000001L},{0,0,0,1,0},{0,1,0,0,0},{1,1,0,0,1},{4,13,2,365,1},{100,0,0,0,0}};
    long[] days = {-100000000,-719529,-719528,-25509,-25508,-1,0,11016,11017,11018,18292,18321,18686,99999999,100000000};
    try (PrintWriter out = new PrintWriter(args[0], StandardCharsets.UTF_8)) {
      boolean javascript = args.length > 1 && args[1].equals("--js");
      if (javascript) out.println("var __temporalDateArithmeticOracle = [");
      else out.println("# ICU4J 79.1 Gregorian; inputNs, years, months, weeks, days, timeNs, expectedNs, ISO fields, weekday, ordinal, ISO week/year");
      for (long epochDay : days) for (long clock : new long[] {0,1,day/2,day-1}) {
        for (long[] duration : durations) for (int sign : new int[] {-1,1}) {
          long time = clock + sign*duration[4];
          long carry = Math.floorDiv(time,day), remainder = Math.floorMod(time,day);
          calendar.setTimeInMillis(epochDay*86400000);
          int year = calendar.get(Calendar.EXTENDED_YEAR), month = calendar.get(Calendar.MONTH), date = calendar.get(Calendar.DATE);
          calendar.set(Calendar.DATE,1);
          calendar.set(Calendar.EXTENDED_YEAR,year+(int)(sign*duration[0]));
          calendar.set(Calendar.MONTH,month+(int)(sign*duration[1]));
          calendar.set(Calendar.DATE,Math.min(date,calendar.getActualMaximum(Calendar.DATE)));
          calendar.add(Calendar.DATE,(int)(sign*(duration[2]*7+duration[3])+carry));
          BigInteger expected = BigInteger.valueOf(calendar.getTimeInMillis()).multiply(BigInteger.valueOf(1000000)).add(BigInteger.valueOf(remainder));
          BigInteger input = BigInteger.valueOf(epochDay).multiply(BigInteger.valueOf(day)).add(BigInteger.valueOf(clock));
          String row = input+"\t"+(sign*duration[0])+"\t"+(sign*duration[1])+"\t"+(sign*duration[2])+"\t"+(sign*duration[3])+"\t"+(sign*duration[4])+"\t"+expected+"\t"+calendar.get(Calendar.EXTENDED_YEAR)+"\t"+(calendar.get(Calendar.MONTH)+1)+"\t"+calendar.get(Calendar.DATE)+"\t"+((calendar.get(Calendar.DAY_OF_WEEK)+5)%7+1)+"\t"+calendar.get(Calendar.DAY_OF_YEAR)+"\t"+calendar.get(Calendar.WEEK_OF_YEAR)+"\t"+calendar.get(Calendar.YEAR_WOY);
          out.println(javascript ? "\"" + row.replace("\t", "\\t") + "\"," : row);
        }
      }
      if (javascript) out.println("];");
    }
  }
}
