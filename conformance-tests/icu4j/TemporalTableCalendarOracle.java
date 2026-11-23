import com.ibm.icu.util.Calendar;
import com.ibm.icu.util.ChineseCalendar;
import com.ibm.icu.util.DangiCalendar;
import java.time.LocalDate;
import com.ibm.icu.util.TimeZone;
import com.ibm.icu.util.ULocale;
import java.io.PrintWriter;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public final class TemporalTableCalendarOracle {
  private record Month(long start, int year, String code) {}
  private static final List<Month> AUTHORITY = new ArrayList<>();
  private static final Map<Integer,Integer> YEAR_STARTS = new HashMap<>();
  private static boolean rawIcu;
  static void loadAuthority(String file) throws Exception {
    for(String line:Files.readAllLines(Path.of(file),StandardCharsets.UTF_8)) {
      if(line.startsWith("#"))continue;
      String[] row=line.split("\\t");
      Month month=new Month(Long.parseLong(row[0]),Integer.parseInt(row[1]),row[2]);
      if(month.code().equals("M01"))YEAR_STARTS.put(month.year(),AUTHORITY.size());
      AUTHORITY.add(month);
    }
    if(AUTHORITY.size()!=2474)throw new IllegalStateException("Incomplete HKO authority data");
  }
  // ICU's approximate astronomy disagrees with published HKO tables in some years.
  private static final class AuthorityChineseCalendar extends ChineseCalendar {
    AuthorityChineseCalendar() {super(TimeZone.getTimeZone("UTC",TimeZone.TIMEZONE_ICU),ULocale.forLanguageTag("und-u-ca-chinese"));}
    @Override protected void handleComputeFields(int julianDay) {
      super.handleComputeFields(julianDay);
      if(rawIcu || AUTHORITY.isEmpty())return;
      long epoch=(long)julianDay-2440588;
      int low=0,high=AUTHORITY.size();
      while(low+1<high){int middle=(low+high)/2;if(AUTHORITY.get(middle).start()<=epoch)low=middle;else high=middle;}
      Month month=AUTHORITY.get(low);
      if(epoch<month.start() || !YEAR_STARTS.containsKey(month.year()) || !YEAR_STARTS.containsKey(month.year()+1))return;
      internalSet(EXTENDED_YEAR,month.year());
      internalSet(MONTH,Integer.parseInt(month.code().substring(1,3))-1);
      internalSet(IS_LEAP_MONTH,month.code().endsWith("L")?1:0);
      internalSet(ORDINAL_MONTH,low-YEAR_STARTS.get(month.year()));
      internalSet(DATE,(int)(epoch-month.start()+1));
      internalSet(DAY_OF_YEAR,(int)(epoch-AUTHORITY.get(YEAR_STARTS.get(month.year())).start()+1));
    }
  }
  private static final class AuthorityDangiCalendar extends DangiCalendar {
    AuthorityDangiCalendar() {super(TimeZone.getTimeZone("UTC",TimeZone.TIMEZONE_ICU),ULocale.forLanguageTag("und-u-ca-dangi"));}
    @Override protected void handleComputeFields(int julianDay) {
      super.handleComputeFields(julianDay);
      if(rawIcu)return;
      long epoch=(long)julianDay-2440588,
        first=LocalDate.of(2017,2,26).toEpochDay(),next=LocalDate.of(2017,3,28).toEpochDay();
      // KASI: new moon February 26 at 23:58 KST; ICU puts it after midnight.
      // https://astro.kasi.re.kr/life/pageView/1
      if(epoch>=first && epoch<next) {
        internalSet(MONTH,1);internalSet(ORDINAL_MONTH,1);internalSet(IS_LEAP_MONTH,0);
        internalSet(DATE,(int)(epoch-first+1));
      }
    }
  }
  private static final long DAY=86400000L;
  private static int year(Calendar value,String id) {
    return value.get(Calendar.EXTENDED_YEAR);
  }
  private static int code(Calendar value) {String code=value.getTemporalMonthCode();return (Integer.parseInt(code.substring(1,3))-1)*2+(code.endsWith("L")?1:0); }
  private static String monthCode(Calendar value) {return value.getTemporalMonthCode();}
  private static Calendar at(Calendar source,long epoch) {Calendar value=(Calendar)source.clone();value.setTimeInMillis(epoch*DAY);return value;}
  private static long startOfYear(Calendar source,String id,int target) {
    long epoch=source.getTimeInMillis()/DAY,low=epoch-2400,high=epoch+2400;
    while(low<high) {long mid=low+(high-low)/2;if(year(at(source,mid),id)<target) low=mid+1;else high=mid;}
    if(year(at(source,low),id)!=target) throw new IllegalStateException("Year search failed");
    return low;
  }
  private static int monthLength(Calendar value,String id) {
    long epoch=value.getTimeInMillis()/DAY,start=epoch-value.get(Calendar.DATE)+1;
    long low=start+1,high=start+32;
    while(low<high) {long mid=low+(high-low)/2;Calendar probe=at(value,mid);if(year(probe,id)==year(value,id)&&code(probe)==code(value))low=mid+1;else high=mid;}
    return (int)(low-start);
  }
  private static int ordinal(Calendar value,String id) {
    int count=1;long cursor=startOfYear(value,id,year(value,id)),epoch=value.getTimeInMillis()/DAY;
    while(cursor+monthLength(at(value,cursor),id)<=epoch) {cursor+=monthLength(at(value,cursor),id);count++;}
    return count;
  }
  static Calendar add(Calendar source,String id,int unit,int amount) {
    long epoch=source.getTimeInMillis()/DAY;
    if(unit>=2) return at(source,epoch+(long)amount*(unit==2?7:1));
    long first=epoch-source.get(Calendar.DATE)+1;
    if(unit==0) {
      first=startOfYear(source,id,year(source,id)+amount);
      int wanted=code(source);long common=first;
      while(code(at(source,first))<wanted) {common=first;first+=monthLength(at(source,first),id);}
      if(code(at(source,first))!=wanted) first=common;
    } else for(int n=0;n<Math.abs(amount);n++) {
      if(amount>0) first+=monthLength(at(source,first),id);
      else first-=at(source,first-1).get(Calendar.DATE);
    }
    return at(source,first+Math.min(source.get(Calendar.DATE),monthLength(at(source,first),id))-1);
  }
  private static int compare(int y,int m,int day,Calendar target,String id) {
    int result=Integer.compare(y,year(target,id));if(result==0)result=Integer.compare(m,code(target));if(result==0)result=Integer.compare(day,target.get(Calendar.DATE));return result;
  }
  private static boolean surpasses(Calendar source,Calendar end,String id,int sign,int years,int months) {
    if(sign*compare(year(source,id)+years,code(source),source.get(Calendar.DATE),end,id)>0)return true;
    Calendar target=add(add(source,id,0,years),id,1,months);
    return sign*compare(year(target,id),code(target),source.get(Calendar.DATE),end,id)>0;
  }
  static int[] until(Calendar source,Calendar end,String id,int largest) {
    if(source.getTimeInMillis()==end.getTimeInMillis())return new int[4];
    int sign=Long.compare(end.getTimeInMillis(),source.getTimeInMillis()),years=0,months=0,weeks=0;
    if(largest==0)while(!surpasses(source,end,id,sign,years+sign,0))years+=sign;
    if(largest<=1)while(!surpasses(source,end,id,sign,years,months+sign))months+=sign;
    Calendar target=add(add(source,id,0,years),id,1,months);
    long first=target.getTimeInMillis()/DAY-target.get(Calendar.DATE)+1;
    int days=(int)(end.getTimeInMillis()/DAY-first-Math.min(source.get(Calendar.DATE),monthLength(target,id))+1);
    if(largest==2){weeks=days/7;days%=7;}return new int[]{years,months,weeks,days};
  }
  static Calendar calendar(String id) {
    return id.equals("chinese") && !rawIcu ? new AuthorityChineseCalendar() : id.equals("dangi") && !rawIcu ? new AuthorityDangiCalendar() : Calendar.getInstance(TimeZone.getTimeZone("UTC",TimeZone.TIMEZONE_ICU),ULocale.forLanguageTag("und-u-ca-"+id));
  }
  public static void main(String[] args) throws Exception {
    rawIcu=args.length>3 && args[3].equals("--raw-icu");
    loadAuthority(args[2]);
    try(PrintWriter out=new PrintWriter(args[0],StandardCharsets.UTF_8)) {
      out.println("# ICU4J controls; complete Chinese years 1901..2099 use independent published HKO fields; Dangi February 2017 uses the KASI boundary. Raw ICU mode: "+rawIcu+". Official Chinese 1900..2100, Dangi 1900..2050, Umm al-Qura 1300..1600 AH; approximation outside these ranges checked separately.");
      for(String id:new String[]{"chinese","dangi","islamic-umalqura"}) {
        Calendar value=calendar(id);
        if(!value.getType().equals(id)) throw new IllegalStateException(id+" resolved to "+value.getType());
        int minimum=id.equals("islamic-umalqura")?1300:1900,maximum=id.equals("chinese")?2100:id.equals("dangi")?2050:1600;
        // Approach year boundaries from known modern forward conversions.
        value.setTimeInMillis(0);long cursor=value.getTimeInMillis()/DAY;
        while(year(at(value,cursor),id)>minimum)cursor-=300;
        while(year(at(value,cursor),id)<minimum)cursor++;
        cursor=startOfYear(at(value,cursor),id,minimum);
        int samples=0;
        while(year(at(value,cursor),id)<=maximum) {
          Calendar first=at(value,cursor);int length=monthLength(first,id);
          for(long epoch:new long[]{cursor,cursor+length-1}) {
            Calendar date=at(value,epoch);int y=year(date,id),month=ordinal(date,id);
            long start=startOfYear(date,id,y),end=startOfYear(date,id,y+1);int months=0;
            for(long next=start;next<end;next+=monthLength(at(value,next),id))months++;
            boolean lunar=!id.equals("islamic-umalqura");
            out.println("F\t"+id+"\t"+epoch+"\t"+y+"\t"+month+"\t"+monthCode(date)+"\t"+date.get(Calendar.DATE)+"\t"+length+"\t"+months+"\t"+(end-start)+"\t"+(lunar?"-":"ah")+"\t"+(lunar?"-":Integer.toString(y))+"\t"+date.get(Calendar.DAY_OF_YEAR)+"\t"+((date.get(Calendar.DAY_OF_WEEK)+5)%7+1));
            if(samples++%37!=0 || y<minimum+3 || y>maximum-3)continue;
            for(int unit=0;unit<4;unit++)for(int amount:new int[]{-2,-1,1,2}) {
              Calendar target=add(date,id,unit,amount);long targetDay=target.getTimeInMillis()/DAY;
              out.println("A\t"+id+"\t"+epoch+"\t"+new String[]{"year","month","week","day"}[unit]+"\t"+amount+"\t"+targetDay);
              int[] d=until(date,target,id,unit);
              out.println("D\t"+id+"\t"+epoch+"\t"+targetDay+"\t"+new String[]{"year","month","week","day"}[unit]+"\t"+d[0]+"\t"+d[1]+"\t"+d[2]+"\t"+d[3]);
            }
          }
          cursor+=length;
        }
        value.setTimeInMillis(18262L*DAY);long first=18262L-value.get(Calendar.DATE)+1;
        for(int sample=0;sample<52;sample++) {
          Calendar start=at(value,first);int length=monthLength(start,id);long source=first+length-1;start=at(value,source);
          for(int unit=0;unit<2;unit++)for(int amount:new int[]{-3,-1,1,3}) {
            int sign=Integer.signum(amount);long a=add(start,id,unit,amount).getTimeInMillis()/DAY,b=add(start,id,unit,amount+sign).getTimeInMillis()/DAY;
            double total=BigDecimal.valueOf(amount).add(BigDecimal.valueOf(sign*10L).divide(BigDecimal.valueOf(Math.abs(b-a)*24L),80,RoundingMode.HALF_EVEN)).doubleValue();
            out.println("T\t"+id+"\t"+source+"\t"+(unit==0?"year":"month")+"\t"+amount+"\t"+Double.toString(total));
          }
          first+=length;
        }
      }
    }
    String value=Files.readString(Path.of(args[0]),StandardCharsets.UTF_8);
    Files.writeString(Path.of(args[1]),"globalThis.__formatjsTableCalendarOracle = "+'"'+value.replace("\\","\\\\").replace("\"","\\\"").replace("\n","\\n").replace("\r","\\r").replace("\t","\\t")+'"'+";\n",StandardCharsets.UTF_8);
  }
}
