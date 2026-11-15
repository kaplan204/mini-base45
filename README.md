# mini-base45

Encodes and decodes Base45 as specified in RFC 9285 for compact QR code payloads.

```js
import { encode, decode } from './src/index.js';

const bytes = new Uint8Array([0x41, 0x42]); // "AB"
const text = encode(bytes);                  // "BB8"
const back = decode(text);                   // Uint8Array [65, 66]
```

The public API is `encode(bytes)` and `decode(str)`. `encode` accepts a `Uint8Array` or an array of byte values and returns a Base45 string. `decode` accepts a Base45 string and returns a `Uint8Array`. A `Base45Error` is thrown for malformed input.

## Why this exists

Base45 is a binary-to-text encoding designed for QR codes: it uses a 45-character alphabet that avoids characters which force QR alphanumeric mode to switch to byte mode, and it encodes two bytes as three characters (and one byte as two). This library is a small, dependency-free implementation of the RFC so that generated QR payloads can be decoded without pulling in a larger toolkit. The trade-off is size: Base45 expands binary data by roughly 50%, which is acceptable for the short payloads QR codes typically carry.

The awkward edge is the trailing byte. A single leftover byte is encoded as two Base45 characters, so a valid encoded string has length 2 or 3 modulo 3 — never 1. Decoding a string whose length is 1 modulo 3 throws `Base45Error`. The decoder also rejects groups that decode to values larger than 255 (two characters) or 65535 (three characters), which can happen with syntactically valid but semantically invalid input.
