import crypto from 'crypto';

const ITERATIONS = 210_000;
const KEYLEN = 32;
const DIGEST = 'sha256';

function toHex(buf: Buffer) {
  return buf.toString('hex');
}

function fromHex(hex: string) {
  return Buffer.from(hex, 'hex');
}

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.randomBytes(16);
  const derived = await new Promise<Buffer>((resolve, reject) => {
    crypto.pbkdf2(password, salt, ITERATIONS, KEYLEN, DIGEST, (err, res) => {
      if (err) return reject(err);
      resolve(res);
    });
  });

  return `pbkdf2$${ITERATIONS}$${toHex(salt)}$${toHex(derived)}`;
}

export async function verifyPassword(password: string, passwordHash: string): Promise<boolean> {
  try {
    const parts = passwordHash.split('$');
    if (parts.length !== 4) return false;
    const [, iterStr, saltHex, hashHex] = parts;

    const iterations = Number(iterStr);
    if (!Number.isFinite(iterations) || iterations <= 0) return false;

    const salt = fromHex(saltHex);
    const expected = fromHex(hashHex);

    const derived = await new Promise<Buffer>((resolve, reject) => {
      crypto.pbkdf2(password, salt, iterations, expected.length, DIGEST, (err, res) => {
        if (err) return reject(err);
        resolve(res);
      });
    });

    return crypto.timingSafeEqual(derived, expected);
  } catch {
    return false;
  }
}

