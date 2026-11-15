import com.ibm.icu.util.Calendar;
import com.ibm.icu.util.GregorianCalendar;
import com.ibm.icu.util.TimeZone;
import com.ibm.icu.util.ULocale;
import java.io.PrintWriter;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Date;
import java.util.TreeSet;

public final class TemporalArithmeticCalendarOracle {
  private static final String[] CALENDARS = {"iso8601","gregory","buddhist","japanese","roc","coptic","ethiopic","ethioaa","hebrew","indian","islamic-civil","islamic-tbla","persian"};
  static Calendar calendar(String id) {
    Calendar result = Calendar.getInstance(TimeZone.getTimeZone("UTC",TimeZone.TIMEZONE_ICU),ULocale.forLanguageTag("und-u-ca-" + id));
    String expected=id.equals("ethioaa")?"ethiopic-amete-alem":id.equals("gregory")||id.equals("iso8601")?"gregorian":id;
    if(!result.getType().equals(expected)) throw new IllegalStateException(id+" resolved to "+result.getType());
    if (result instanceof GregorianCalendar) ((GregorianCalendar)result).setGregorianChange(new Date(Long.MIN_VALUE));
    return result;
  }
  private static int year(Calendar value, String id) {
    if (id.equals("buddhist")) return value.get(Calendar.YEAR);
    if (id.equals("roc")) return value.get(Calendar.ERA)==0 ? 1-value.get(Calendar.YEAR) : value.get(Calendar.YEAR);
    return value.get(Calendar.EXTENDED_YEAR);
  }
  private static String[] era(String id, Calendar value, long epoch, int year) {
    switch(id) {
      case "iso8601": return new String[] {"-","-"};
      case "buddhist": return new String[] {"be",""+year};
      case "coptic": case "hebrew": return new String[] {"am",""+year};
      case "ethioaa": return new String[] {"aa",""+year};
      case "ethiopic": return new String[] {year>0 ? "am" : "aa",""+(year>0 ? year : year+5500)};
      case "indian": return new String[] {"shaka",""+year};
      case "persian": return new String[] {"ap",""+year};
      case "islamic-civil": case "islamic-tbla": return new String[] {year>0 ? "ah":"bh",""+(year>0?year:1-year)};
      case "roc": return new String[] {year>0 ? "roc":"broc",""+(year>0?year:1-year)};
      case "japanese":
        if (epoch>=-35428) {
          int index=value.get(Calendar.ERA)-value.getMaximum(Calendar.ERA)+4;
          if (index<0||index>4) throw new IllegalStateException("Unknown Japanese era");
          return new String[] {new String[] {"meiji","taisho","showa","heisei","reiwa"}[index],""+value.get(Calendar.YEAR)};
        }
      default: return new String[] {year>0 ? "ce":"bce",""+(year>0?year:1-year)};
    }
  }
  // Forward fields avoid ICU reverse-setting defects at negative Julian days.
  private static long startOfYear(Calendar value,String id,int targetYear) {
    long epoch=value.getTimeInMillis()/86400000L;
    long low=epoch-2400,high=epoch+2400;
    Calendar probe=(Calendar)value.clone();
    while(low<high) {
      long middle=low+(high-low)/2;
      probe.setTimeInMillis(middle*86400000L);
      if(year(probe,id)<targetYear) low=middle+1; else high=middle;
    }
    return low;
  }
  // ICU getActualMaximum(DATE) is wrong for some negative Coptic/Ethiopic years.
  private static int monthLength(Calendar value,String id) {
    long epoch=value.getTimeInMillis()/86400000L;
    long start=epoch-value.get(Calendar.DATE)+1,low=start+1,high=start+32;
    int y=year(value,id),m=value.get(Calendar.MONTH);
    Calendar probe=(Calendar)value.clone();
    while(low<high) {
      long middle=low+(high-low)/2;
      probe.setTimeInMillis(middle*86400000L);
      if(year(probe,id)==y&&probe.get(Calendar.MONTH)==m) low=middle+1; else high=middle;
    }
    return (int)(low-start);
  }
  static Calendar add(Calendar value,String id,int unit,int amount) {
    Calendar target=(Calendar)value.clone();
    long epoch=value.getTimeInMillis()/86400000L;
    if(unit>=2) {target.setTimeInMillis((epoch+amount*(unit==2?7:1))*86400000L);return target;}
    int day=value.get(Calendar.DATE);
    long first=epoch-day+1;
    if(unit==0) {
      first=startOfYear(value,id,year(value,id)+amount);
      target.setTimeInMillis(first*86400000L);
      while(target.get(Calendar.MONTH)<value.get(Calendar.MONTH)) {
        first+=monthLength(target,id);target.setTimeInMillis(first*86400000L);
      }
    } else for(int n=0;n<Math.abs(amount);n++) {
      target.setTimeInMillis(first*86400000L);
      if(amount>0) first+=monthLength(target,id);
      else {target.setTimeInMillis((first-1)*86400000L);first-=target.get(Calendar.DATE);}
    }
    target.setTimeInMillis(first*86400000L);
    target.setTimeInMillis((first+Math.min(day,monthLength(target,id))-1)*86400000L);
    return target;
  }
  private static int compare(int y,int m,int d,Calendar target,String id) {
    int result=Integer.compare(y,year(target,id));
    if(result==0) result=Integer.compare(m,target.get(Calendar.MONTH));
    if(result==0) result=Integer.compare(d,target.get(Calendar.DATE));
    return result;
  }
  private static Calendar monthTarget(Calendar start,String id,int years,int months) {
    Calendar value=add(start,id,0,years);
    return add(value,id,1,months);
  }
  private static boolean surpasses(Calendar start,Calendar end,String id,int sign,int years,int months) {
    int day=start.get(Calendar.DATE);
    if(sign*compare(year(start,id)+years,start.get(Calendar.MONTH),day,end,id)>0) return true;
    Calendar target=monthTarget(start,id,years,months);
    return sign*compare(year(target,id),target.get(Calendar.MONTH),day,end,id)>0;
  }
  static int[] until(Calendar start,Calendar end,String id,int largest) {
    if(start.getTimeInMillis()==end.getTimeInMillis())return new int[4];
    int sign=Long.compare(end.getTimeInMillis(),start.getTimeInMillis());
    int years=0,months=0,weeks=0;
    if(largest==0) while(!surpasses(start,end,id,sign,years+sign,0)) years+=sign;
    if(largest<=1) while(!surpasses(start,end,id,sign,years,months+sign)) months+=sign;
    Calendar anchor=monthTarget(start,id,years,months);
    long first=anchor.getTimeInMillis()/86400000L-anchor.get(Calendar.DATE)+1;
    long epoch=first+Math.min(start.get(Calendar.DATE),monthLength(anchor,id))-1;
    int days=(int)(end.getTimeInMillis()/86400000L-epoch);
    if(largest==2) {weeks=days/7;days%=7;}
    return new int[] {years,months,weeks,days};
  }
  public static void main(String[] args) throws Exception {
    try (PrintWriter out=new PrintWriter(args[0],StandardCharsets.UTF_8)) {
      out.println("# ICU4J proleptic arithmetic calendar fields, year/month lengths and additions");
      out.println("# Hebrew oracle: epoch days -1000000..1000000; Persian oracle: arithmetic years 1206..1498. Full-range proleptic invariants tested separately.");
      out.println("# Lengths and constrained additions use ICU forward fields and boundary searches; no reverse field-setting APIs.");
      out.println("# Japanese eras before 1873 normalize to proleptic Gregorian, as required by the era/monthCode proposal.");
      for(String id:CALENDARS) {
        Calendar value=calendar(id);
        TreeSet<Long> days=new TreeSet<>();
        for(long day=-100000001;day<=100000000;day+=133337) days.add(day);
        for(long day=-43830;day<=55152;day+=73) days.add(day);
        for(long day:new long[] {-100000001,-100000000,-2092590,-719528,-719529,-35429,-35428,-20975,-20974,-15714,-15713,6946,6947,18016,18017,0,11016,19782,100000000}) days.add(day);
        int index=0;
        for(long epoch:days) {
          if(id.equals("hebrew")&&(epoch < -1000000||epoch>1000000)) continue;
          value.setTimeInMillis(epoch*86400000L);
          int year=year(value,id);
          if(id.equals("persian")&&(year<1206||year>1498)) continue;
          long yearLength=startOfYear(value,id,year+1)-startOfYear(value,id,year);
          int rawMonth=value.get(Calendar.MONTH);
          boolean hebrewLeap=id.equals("hebrew")&&yearLength>365;
          int month=rawMonth+1-(id.equals("hebrew")&&!hebrewLeap&&rawMonth>=6?1:0);
          String code=id.equals("hebrew")?(rawMonth==5?"M05L":String.format("M%02d",rawMonth<5?rawMonth+1:rawMonth)):String.format("M%02d",month);
          int months=id.equals("hebrew")?(hebrewLeap?13:12):value.getActualMaximum(Calendar.MONTH)+1;
          String[] era=era(id,value,epoch,year);
          out.println("F\t"+id+"\t"+epoch+"\t"+year+"\t"+month+"\t"+code+"\t"+value.get(Calendar.DATE)+"\t"+monthLength(value,id)+"\t"+months+"\t"+yearLength+"\t"+era[0]+"\t"+era[1]+"\t"+value.get(Calendar.DAY_OF_YEAR)+"\t"+((value.get(Calendar.DAY_OF_WEEK)+5)%7+1));
          if(index++%17!=0) continue;
          for(int unit=0;unit<4;unit++) for(int amount:new int[]{-2,-1,1,2}) {
            Calendar target=add(value,id,unit,amount);
            long end=target.getTimeInMillis()/86400000L;
            out.println((end< -100000001||end>100000000?"X":"A")+"\t"+id+"\t"+epoch+"\t"+new String[]{"year","month","week","day"}[unit]+"\t"+amount+"\t"+end);
            if(end>=-100000001&&end<=100000000) {
              int[] difference=until(value,target,id,unit);
              out.println("D\t"+id+"\t"+epoch+"\t"+end+"\t"+new String[]{"year","month","week","day"}[unit]+"\t"+difference[0]+"\t"+difference[1]+"\t"+difference[2]+"\t"+difference[3]);
            }
          }
        }
        // Four years of month ends exercise shifted total windows.
        value.setTimeInMillis(18262L*86400000L);
        long first=18262L-value.get(Calendar.DATE)+1;
        for(int sample=0;sample<52;sample++) {
          value.setTimeInMillis(first*86400000L);
          int length=monthLength(value,id);
          long source=first+length-1;
          value.setTimeInMillis(source*86400000L);
          for(int unit=0;unit<2;unit++) for(int amount:new int[]{-3,-1,1,3}) {
            int sign=Integer.signum(amount);
            long a=add(value,id,unit,amount).getTimeInMillis()/86400000L;
            long b=add(value,id,unit,amount+sign).getTimeInMillis()/86400000L;
            BigDecimal fraction=BigDecimal.valueOf(sign*10L).divide(BigDecimal.valueOf(Math.abs(b-a)*24L),80,RoundingMode.HALF_EVEN);
            double total=BigDecimal.valueOf(amount).add(fraction).doubleValue();
            out.println("T\t"+id+"\t"+source+"\t"+(unit==0?"year":"month")+"\t"+amount+"\t"+Double.toString(total));
          }
          first+=length;
        }
      }
    }
    if(args.length>1) {
      String value=Files.readString(Path.of(args[0]),StandardCharsets.UTF_8);
      String literal=value.replace("\\","\\\\").replace("\"","\\\"").replace("\r","\\r").replace("\n","\\n").replace("\t","\\t");
      Files.writeString(Path.of(args[1]),"globalThis.__formatjsArithmeticCalendarOracle = \""+literal+"\";\n",StandardCharsets.UTF_8);
    }
  }
}
