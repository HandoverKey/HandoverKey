import { deriveKey } from "./key-derivation.js";
import { encrypt, decrypt } from "./encryption.js";
import { generateSalt, toBase64, fromBase64 } from "./utils.js";
import { ValidationError } from "./errors.js";

/**
 * Zero-knowledge share custody.
 *
 * A Shamir key share is wrapped (encrypted) client-side with a per-successor
 * passphrase BEFORE it is ever sent to the server. The server therefore only
 * ever stores opaque ciphertext envelopes and never the passphrases, so it can
 * never reconstruct the master key even if it holds every wrapped share.
 *
 * The owner delivers each passphrase to the corresponding successor through an
 * out-of-band channel (in person, sealed letter, password manager link, etc.).
 */

const ENVELOPE_PREFIX = "hkshare";
const ENVELOPE_VERSION = "v1";
const WRAP_ITERATIONS = 210000;
const PASSPHRASE_MIN_LENGTH = 8;

// Avoid ambiguous characters (0/O, 1/I/l) so passphrases are easy to transcribe.
const PASSPHRASE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

/**
 * Generates a human-friendly, high-entropy passphrase that the owner shares
 * with a successor out-of-band. Format: `XXXXX-XXXXX-XXXXX-XXXXX`.
 *
 * @param groups - Number of 5-character groups (default 4 => ~98 bits).
 */
export function generateSharePassphrase(groups: number = 4): string {
  if (!Number.isInteger(groups) || groups < 2) {
    throw new ValidationError("Passphrase must have at least 2 groups");
  }

  const charCount = groups * 5;
  const randomBytes = crypto.getRandomValues(new Uint8Array(charCount));
  const chars: string[] = [];

  for (let i = 0; i < charCount; i++) {
    chars.push(
      PASSPHRASE_ALPHABET[randomBytes[i] % PASSPHRASE_ALPHABET.length],
    );
    if ((i + 1) % 5 === 0 && i + 1 < charCount) {
      chars.push("-");
    }
  }

  return chars.join("");
}

/**
 * Wraps (encrypts) a Shamir share with a passphrase. The returned string is a
 * self-describing envelope safe to store server-side.
 *
 * The raw share is base64-encoded before encryption so that arbitrary binary
 * bytes survive the encrypt/decrypt (UTF-8 string) round trip intact.
 *
 * @param share - The raw Shamir share bytes.
 * @param passphrase - The out-of-band passphrase known only to owner + successor.
 * @returns Envelope string: `hkshare.v1.<saltB64>.<ivB64>.<ciphertextB64>`.
 */
export async function wrapShare(
  share: Uint8Array,
  passphrase: string,
): Promise<string> {
  if (!(share instanceof Uint8Array) || share.length === 0) {
    throw new ValidationError("Share must be a non-empty Uint8Array");
  }

  if (
    typeof passphrase !== "string" ||
    passphrase.length < PASSPHRASE_MIN_LENGTH
  ) {
    throw new ValidationError(
      `Passphrase must be at least ${PASSPHRASE_MIN_LENGTH} characters`,
    );
  }

  const salt = generateSalt(16);
  const key = await deriveKey(passphrase, salt, {
    iterations: WRAP_ITERATIONS,
  });
  const encrypted = await encrypt(toBase64(share), key, { ivLength: 12 });

  return [
    ENVELOPE_PREFIX,
    ENVELOPE_VERSION,
    toBase64(salt),
    toBase64(encrypted.iv),
    toBase64(encrypted.data),
  ].join(".");
}

/**
 * Unwraps (decrypts) a wrapped share envelope using the passphrase.
 *
 * @param wrapped - Envelope produced by {@link wrapShare}.
 * @param passphrase - The out-of-band passphrase.
 * @returns The raw Shamir share bytes.
 * @throws {DecryptionError} If the passphrase is wrong or data is tampered.
 */
export async function unwrapShare(
  wrapped: string,
  passphrase: string,
): Promise<Uint8Array> {
  if (typeof wrapped !== "string" || wrapped.length === 0) {
    throw new ValidationError("Wrapped share must be a non-empty string");
  }

  if (typeof passphrase !== "string" || passphrase.length === 0) {
    throw new ValidationError("Passphrase must be provided");
  }

  const parts = wrapped.split(".");
  if (
    parts.length !== 5 ||
    parts[0] !== ENVELOPE_PREFIX ||
    parts[1] !== ENVELOPE_VERSION
  ) {
    throw new ValidationError(
      "Unsupported or malformed wrapped share envelope",
    );
  }

  const salt = fromBase64(parts[2]);
  const iv = fromBase64(parts[3]);
  const ciphertext = fromBase64(parts[4]);

  const key = await deriveKey(passphrase, salt, {
    iterations: WRAP_ITERATIONS,
  });

  const shareBase64 = await decrypt(
    { data: ciphertext, iv, algorithm: "AES-256-GCM" },
    key,
  );

  return fromBase64(shareBase64);
}

/**
 * Returns true if the given string looks like a wrapped share envelope.
 */
export function isWrappedShare(value: string | null | undefined): boolean {
  if (typeof value !== "string") {
    return false;
  }
  const parts = value.split(".");
  return (
    parts.length === 5 &&
    parts[0] === ENVELOPE_PREFIX &&
    parts[1] === ENVELOPE_VERSION
  );
}
