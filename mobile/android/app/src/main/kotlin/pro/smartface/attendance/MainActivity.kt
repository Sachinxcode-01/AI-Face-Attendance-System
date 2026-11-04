package pro.smartface.attendance

import android.os.Build
import android.os.Bundle
import io.flutter.embedding.android.FlutterActivity

class MainActivity : FlutterActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableHighRefreshRate()
    }

    /**
     * Enforces the display's highest supported refresh rate (90Hz / 120Hz / 144Hz)
     * across modern Android devices for silky smooth 90-120 FPS animations.
     */
    private fun enableHighRefreshRate() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            val display = display ?: return
            val modes = display.supportedModes
            var maxMode = display.mode
            for (mode in modes) {
                if (mode.refreshRate > maxMode.refreshRate) {
                    maxMode = mode
                }
            }
            val params = window.attributes
            params.preferredDisplayModeId = maxMode.modeId
            window.attributes = params
        } else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            @Suppress("DEPRECATION")
            val display = windowManager.defaultDisplay ?: return
            @Suppress("DEPRECATION")
            val modes = display.supportedModes
            var maxRate = 60.0f
            var bestModeId = 0
            for (mode in modes) {
                if (mode.refreshRate > maxRate) {
                    maxRate = mode.refreshRate
                    bestModeId = mode.modeId
                }
            }
            if (bestModeId != 0) {
                val params = window.attributes
                params.preferredDisplayModeId = bestModeId
                window.attributes = params
            }
        }
    }
}
