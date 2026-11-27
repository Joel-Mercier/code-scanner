import ExpoModulesCore

internal final class InvalidInputException: Exception {
  override var reason: String { "Invalid hex input, iterations or length" }
}

/// JS side: services/lock.ts. Bytes travel as hex, so no text encoding can
/// differ between platforms.
public class Pbkdf2Module: Module {
  public func definition() -> ModuleDefinition {
    Name("Pbkdf2")

    // Async functions run off the JS thread.
    AsyncFunction("sha256") {
      (passwordHex: String, saltHex: String, iterations: Int, length: Int) throws -> String in
      guard
        let password = Pbkdf2.data(hex: passwordHex),
        let salt = Pbkdf2.data(hex: saltHex),
        let derived = Pbkdf2.sha256(
          password: password, salt: salt, iterations: iterations, length: length)
      else { throw InvalidInputException() }
      return Pbkdf2.hex(derived)
    }
  }
}
