import com.ibm.icu.text.BreakIterator;
import com.ibm.icu.util.ULocale;
import com.ibm.icu.util.VersionInfo;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.List;

public class IntlSegmenterOracle {
    private static String hex(String value) {
        StringBuilder out = new StringBuilder();
        for (int i = 0; i < value.length(); i++) out.append(String.format("%04x", (int) value.charAt(i)));
        return out.length() == 0 ? "_" : out.toString();
    }
    public static void main(String[] args) throws Exception {
        if (VersionInfo.ICU_VERSION.getMajor() != 78 || VersionInfo.ICU_VERSION.getMinor() != 1)
            throw new AssertionError("Unexpected ICU4J version");
        String[] inputs = {
            "", "A\ud83d\ude42B", "hello world!", "e\u0301", "\r\n", "a\u200db",
            "\ud83d\udc69\u200d\ud83d\udc69\u200d\ud83d\udc67\u200d\ud83d\udc66",
            "\ud83c\uddfa\ud83c\uddf8\ud83c\udde8\ud83c\udde6", "\u0915\u094d\u200d\u0937",
            "नमस्ते दुनिया।", "你好世界", "こんにちは世界", "ทุกสองสัปดาห์",
            "Dr. Smith left. Next!", "Mr. Smith left. Next!", "Hello! \nNext?",
            "hello\u00adworld", "a\u2060b", "\u0308", "\u2764\ufe0f",
            "\ud800x\udfff", "\ud800\ud83d\ude42\udfff", "1,234.56 78%", "漢字かなカナ",
            "مرحبا بالعالم.", "a\u0000b", "x\u2028y\u2029z", "\u0600a",
            "\ud83c\udde6\u0308\ud83c\udde6", "Wait... Really?",
            "½", "²", "Ⅻ", "①", "Ⓐ", "_", "\u0903", "\u200d", "\ufe0f", "१२३", "١٢٣", "가", "__", "ﾞ", "ᾼ", "㊗️",
            "etc.)\u2019\u00a0\u2018(the", "A.\r\nA", "\u2060(\u2060\"\u2060G\u2060o\u2060.\u2060\"\u2060)\u2060 \u2060(\u2060H\u2060e\u2060 \u2060d\u2060i\u2060d\u2060.\u2060)\u2060\u2060", "\u2060(\u2060\u201c\u2060G\u2060o\u2060?\u2060\u201d\u2060)\u2060 \u2060(\u2060H\u2060e\u2060 \u2060d\u2060i\u2060d\u2060.\u2060)\u2060\u2060", "\u2060U\u2060.\u2060S\u2060.\u2060A\u2060\u0300.\u2060 \u2060i\u2060s\u2060\u2060", "\u2060U\u2060.\u2060S\u2060.\u2060A\u2060\u0300?\u2060 \u2060H\u2060e\u2060\u2060", "\u2060U\u2060.\u2060S\u2060.\u2060A\u2060\u0300.\u2060\u2060", "\u2060c\u2060.\u2060D\u2060\u2060", "\u2060C\u2060.\u2060D\u2060\u2060", "\u2060e\u2060t\u2060c\u2060.\u2060)\u2060\u2019\u2060\u00a0\u2060T\u2060h\u2060e\u2060\u2060", "\u2060e\u2060t\u2060c\u2060.\u2060)\u2060\u2019\u2060\u00a0\u2060\u2018\u2060(\u2060T\u2060h\u2060e\u2060\u2060", "\u2060e\u2060t\u2060c\u2060.\u2060)\u2060\u2019\u2060\u00a0\u2060\u0308T\u2060h\u2060e\u2060\u2060", "\u2060e\u2060t\u2060c\u2060.\u2060)\u2060\u2019\u2060\u0308T\u2060h\u2060e\u2060\u2060"
        };
        List<String> rows = new ArrayList<>();
        rows.add("locale\tgranularity\tinput\trecords");
        for (String tag : new String[]{"en", "en-GB", "fr", "de", "ja", "zh-TW", "zh-HK", "th", "hi", "ar"}) {
            ULocale locale = ULocale.forLanguageTag(tag);
            for (String granularity : new String[]{"grapheme", "word", "sentence"}) {
                BreakIterator iterator = granularity.equals("grapheme") ? BreakIterator.getCharacterInstance(locale)
                    : granularity.equals("word") ? BreakIterator.getWordInstance(locale)
                    : BreakIterator.getSentenceInstance(locale);
                for (String input : inputs) {
                    iterator.setText(input);
                    List<String> records = new ArrayList<>();
                    int start = iterator.first();
                    for (int end = iterator.next(); end != BreakIterator.DONE; end = iterator.next()) {
                        String word = granularity.equals("word") ? (iterator.getRuleStatus() >= BreakIterator.WORD_NUMBER ? "1" : "0") : "-";
                        records.add(start + ":" + end + ":" + word);
                        start = end;
                    }
                    if (start != input.length()) throw new AssertionError("Incomplete UTF-16 coverage");
                    rows.add(tag + "\t" + granularity + "\t" + hex(input) + "\t" + (records.isEmpty() ? "-" : String.join(",", records)));
                }
            }
        }
        if (rows.size() != 1771) throw new AssertionError("Incomplete segmentation matrix: " + rows.size());
        Files.write(Paths.get(args[0]), rows, StandardCharsets.UTF_8);
    }
}
