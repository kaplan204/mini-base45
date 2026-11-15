/**
 * Base45 encoder/decoder as specified in RFC 9285.
 *
 * The alphabet is chosen so that every character is safe in QR codes
 * (alphanumeric mode) and in URIs. The encoding packs two bytes into
 * three base-45 digits and one byte into two digits, which makes the
 * output about 1.5x the input size for binary data.
 */

const ALPHABET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ $%*+-./:';

/**
 * Error thrown for malformed Base45 input.
 */
export class Base45Error extends Error {
  constructor(message) {
    super(message);
    this.name = 'Base45Error';
  }
}

/**
 * Encode a Uint8Array (or array of byte values) to a Base45 string.
 *
 * @param {Uint8Array|number[]} bytes
 * @returns {string}
 */
export function encode(bytes) {
  if (!(bytes instanceof Uint8Array)) {
    if (Array.isArray(bytes)) {
      bytes = Uint8Array.from(bytes);
    } else {
      throw new TypeError('encode expects a Uint8Array or an array of bytes');
    }
  }

  let out = '';
  for (let i = 0; i < bytes.length; i += 2) {
    if (i + 1 < bytes.length) {
      // Two bytes -> three Base45 characters.
      const n = (bytes[i] << 8) | bytes[i + 1];
      out += ALPHABET[n % 45];
      out += ALPHABET[Math.floor(n / 45) % 45];
      out += ALPHABET[Math.floor(n / 2025)];
    } else {
      // One leftover byte -> two Base45 characters.
      const n = bytes[i];
      out += ALPHABET[n % 45];
      out += ALPHABET[Math.floor(n / 45)];
    }
  }
  return out;
}

/**
 * Decode a Base45 string to a Uint8Array.
 *
 * @param {string} str
 * @returns {Uint8Array}
 * @throws {Base45Error} if the string contains invalid characters or
 *   represents a value that is too large for the decoded byte length.
 */
export function decode(str) {
  if (typeof str !== 'string') {
    throw new TypeError('decode expects a string');
  }

  const chars = [];
  for (let i = 0; i < str.length; i++) {
    const c = str[i];
    const idx = ALPHABET.indexOf(c);
    if (idx === -1) {
      throw new Base45Error(`invalid character '${c}' at position ${i}`);
    }
    chars.push(idx);
  }

  const out = [];
  let i = 0;
  while (i < chars.length) {
    const remaining = chars.length - i;
    if (remaining === 1) {
      // A single trailing character cannot form a valid group.
      throw new Base45Error('invalid length: trailing single character');
    } else if (remaining === 2) {
      const n = chars[i] + chars[i + 1] * 45;
      if (n > 255) {
        throw new Base45Error('invalid value for two-character group');
      }
      out.push(n);
      i += 2;
    } else {
      const n = chars[i] + chars[i + 1] * 45 + chars[i + 2] * 2025;
      if (n > 65535) {
        throw new Base45Error('invalid value for three-character group');
      }
      out.push((n >> 8) & 0xff);
      out.push(n & 0xff);
      i += 3;
    }
  }
  return Uint8Array.from(out);
}
