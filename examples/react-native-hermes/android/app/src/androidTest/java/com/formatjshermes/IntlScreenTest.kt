package com.formatjshermes

import android.graphics.Bitmap
import android.graphics.Canvas
import android.view.View
import androidx.test.core.app.ActivityScenario
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import androidx.test.uiautomator.By
import androidx.test.uiautomator.UiDevice
import androidx.test.uiautomator.Until
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith
import java.io.File

@RunWith(AndroidJUnit4::class)
class IntlScreenTest {
  @Test
  fun rendersHermesAndEveryRustIntlPolyfill() {
    val device = UiDevice.getInstance(InstrumentationRegistry.getInstrumentation())
    val context = InstrumentationRegistry.getInstrumentation().targetContext
    ActivityScenario.launch(MainActivity::class.java).use { scenario ->
      val names = listOf(
        "Hermes", "native install", "getCanonicalLocales", "supportedValuesOf",
        "Locale", "PluralRules", "ListFormat", "DisplayNames", "Segmenter",
        "Collator", "NumberFormat", "RelativeTimeFormat", "DateTimeFormat",
        "DurationFormat",
      )
      for (name in names) {
        val label = "$name: PASS"
        device.wait(Until.hasObject(By.text(label)), if (name == "Hermes") 60_000 else 10_000)
        assertNotNull(label, device.findObject(By.text(label)))
      }
      val screenshot = File(context.getExternalFilesDir(null), "intl-screen.png")
      scenario.onActivity { activity ->
        val root = activity.findViewById<View>(android.R.id.content)
        val bitmap = Bitmap.createBitmap(root.width, root.height, Bitmap.Config.ARGB_8888)
        root.draw(Canvas(bitmap))
        screenshot.outputStream().use {
          assertTrue("Screenshot capture failed", bitmap.compress(Bitmap.CompressFormat.PNG, 100, it))
        }
      }
      println("Intl screen screenshot: ${screenshot.absolutePath}")
    }
  }
}
