import { randomBytes } from 'crypto';

// Short, unambiguous invitation code (no 0/O/1/I/L). 31^8 ≈ 850 billion combinations.
export function makeCode(len = 8) {
  const abc = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  const bytes = randomBytes(len);
  let out = '';
  for (let i = 0; i < len; i++) out += abc[bytes[i] % abc.length];
  return out;
}
