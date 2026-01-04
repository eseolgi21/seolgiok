// src/lib/crypto.ts
import crypto from "node:crypto";

export type AesGcmCipher = {
  cipherTextB64: string;
  ivB64: string;
  tagB64: string;
};

const KEY_ALG = "aes-256-gcm" as const;

export function getAes256GcmKeyFromEnv(): Buffer {
  const key = process.env.CRED_ENC_KEY_B64;
  if (!key) {
    throw new Error("CRED_ENC_KEY_B64 is not set");
  }
  const buf = Buffer.from(key, "base64");
  if (buf.length !== 32) {
    throw new Error("CRED_ENC_KEY_B64 must decode to 32 bytes for AES-256-GCM");
  }
  return buf;
}

export function encryptAesGcm(plain: string, key: Buffer): AesGcmCipher {
  const iv = crypto.randomBytes(12); // GCM 권장 IV 12 bytes
  const cipher = crypto.createCipheriv(KEY_ALG, key, iv);
  const encrypted = Buffer.concat([
    cipher.update(plain, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return {
    cipherTextB64: encrypted.toString("base64"),
    ivB64: iv.toString("base64"),
    tagB64: tag.toString("base64"),
  };
}
