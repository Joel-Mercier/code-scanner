package expo.modules.pbkdf2

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

/**
 * JS side: services/lock.ts. Bytes travel as hex, so no text encoding can
 * differ between platforms. Async functions run off the JS thread.
 */
class Pbkdf2Module : Module() {
  override fun definition() = ModuleDefinition {
    Name("Pbkdf2")

    AsyncFunction("sha256") { passwordHex: String, saltHex: String, iterations: Int, length: Int ->
      Pbkdf2.hex(Pbkdf2.sha256(Pbkdf2.bytes(passwordHex), Pbkdf2.bytes(saltHex), iterations, length))
    }
  }
}
