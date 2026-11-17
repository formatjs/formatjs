import com.ibm.icu.util.Calendar;
import java.io.PrintWriter;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

/** ICU forward fields and decimal spans, with existing HKO/KASI controls. */
public final class TemporalShortCalendarOracle {
  private record Month(long start, String code, int length) {}
  private static final long DAY = 86400000L;
  private static final long MINIMUM = LocalDate.of(1900,1,1).toEpochDay();
  private static final long REFERENCE = LocalDate.of(1972,12,31).toEpochDay();
  private static final long MAXIMUM = LocalDate.of(2035,12,31).toEpochDay();
  private static List<Month> months(Calendar calendar) {
    List<Month> result=new ArrayList<>();
    calendar.setTimeInMillis(MINIMUM*DAY);
    long cursor=MINIMUM-calendar.get(Calendar.DATE)+1;
    while(cursor<=MAXIMUM) {
      calendar.setTimeInMillis(cursor*DAY);
      String code=calendar.getTemporalMonthCode();
      int length=1;
      while(true) {
        calendar.setTimeInMillis((cursor+length)*DAY);
        if(calendar.get(Calendar.DATE)==1) break;
        if(++length>31) throw new IllegalStateException("No next month");
      }
      result.add(new Month(cursor,code,length));
      cursor+=length;
    }
    return result;
  }
  private static Long reference(List<Month> months,String id,String code,int day,boolean reject) {
    if(id.equals("iso8601")) {
      for(Month month:months) if(month.start()>=LocalDate.of(1972,1,1).toEpochDay() && month.start()<=REFERENCE && month.code().equals(code)) {
        if(reject && day>month.length()) return null;
        return month.start()+Math.min(day,month.length())-1;
      }
      return null;
    }
    if(id.equals("chinese") || id.equals("dangi")) {
      if(reject && day>30)return null;
      day=Math.min(day,30);
      if(code.endsWith("L") && (code.equals("M01L") || code.equals("M12L") || (day==30 && List.of("M02L","M08L","M09L","M10L","M11L").contains(code)))) {
        if(reject)return null;
        code=code.substring(0,3);
      }
    }
    Long exactBefore=null,exactAfter=null,bestBefore=null,bestAfter=null;
    int maximum=0;
    for(Month month:months) {
      if(!month.code().equals(code))continue;
      int valid=Math.min(day,month.length());
      long epoch=month.start()+valid-1;
      if(epoch<MINIMUM || epoch>MAXIMUM)continue;
      if(valid==day) {
        if(epoch<=REFERENCE)exactBefore=epoch;
        else if(exactAfter==null)exactAfter=epoch;
      }
      if(valid>maximum) {maximum=valid;bestBefore=null;bestAfter=null;}
      if(valid==maximum) {
        if(epoch<=REFERENCE)bestBefore=epoch;
        else if(bestAfter==null)bestAfter=epoch;
      }
    }
    if(exactBefore!=null)return exactBefore;
    if(exactAfter!=null)return exactAfter;
    return reject?null:bestBefore!=null?bestBefore:bestAfter;
  }
  public static void main(String[] args) throws Exception {
    TemporalTableCalendarOracle.loadAuthority(args[1]);
    try(PrintWriter out=new PrintWriter(args[0],StandardCharsets.UTF_8)) {
      out.println("# ICU4J 79.1 forward month catalog 1900..2035; HKO/KASI corrections match existing oracle policy; ISO references use leap year 1972");
      for(String id:new String[]{"iso8601","gregory","buddhist","japanese","roc","coptic","ethiopic","ethioaa","hebrew","indian","islamic-civil","islamic-tbla","persian","chinese","dangi","islamic-umalqura"}) {
        Calendar calendar=List.of("chinese","dangi","islamic-umalqura").contains(id)?TemporalTableCalendarOracle.calendar(id):TemporalArithmeticCalendarOracle.calendar(id);
        List<Month> months=months(calendar);
        for(int number=1;number<=13;number++)for(boolean leap:new boolean[]{false,true})for(int day:new int[]{1,28,29,30,31,32})for(boolean reject:new boolean[]{false,true}) {
          String code=String.format("M%02d%s",number,leap?"L":"");
          Long expected=reference(months,id,code,day,reject);
          out.println("M\t"+id+"\t"+code+"\t"+day+"\t"+(reject?"reject":"constrain")+"\t"+(expected==null?"X":expected));
        }
        rounding(out,id,calendar);
      }
    }
  }
  private static boolean table(String id) {return List.of("chinese","dangi","islamic-umalqura").contains(id);}
  private static Calendar add(Calendar value,String id,int unit,int amount) {
    return table(id)?TemporalTableCalendarOracle.add(value,id,unit,amount):TemporalArithmeticCalendarOracle.add(value,id,unit,amount);
  }
  private static int[] until(Calendar start,Calendar end,String id,int unit) {
    return table(id)?TemporalTableCalendarOracle.until(start,end,id,unit):TemporalArithmeticCalendarOracle.until(start,end,id,unit);
  }
  private static Calendar first(Calendar calendar,long epoch) {
    Calendar value=(Calendar)calendar.clone();value.setTimeInMillis(epoch*DAY);
    value.setTimeInMillis((epoch-value.get(Calendar.DATE)+1)*DAY);return value;
  }
  private static void rounding(PrintWriter out,String id,Calendar calendar) {
    String[] modes={"ceil","floor","expand","trunc","halfCeil","halfFloor","halfExpand","halfTrunc","halfEven"};
    for(long[] pair:new long[][] {{LocalDate.of(2020,1,15).toEpochDay(),LocalDate.of(2023,8,15).toEpochDay()},{LocalDate.of(2021,2,15).toEpochDay(),LocalDate.of(2021,8,15).toEpochDay()}})for(int reverse=0;reverse<2;reverse++) {
      Calendar start=first(calendar,pair[reverse]),end=first(calendar,pair[1-reverse]);
      long origin=start.getTimeInMillis()/DAY,target=end.getTimeInMillis()/DAY,sign=Long.compare(target,origin);
      for(int largest=0;largest<2;largest++)for(int smallest=largest;smallest<2;smallest++)for(int increment:new int[]{1,2,5}) {
        // Month increments retain the year prefix, as ComputeNudgeWindow requires.
        int[] difference=until(start,end,id,largest);
        int years=smallest==1 && largest==0?difference[0]:0;
        Calendar base=add(start,id,0,years);
        int count=difference[smallest]/increment;
        long low=add(base,id,smallest,count*increment).getTimeInMillis()/DAY;
        long high=add(base,id,smallest,(count+(int)sign)*increment).getTimeInMillis()/DAY;
        long span=(high-low)*sign;
        for(int mode=0;mode<modes.length;mode++) {
          StringBuilder row=new StringBuilder("R\t"+id+"\t"+origin+"\t"+target+"\t"+(largest==0?"year":"month")+"\t"+(smallest==0?"year":"month")+"\t"+increment+"\t"+modes[mode]);
          for(int operation=0;operation<2;operation++) {
            int direction=operation==0?1:-1;
            long value=(count*span+target-low)*direction;
            RoundingMode[] rounding={RoundingMode.CEILING,RoundingMode.FLOOR,RoundingMode.UP,RoundingMode.DOWN,value<0?RoundingMode.HALF_DOWN:RoundingMode.HALF_UP,value<0?RoundingMode.HALF_UP:RoundingMode.HALF_DOWN,RoundingMode.HALF_UP,RoundingMode.HALF_DOWN,RoundingMode.HALF_EVEN};
            int rounded=BigDecimal.valueOf(value).divide(BigDecimal.valueOf(span),0,rounding[mode]).intValueExact()*increment*direction;
            int resultYears=smallest==0?rounded:years,resultMonths=smallest==1?rounded:0;
            if(largest==0 && smallest==1 && rounded!=count*increment) {
              long endpoint=add(base,id,smallest,rounded).getTimeInMillis()/DAY;
              long boundary=add(start,id,0,years+(int)sign).getTimeInMillis()/DAY;
              if((endpoint-boundary)*sign>=0) {resultYears=years+(int)sign;resultMonths=0;}
            }
            row.append("\t").append(resultYears*direction).append("\t").append(resultMonths*direction);
          }
          out.println(row);
        }
      }
    }
  }
}
