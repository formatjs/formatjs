import com.ibm.icu.util.TimeZone;
import java.io.PrintWriter;
import java.math.BigInteger;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.Arrays;
import java.util.Locale;

/** ICU offsets with java.time fields and BigDecimal rounding controls. */
public final class TemporalZonedStringOracle {
  private static String text(String pattern,Object... values) {return String.format(Locale.ROOT,pattern,values);}
  private static void sample(PrintWriter out,String id,long millis,int offset) {
    int nanos=(int)Math.floorMod(millis,1000)*1000000+123;
    LocalDateTime local=LocalDateTime.ofEpochSecond(Math.floorDiv(millis,1000),nanos,ZoneOffset.ofTotalSeconds(offset));
    int year=local.getYear();
    String date=text(year>=0 && year<=9999?"%04d":"%+07d",year)+text("-%02d-%02dT%02d:%02d:%02d.%09d",local.getMonthValue(),local.getDayOfMonth(),local.getHour(),local.getMinute(),local.getSecond(),nanos);
    int absolute=Math.abs(offset),minutes=(absolute+30)/60;
    String exact=text("%s%02d:%02d:%02d",offset<0?"-":"+",absolute/3600,absolute/60%60,absolute%60);
    String rounded=text("%s%02d:%02d",offset<0 && minutes!=0?"-":"+",minutes/60,minutes%60);
    BigInteger instant=BigInteger.valueOf(millis).multiply(BigInteger.valueOf(1000000)).add(BigInteger.valueOf(123));
    out.println("F\t"+id+"\t"+instant+"\t"+offset+"\t"+date+exact+"["+id+"]\t"+date+rounded+"["+id+"]");
  }
  private static String iso(LocalDateTime value,int precision) {
    int year=value.getYear();
    String result=text(year>=0 && year<=9999?"%04d":"%+07d",year)+text("-%02d-%02dT%02d:%02d",value.getMonthValue(),value.getDayOfMonth(),value.getHour(),value.getMinute());
    if(precision==-1)return result;
    result+=text(":%02d",value.getSecond());
    if(precision>0)result+="."+text("%09d",value.getNano()).substring(0,precision);
    return result;
  }
  private static void rounding(PrintWriter out) {
    String[] modes={"ceil","floor","expand","trunc","halfCeil","halfFloor","halfExpand","halfTrunc","halfEven"};
    BigInteger billion=BigInteger.valueOf(1000000000),million=BigInteger.valueOf(1000000);
    int count=0;
    for(String id:new String[]{"UTC","America/New_York","Europe/Paris","Australia/Lord_Howe","Asia/Kathmandu","Pacific/Apia"}) {
      TimeZone zone=TimeZone.getTimeZone(id,TimeZone.TIMEZONE_ICU);
      for(BigInteger ns:new BigInteger[]{BigInteger.ONE,BigInteger.ONE.negate(),BigInteger.valueOf(999999999),BigInteger.valueOf(-999999999),BigInteger.valueOf(1234567890123456789L),BigInteger.valueOf(-1234567890123456789L),new BigInteger("1583650799999999999"),new BigInteger("1604210399999999999"),new BigInteger("8640000000000000000000").subtract(BigInteger.ONE),new BigInteger("-8640000000000000000000").add(BigInteger.ONE)}) {
        for(int precision=-1;precision<=9;precision++)for(int mode=0;mode<modes.length;mode++) {
          BigInteger quantum=precision==-1?BigInteger.valueOf(60000000000L):BigInteger.TEN.pow(9-precision);
          RoundingMode halfUp=ns.signum()<0?RoundingMode.HALF_DOWN:RoundingMode.HALF_UP,halfDown=ns.signum()<0?RoundingMode.HALF_UP:RoundingMode.HALF_DOWN;
          RoundingMode[] rounding={RoundingMode.CEILING,RoundingMode.FLOOR,RoundingMode.CEILING,RoundingMode.FLOOR,halfUp,halfDown,halfUp,halfDown,RoundingMode.HALF_EVEN};
          BigInteger rounded=new BigDecimal(ns).divide(new BigDecimal(quantum),0,rounding[mode]).toBigIntegerExact().multiply(quantum);
          BigInteger[] millis=rounded.divideAndRemainder(million);
          if(millis[1].signum()<0)millis[0]=millis[0].subtract(BigInteger.ONE);
          int offset=zone.getOffset(millis[0].longValueExact())/1000;
          int nano=rounded.mod(billion).intValueExact();
          LocalDateTime local=LocalDateTime.ofEpochSecond(rounded.subtract(BigInteger.valueOf(nano)).divide(billion).longValueExact(),nano,ZoneOffset.ofTotalSeconds(offset));
          boolean showOffset=count%2==0;
          String calendar=count%5==0?"iso8601":"hebrew",calendarName=new String[]{"auto","always","never","critical"}[count%4],zoneName=new String[]{"auto","never","critical"}[count%3];
          String result=iso(local,precision);
          if(showOffset) {
            int minutes=(Math.abs(offset)+30)/60;
            result+=text("%s%02d:%02d",offset<0 && minutes!=0?"-":"+",minutes/60,minutes%60);
          }
          if(!zoneName.equals("never"))result+="["+(zoneName.equals("critical")?"!":"")+id+"]";
          if(!calendarName.equals("never") && !(calendarName.equals("auto") && calendar.equals("iso8601")))result+="["+(calendarName.equals("critical")?"!":"")+"u-ca="+calendar+"]";
          out.println("R\t"+id+"\t"+ns+"\t"+precision+"\t"+modes[mode]+"\t"+showOffset+"\t"+zoneName+"\t"+calendarName+"\t"+calendar+"\t"+result);
          count++;
        }
      }
    }
  }
  public static void main(String[] args) throws Exception {
    try(PrintWriter out=new PrintWriter(args[0],StandardCharsets.UTF_8)) {
      out.println("# ICU4J 79.1 timezone offsets, java.time fields and BigDecimal rounding; F adds123 nanoseconds, R rounds exact instants");
      for(String line:Files.readAllLines(Path.of(args[1]),StandardCharsets.UTF_8)) {
        if(line.startsWith("#"))continue;
        String[] row=line.split("\\t");
        sample(out,row[0],Long.parseLong(row[1]),Integer.parseInt(row[2]));
      }
      rounding(out);
      String[] ids=TimeZone.getAvailableIDs();Arrays.sort(ids);
      for(String id:ids)for(int year:new int[]{1850,1900,1945,1970,2000})for(int month:new int[]{1,7}) {
        long millis=LocalDate.of(year,month,1).atStartOfDay().toInstant(ZoneOffset.UTC).toEpochMilli();
        sample(out,id,millis,TimeZone.getTimeZone(id,TimeZone.TIMEZONE_ICU).getOffset(millis)/1000);
      }
    }
  }
}
