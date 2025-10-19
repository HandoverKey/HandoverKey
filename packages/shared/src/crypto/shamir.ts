import { ShamirShare } from "../types/crypto";
import { v4 as uuidv4 } from "uuid";

export class ShamirSecretSharing {
  private static readonly PRIME = 2n ** 31n - 1n; // Smaller prime for better handling

  static splitSecret(
    secret: string,
    totalShares: number,
    threshold: number,
  ): ShamirShare[] {
    if (threshold > totalShares) {
      throw new Error("Threshold cannot be greater than total shares");
    }

    if (threshold < 2) {
      throw new Error("Threshold must be at least 2");
    }

    // Convert secret to bytes and then to numbers for processing
    const secretBytes = new TextEncoder().encode(secret);
    const shares: ShamirShare[] = [];

    // Process each byte separately to avoid large number issues
    const byteShares: number[][][] = [];

    for (let byteIndex = 0; byteIndex < secretBytes.length; byteIndex++) {
      const secretByte = BigInt(secretBytes[byteIndex]);
      const coefficients = [secretByte];

      // Generate random coefficients for this byte
      for (let i = 1; i < threshold; i++) {
        coefficients.push(this.generateRandomCoefficient());
      }

      const currentByteShares: number[][] = [];

      // Generate shares for this byte
      for (let shareIndex = 1; shareIndex <= totalShares; shareIndex++) {
        const x = BigInt(shareIndex);
        const y = this.evaluatePolynomial(coefficients, x);
        currentByteShares.push([shareIndex, Number(y)]);
      }

      byteShares.push(currentByteShares);
    }

    // Combine all byte shares into final shares
    for (let shareIndex = 0; shareIndex < totalShares; shareIndex++) {
      const shareData: number[][] = [];

      for (let byteIndex = 0; byteIndex < secretBytes.length; byteIndex++) {
        shareData.push(byteShares[byteIndex][shareIndex]);
      }

      shares.push({
        id: uuidv4(),
        share: JSON.stringify(shareData),
        threshold,
        totalShares,
      });
    }

    return shares;
  }

  static reconstructSecret(shares: ShamirShare[]): string {
    if (shares.length < 2) {
      throw new Error("At least 2 shares are required for reconstruction");
    }

    const threshold = shares[0].threshold;
    if (shares.length < threshold) {
      throw new Error(`Need at least ${threshold} shares for reconstruction`);
    }

    // Parse share data
    const shareData: number[][][] = shares
      .slice(0, threshold)
      .map((share) => JSON.parse(share.share));

    // Determine the length of the original secret
    const secretLength = shareData[0].length;
    const reconstructedBytes: number[] = [];

    // Reconstruct each byte
    for (let byteIndex = 0; byteIndex < secretLength; byteIndex++) {
      const points: [bigint, bigint][] = [];

      for (let shareIndex = 0; shareIndex < threshold; shareIndex++) {
        const [x, y] = shareData[shareIndex][byteIndex];
        points.push([BigInt(x), BigInt(y)]);
      }

      const reconstructedByte = this.lagrangeInterpolation(points);
      reconstructedBytes.push(Number(reconstructedByte));
    }

    // Convert back to string
    const reconstructedUint8Array = new Uint8Array(reconstructedBytes);
    return new TextDecoder().decode(reconstructedUint8Array);
  }

  private static generateRandomCoefficient(): bigint {
    // Use Web Crypto API (available in both browser and Node.js 16+)
    const cryptoObj = this.getCrypto();
    const randomValue = cryptoObj.getRandomValues(new Uint32Array(1))[0];
    return BigInt(randomValue) % this.PRIME;
  }

  private static getCrypto(): Crypto {
    // Modern approach: use globalThis.crypto which is available in Node.js 16+ and all modern browsers
    if (typeof globalThis !== "undefined" && globalThis.crypto) {
      return globalThis.crypto;
    }

    // Browser fallback
    if (typeof window !== "undefined" && window.crypto) {
      return window.crypto;
    }

    // Node.js fallback - check if crypto is available on global
    if (typeof global !== "undefined" && (global as Record<string, unknown>).crypto) {
      return (global as Record<string, unknown>).crypto as Crypto;
    }

    throw new Error(
      "Web Crypto API not available. Please ensure you are using Node.js 16+ or a modern browser.",
    );
  }

  private static evaluatePolynomial(coefficients: bigint[], x: bigint): bigint {
    let result = 0n;
    let power = 1n;

    for (const coefficient of coefficients) {
      result = (result + ((coefficient * power) % this.PRIME)) % this.PRIME;
      power = (power * x) % this.PRIME;
    }

    return result;
  }

  private static lagrangeInterpolation(points: [bigint, bigint][]): bigint {
    let result = 0n;

    for (let i = 0; i < points.length; i++) {
      const [xi, yi] = points[i];
      let numerator = 1n;
      let denominator = 1n;

      for (let j = 0; j < points.length; j++) {
        if (i !== j) {
          const [xj] = points[j];
          numerator = (numerator * (0n - xj)) % this.PRIME;
          denominator = (denominator * (xi - xj)) % this.PRIME;
        }
      }

      // Handle negative values
      if (numerator < 0n) numerator = (numerator + this.PRIME) % this.PRIME;
      if (denominator < 0n)
        denominator = (denominator + this.PRIME) % this.PRIME;

      const denominatorInverse = this.modInverse(denominator);
      const lagrangeCoeff = (numerator * denominatorInverse) % this.PRIME;
      const term = (yi * lagrangeCoeff) % this.PRIME;
      result = (result + term) % this.PRIME;
    }

    return result;
  }

  private static modInverse(a: bigint): bigint {
    let [oldR, r] = [a, this.PRIME];
    let [oldS, s] = [1n, 0n];
    let [oldT, t] = [0n, 1n];

    while (r !== 0n) {
      const quotient = oldR / r;
      [oldR, r] = [r, oldR - quotient * r];
      [oldS, s] = [s, oldS - quotient * s];
      [oldT, t] = [t, oldT - quotient * t];
    }

    return ((oldS % this.PRIME) + this.PRIME) % this.PRIME;
  }
}
