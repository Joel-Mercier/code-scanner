package expo.modules.wifi

import android.app.Activity
import android.content.Intent
import android.net.wifi.WifiNetworkSuggestion
import android.os.Build
import android.provider.Settings
import androidx.annotation.RequiresApi
import expo.modules.kotlin.Promise
import expo.modules.kotlin.functions.Queues
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record

class ConnectOptions : Record {
  @Field
  val ssid: String = ""

  @Field
  val password: String? = null

  /** "WPA", "SAE", "WEP" or "nopass". */
  @Field
  val security: String = "WPA"

  @Field
  val hidden: Boolean = false
}

private const val REQUEST_ADD_NETWORK = 0x5717

/**
 * Saves a network through the system "Save this network?" dialog
 * (Settings.ACTION_WIFI_ADD_NETWORKS, Android 11+). It stays saved like one
 * the user added, and needs no permission. Older versions and WEP report
 * "unsupported" so the app can fall back to the Wi-Fi settings.
 */
class WifiModule : Module() {
  private var pending: Promise? = null

  override fun definition() = ModuleDefinition {
    Name("Wifi")

    AsyncFunction("connect") { options: ConnectOptions, promise: Promise ->
      if (Build.VERSION.SDK_INT < Build.VERSION_CODES.R) {
        promise.resolve("unsupported")
        return@AsyncFunction
      }
      addNetwork(options, promise)
    }.runOnQueue(Queues.MAIN)

    OnActivityResult { _, payload ->
      if (payload.requestCode != REQUEST_ADD_NETWORK) return@OnActivityResult
      val promise = pending ?: return@OnActivityResult
      pending = null
      if (payload.resultCode != Activity.RESULT_OK) {
        promise.resolve("cancelled")
        return@OnActivityResult
      }
      val failed = Build.VERSION.SDK_INT >= Build.VERSION_CODES.R &&
        payload.data
          ?.getIntegerArrayListExtra(Settings.EXTRA_WIFI_NETWORK_RESULT_LIST)
          ?.firstOrNull() == Settings.ADD_WIFI_RESULT_ADD_OR_UPDATE_FAILED
      promise.resolve(if (failed) "failed" else "saved")
    }
  }

  @RequiresApi(Build.VERSION_CODES.R)
  private fun addNetwork(options: ConnectOptions, promise: Promise) {
    val activity = appContext.currentActivity
    if (activity == null) {
      promise.resolve("unsupported")
      return
    }
    val password = options.password ?: ""
    val suggestion = try {
      val builder = WifiNetworkSuggestion.Builder()
        .setSsid(options.ssid)
        .setIsHiddenSsid(options.hidden)
      when (options.security) {
        "WPA" -> builder.setWpa2Passphrase(password)
        "SAE" -> builder.setWpa3Passphrase(password)
        "nopass" -> Unit
        // WEP and enterprise networks can't be suggested.
        else -> {
          promise.resolve("unsupported")
          return
        }
      }
      builder.build()
    } catch (error: IllegalArgumentException) {
      // An SSID or passphrase the system rejects (length, characters).
      promise.resolve("invalid")
      return
    }
    val intent = Intent(Settings.ACTION_WIFI_ADD_NETWORKS).apply {
      putParcelableArrayListExtra(Settings.EXTRA_WIFI_NETWORK_LIST, arrayListOf(suggestion))
    }
    pending?.resolve("cancelled")
    pending = promise
    try {
      activity.startActivityForResult(intent, REQUEST_ADD_NETWORK)
    } catch (error: Exception) {
      pending = null
      promise.resolve("unsupported")
    }
  }
}
