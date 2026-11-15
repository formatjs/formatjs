import com.ibm.icu.util.Calendar;
import com.ibm.icu.util.GregorianCalendar;
import com.ibm.icu.util.TimeZone;
import com.ibm.icu.util.ULocale;
import java.io.PrintWriter;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Date;
import java.util.TreeSet;

public final class TemporalArithmeticCalendarOracle {
  private static final String[] CALENDARS = {"iso8601","gregory","buddhist","japanese","roc","coptic","ethiopic","ethioaa","hebrew","indian","islamic-civil","islamic-tbla","persian"};
  private static Calendar calendar(String id) {
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
    long low=epoch-1600,high=epoch+1600;
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
  private static Calendar add(Calendar value,String id,int unit,int amount) {
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
          out.println("F\t"+id+"\t"+epoch+"\t"+year+"\t"+month+"\t"+code+"\t"+value.get(Calendar.DATE)+"\t"+monthLength(value,id)+"\t"+months+"\t"+yearLength+"\t"+era[0]+"\t"+era[1]);
          if(index++%17!=0) continue;
          for(int unit=0;unit<4;unit++) for(int amount:new int[]{-2,-1,1,2}) {
            Calendar target=add(value,id,unit,amount);
            long end=target.getTimeInMillis()/86400000L;
            out.println((end< -100000001||end>100000000?"X":"A")+"\t"+id+"\t"+epoch+"\t"+new String[]{"year","month","week","day"}[unit]+"\t"+amount+"\t"+end);
          }
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
