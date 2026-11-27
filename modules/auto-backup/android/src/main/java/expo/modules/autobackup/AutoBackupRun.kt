package expo.modules.autobackup

import android.content.Context
import android.os.Handler
import android.os.Looper
import com.facebook.react.ReactApplication
import java.lang.ref.WeakReference
import kotlinx.coroutines.CompletableDeferred
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.NonCancellable
import kotlinx.coroutines.withContext

/**
 * Hands a due run to JS and waits for it to report back.
 *
 * With the app closed, the worker starts the React host itself (what Expo's
 * headless loader does). The module exists a little before the bundle has
 * finished loading, so `due` is only sent once JS calls `notifyReady`. The
 * host is left running afterwards, as it would be after any launch.
 *
 * All state lives on the main thread.
 */
internal object AutoBackupRun {
  private val main = Handler(Looper.getMainLooper())
  private var module: WeakReference<AutoBackupModule>? = null
  private var jsReady = false
  private var waiter: CompletableDeferred<Unit>? = null

  suspend fun run(context: Context) {
    val done = CompletableDeferred<Unit>()
    withContext(Dispatchers.Main) {
      waiter?.complete(Unit)
      waiter = done
      val ready = module?.get()?.takeIf { jsReady }
      if (ready != null) ready.emitDue() else ensureJsRuntime(context)
    }
    try {
      done.await()
    } finally {
      withContext(NonCancellable + Dispatchers.Main) {
        if (waiter === done) waiter = null
      }
    }
  }

  fun attach(instance: AutoBackupModule) {
    main.post {
      module = WeakReference(instance)
      jsReady = false
    }
  }

  fun detach(instance: AutoBackupModule) {
    main.post {
      if (module?.get() === instance) {
        module = null
        jsReady = false
      }
    }
  }

  fun markJsReady(instance: AutoBackupModule) {
    main.post {
      module = WeakReference(instance)
      jsReady = true
      if (waiter != null) instance.emitDue()
    }
  }

  fun finish() {
    main.post {
      waiter?.complete(Unit)
      waiter = null
    }
  }

  private fun ensureJsRuntime(context: Context) {
    val host = (context.applicationContext as? ReactApplication)?.reactHost ?: return
    if (host.currentReactContext != null) return
    runCatching { host.start() }
  }
}
