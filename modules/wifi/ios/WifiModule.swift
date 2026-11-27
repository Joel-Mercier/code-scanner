import ExpoModulesCore
import NetworkExtension

internal struct ConnectOptions: Record {
  @Field
  var ssid: String = ""

  @Field
  var password: String?

  /// "WPA", "SAE", "WEP" or "nopass".
  @Field
  var security: String = "WPA"

  @Field
  var hidden: Bool = false
}

/// Joins a network with NEHotspotConfiguration: iOS asks the user, then saves it.
public class WifiModule: Module {
  public func definition() -> ModuleDefinition {
    Name("Wifi")

    AsyncFunction("connect") { (options: ConnectOptions, promise: Promise) in
      let configuration: NEHotspotConfiguration
      switch options.security {
      case "nopass":
        configuration = NEHotspotConfiguration(ssid: options.ssid)
      case "WEP":
        configuration = NEHotspotConfiguration(
          ssid: options.ssid, passphrase: options.password ?? "", isWEP: true)
      case "WPA", "SAE":
        configuration = NEHotspotConfiguration(
          ssid: options.ssid, passphrase: options.password ?? "", isWEP: false)
      default:
        // Enterprise networks need a profile: let the app fall back.
        promise.resolve("unsupported")
        return
      }
      configuration.joinOnce = false
      configuration.hidden = options.hidden

      NEHotspotConfigurationManager.shared.apply(configuration) { error in
        guard let error = error as NSError? else {
          promise.resolve("connected")
          return
        }
        if error.domain == NEHotspotConfigurationErrorDomain,
          let code = NEHotspotConfigurationError(rawValue: error.code)
        {
          switch code {
          case .alreadyAssociated:
            promise.resolve("connected")
            return
          case .userDenied:
            promise.resolve("cancelled")
            return
          case .invalidWPAPassphrase, .invalidWEPPassphrase, .invalidSSID:
            promise.resolve("invalid")
            return
          default:
            break
          }
        }
        promise.reject("ERR_WIFI_JOIN", error.localizedDescription)
      }
    }
  }
}
