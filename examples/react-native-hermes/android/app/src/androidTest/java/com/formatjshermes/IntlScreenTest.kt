package com.formatjshermes

import android.graphics.Bitmap
import android.graphics.Canvas
import android.os.ParcelFileDescriptor
import android.view.View
import android.view.ViewGroup
import android.widget.TextView
import androidx.test.core.app.ActivityScenario
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith
import java.io.File

@RunWith(AndroidJUnit4::class)
class IntlScreenTest {
  private fun textOnScreen(view: View): List<String> {
    val own = if (view is TextView) listOf(view.text.toString()) else emptyList()
    return if (view is ViewGroup) own + (0 until view.childCount).flatMap { textOnScreen(view.getChildAt(it)) } else own
  }

  @Test
  fun rendersHermesAndEveryRustIntlPolyfill() {
    val context = InstrumentationRegistry.getInstrumentation().targetContext
    ActivityScenario.launch(MainActivity::class.java).use { scenario ->
      val names = listOf(
        "Hermes", "native install", "getCanonicalLocales", "supportedValuesOf",
        "Locale", "PluralRules", "ListFormat", "DisplayNames", "Segmenter",
        "Collator", "NumberFormat", "RelativeTimeFormat", "DateTimeFormat",
        "DurationFormat",
      )
      val expected = names.map { "$it: PASS" }
      var rendered = emptyList<String>()
      val deadline = System.currentTimeMillis() + 60_000
      while (System.currentTimeMillis() < deadline) {
        scenario.onActivity { activity ->
          rendered = textOnScreen(activity.findViewById(android.R.id.content))
        }
        if (rendered.containsAll(expected)) break
        Thread.sleep(250)
      }
      assertTrue("Rendered text: $rendered", rendered.containsAll(expected))
      val screenshot = File(context.getExternalFilesDir(null), "intl-screen.png")
      scenario.onActivity { activity ->
        val root = activity.findViewById<View>(android.R.id.content)
        val bitmap = Bitmap.createBitmap(root.width, root.height, Bitmap.Config.ARGB_8888)
        root.draw(Canvas(bitmap))
        screenshot.outputStream().use {
          assertTrue("Screenshot capture failed", bitmap.compress(Bitmap.CompressFormat.PNG, 100, it))
        }
      }
      val pipes = InstrumentationRegistry.getInstrumentation().uiAutomation
        .executeShellCommandRw("cat > /data/local/tmp/intl-screen.png")
      ParcelFileDescriptor.AutoCloseOutputStream(pipes[1]).use { it.write(screenshot.readBytes()) }
      ParcelFileDescriptor.AutoCloseInputStream(pipes[0]).use { it.readBytes() }
      println("Intl screen screenshot: ${screenshot.absolutePath}")
    }
  }
}
