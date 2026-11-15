import { test } from 'node:test';
import assert from 'node:assert/strict';
import { encode, decode, Base45Error } from '../src/index.js';

test('encodes and decodes an empty buffer', () => {
  assert.equal(encode(new Uint8Array([])), '');
  assert.deepEqual(decode(''), new Uint8Array([]));
});

test('encodes a single byte', () => {
  // 0x01 = 1 -> 1 % 45 = 1, floor(1/45) = 0 -> '1' + '0' = '10'
  assert.equal(encode(Uint8Array.from([1])), '10');
  assert.deepEqual(decode('10'), Uint8Array.from([1]));
});

test('encodes two bytes', () => {
  // 0x0102 = 258 -> 258 % 45 = 33, floor(258/45)%45 = 5, floor(258/2025) = 0
  // 'X' is index 33, '5' is index 5 -> 'X5' + '0' = 'X50'
  assert.equal(encode(Uint8Array.from([0x01, 0x02])), 'X50');
  assert.deepEqual(decode('X50'), Uint8Array.from([0x01, 0x02]));
});

test('round-trips the RFC 9285 example', () => {
  // "AB" -> 0x4142 -> 16706 -> 16706 % 45 = 11 ('B'), floor(16706/45)%45 = 11 ('B'), floor(16706/2025) = 8 ('8')
  const input = Uint8Array.from([0x41, 0x42]);
  assert.equal(encode(input), 'BB8');
  assert.deepEqual(decode('BB8'), input);
});

test('round-trips arbitrary binary data', () => {
  const input = Uint8Array.from([0x00, 0xff, 0x10, 0x20, 0x30, 0x40, 0x50, 0x60, 0x70, 0x80]);
  const encoded = encode(input);
  assert.deepEqual(decode(encoded), input);
});

test('rejects invalid characters', () => {
  assert.throws(() => decode('A'), Base45Error);
  assert.throws(() => decode('A!'), /invalid character/);
  assert.throws(() => decode('A\n'), /invalid character/);
});

test('rejects trailing single character', () => {
  assert.throws(() => decode('0'), /trailing single character/);
  assert.throws(() => decode('0000'), /trailing single character/);
});

test('rejects values that overflow a byte', () => {
  // 'ZZ' -> 35 + 35*45 = 1610 > 255
  assert.throws(() => decode('ZZ'), /two-character group/);
});

test('rejects values that overflow two bytes', () => {
  // ':::' -> 44 + 44*45 + 44*2025 = 44 + 1980 + 89100 = 91124 > 65535
  assert.throws(() => decode(':::'), /three-character group/);
});

test('accepts an array of bytes', () => {
  assert.equal(encode([0x41, 0x42]), 'BB8');
});

test('rejects non-byte input to encode', () => {
  assert.throws(() => encode('AB'), TypeError);
  assert.throws(() => encode(42), TypeError);
});

test('rejects non-string input to decode', () => {
  assert.throws(() => decode(42), TypeError);
});
