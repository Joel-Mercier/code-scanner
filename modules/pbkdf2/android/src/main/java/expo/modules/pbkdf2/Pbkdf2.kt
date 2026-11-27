package expo.modules.pbkdf2

import javax.crypto.Mac
import javax.crypto.spec.SecretKeySpec

/**
 * PBKDF2-HMAC-SHA256 (RFC 8018) on the password's raw bytes. Written out
 * rather than through SecretKeyFactory, whose PBEKeySpec takes a char[] and
 * encodes it itself: here the bytes are exactly the ones JS hashes.
 */
internal object Pbkdf2 {
  private const val H_LEN = 32

  fun sha256(password: ByteArray, salt: ByteArray, iterations: Int, length: Int): ByteArray {
    require(iterations > 0 && length > 0)
    val mac = Mac.getInstance("HmacSHA256")
    // SecretKeySpec refuses an empty key. HMAC pads keys with zeros to its
    // block size, so one zero byte is the very same key.
    mac.init(SecretKeySpec(if (password.isEmpty()) ByteArray(1) else password, "HmacSHA256"))
    val out = ByteArray(length)
    val blocks = (length + H_LEN - 1) / H_LEN
    for (block in 1..blocks) {
      mac.update(salt)
      mac.update(
        byteArrayOf(
          (block ushr 24).toByte(),
          (block ushr 16).toByte(),
          (block ushr 8).toByte(),
          block.toByte(),
        ),
      )
      var u = mac.doFinal()
      val t = u.copyOf()
      for (i in 1 until iterations) {
        u = mac.doFinal(u)
        for (k in t.indices) t[k] = (t[k].toInt() xor u[k].toInt()).toByte()
      }
      val offset = (block - 1) * H_LEN
      System.arraycopy(t, 0, out, offset, minOf(H_LEN, length - offset))
    }
    return out
  }

  fun bytes(hex: String): ByteArray {
    require(hex.length % 2 == 0)
    return ByteArray(hex.length / 2) { i -> hex.substring(i * 2, i * 2 + 2).toInt(16).toByte() }
  }

  fun hex(bytes: ByteArray): String = bytes.joinToString("") { "%02x".format(it) }
}
