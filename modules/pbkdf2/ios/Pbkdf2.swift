import CommonCrypto
import Foundation

/// PBKDF2-HMAC-SHA256 with CommonCrypto. Kept apart from the module so it
/// can be checked on its own.
enum Pbkdf2 {
  static func sha256(password: Data, salt: Data, iterations: Int, length: Int) -> Data? {
    guard iterations > 0, length > 0 else { return nil }
    var derived = Data(count: length)
    let status = derived.withUnsafeMutableBytes { out in
      password.withUnsafeBytes { pass in
        salt.withUnsafeBytes { saltBytes in
          CCKeyDerivationPBKDF(
            CCPBKDFAlgorithm(kCCPBKDF2),
            pass.bindMemory(to: Int8.self).baseAddress,
            password.count,
            saltBytes.bindMemory(to: UInt8.self).baseAddress,
            salt.count,
            CCPseudoRandomAlgorithm(kCCPRFHmacAlgSHA256),
            UInt32(iterations),
            out.bindMemory(to: UInt8.self).baseAddress,
            length
          )
        }
      }
    }
    return status == kCCSuccess ? derived : nil
  }

  static func data(hex: String) -> Data? {
    guard hex.count % 2 == 0 else { return nil }
    var data = Data(capacity: hex.count / 2)
    var index = hex.startIndex
    while index < hex.endIndex {
      let next = hex.index(index, offsetBy: 2)
      guard let byte = UInt8(hex[index..<next], radix: 16) else { return nil }
      data.append(byte)
      index = next
    }
    return data
  }

  static func hex(_ data: Data) -> String {
    data.map { String(format: "%02x", $0) }.joined()
  }
}
