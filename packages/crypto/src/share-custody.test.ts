import {
  generateSharePassphrase,
  wrapShare,
  unwrapShare,
  isWrappedShare,
} from "./share-custody.js";
import { splitSecret, reconstructSecret } from "./shamir.js";
import { ValidationError, DecryptionError } from "./errors.js";

describe("share custody", () => {
  describe("generateSharePassphrase", () => {
    it("generates a grouped passphrase with the default entropy", () => {
      const passphrase = generateSharePassphrase();
      // 4 groups of 5 chars + 3 separators = 23 chars
      expect(passphrase).toMatch(/^[A-Z2-9]{5}(-[A-Z2-9]{5}){3}$/);
    });

    it("supports a custom number of groups", () => {
      const passphrase = generateSharePassphrase(6);
      expect(passphrase.split("-")).toHaveLength(6);
    });

    it("produces unique passphrases", () => {
      const values = new Set(
        Array.from({ length: 50 }, () => generateSharePassphrase()),
      );
      expect(values.size).toBe(50);
    });

    it("rejects fewer than 2 groups", () => {
      expect(() => generateSharePassphrase(1)).toThrow(ValidationError);
    });
  });

  describe("wrapShare / unwrapShare", () => {
    it("round-trips an arbitrary binary share", async () => {
      const share = crypto.getRandomValues(new Uint8Array(34));
      const passphrase = generateSharePassphrase();

      const wrapped = await wrapShare(share, passphrase);
      expect(isWrappedShare(wrapped)).toBe(true);

      const unwrapped = await unwrapShare(wrapped, passphrase);
      expect(Array.from(unwrapped)).toEqual(Array.from(share));
    });

    it("produces different envelopes for the same input (random salt/iv)", async () => {
      const share = crypto.getRandomValues(new Uint8Array(34));
      const passphrase = generateSharePassphrase();
      const a = await wrapShare(share, passphrase);
      const b = await wrapShare(share, passphrase);
      expect(a).not.toEqual(b);
    });

    it("fails to unwrap with the wrong passphrase", async () => {
      const share = crypto.getRandomValues(new Uint8Array(34));
      const wrapped = await wrapShare(share, generateSharePassphrase());
      await expect(
        unwrapShare(wrapped, generateSharePassphrase()),
      ).rejects.toThrow(DecryptionError);
    });

    it("rejects an empty share", async () => {
      await expect(
        wrapShare(new Uint8Array(0), "longenoughpass"),
      ).rejects.toThrow(ValidationError);
    });

    it("rejects a short passphrase", async () => {
      const share = crypto.getRandomValues(new Uint8Array(34));
      await expect(wrapShare(share, "short")).rejects.toThrow(ValidationError);
    });

    it("rejects malformed envelopes", async () => {
      await expect(unwrapShare("not-an-envelope", "pass")).rejects.toThrow(
        ValidationError,
      );
      await expect(unwrapShare("", "pass")).rejects.toThrow(ValidationError);
    });

    it("supports full Shamir split -> wrap -> unwrap -> reconstruct", async () => {
      const secret = crypto.getRandomValues(new Uint8Array(32));
      const shares = splitSecret(secret, 3, 2);
      const passphrases = shares.map(() => generateSharePassphrase());

      const wrapped = await Promise.all(
        shares.map((share, i) => wrapShare(share, passphrases[i])),
      );

      // Two successors unwrap their shares out-of-band and reconstruct.
      const recoveredA = await unwrapShare(wrapped[0], passphrases[0]);
      const recoveredB = await unwrapShare(wrapped[2], passphrases[2]);

      const reconstructed = reconstructSecret([recoveredA, recoveredB], 2);
      expect(Array.from(reconstructed)).toEqual(Array.from(secret));
    });
  });

  describe("isWrappedShare", () => {
    it("returns false for non-envelope values", () => {
      expect(isWrappedShare(null)).toBe(false);
      expect(isWrappedShare(undefined)).toBe(false);
      expect(isWrappedShare("plain-base64-share")).toBe(false);
      expect(isWrappedShare("hkshare.v2.a.b.c")).toBe(false);
    });
  });
});
