import { VaultEntry } from "../types/crypto";
import { Encryption } from "./encryption";
import { v4 as uuidv4 } from "uuid";

export class VaultManager {
  static async createEntry(
    userId: string,
    data: string | Uint8Array,
    key: CryptoKey,
    category?: string,
    tags?: string[],
  ): Promise<VaultEntry> {
    const encryptedData = await Encryption.encrypt(data, key);

    const entry: VaultEntry = {
      id: uuidv4(),
      userId,
      encryptedData,
      category,
      tags,
      version: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return entry;
  }

  static async updateEntry(
    entry: VaultEntry,
    newData: string | Uint8Array,
    key: CryptoKey,
    category?: string,
    tags?: string[],
  ): Promise<VaultEntry> {
    const encryptedData = await Encryption.encrypt(newData, key);

    return {
      ...entry,
      encryptedData,
      category: category ?? entry.category,
      tags: tags ?? entry.tags,
      version: entry.version + 1,
      updatedAt: new Date(),
    };
  }

  static async decryptEntry(
    entry: VaultEntry,
    key: CryptoKey,
  ): Promise<string> {
    return Encryption.decrypt(entry.encryptedData, key);
  }

  static async decryptFileEntry(
    entry: VaultEntry,
    key: CryptoKey,
  ): Promise<Uint8Array> {
    return Encryption.decryptFile(entry.encryptedData, key);
  }

  static async searchEntries(
    entries: VaultEntry[],
    query: string,
    key: CryptoKey,
  ): Promise<VaultEntry[]> {
    const results: VaultEntry[] = [];
    const lowerQuery = query.toLowerCase();

    for (const entry of entries) {
      try {
        const decryptedData = await this.decryptEntry(entry, key);

        if (
          decryptedData.toLowerCase().includes(lowerQuery) ||
          entry.category?.toLowerCase().includes(lowerQuery) ||
          entry.tags?.some((tag: string) =>
            tag.toLowerCase().includes(lowerQuery),
          )
        ) {
          results.push(entry);
        }
      } catch (error) {
        console.error(`Failed to decrypt entry ${entry.id}:`, error);
      }
    }

    return results;
  }

  static getEntriesByCategory(
    entries: VaultEntry[],
    category: string,
  ): VaultEntry[] {
    return entries.filter((entry) => entry.category === category);
  }

  static getEntriesByTag(entries: VaultEntry[], tag: string): VaultEntry[] {
    return entries.filter((entry) =>
      entry.tags?.some((t: string) => t === tag),
    );
  }

  static getCategories(entries: VaultEntry[]): string[] {
    const categories = new Set<string>();
    entries.forEach((entry) => {
      if (entry.category) {
        categories.add(entry.category);
      }
    });
    return Array.from(categories).sort();
  }

  static getTags(entries: VaultEntry[]): string[] {
    const tags = new Set<string>();
    entries.forEach((entry) => {
      entry.tags?.forEach((tag: string) => tags.add(tag));
    });
    return Array.from(tags).sort();
  }

  static validateEntry(entry: VaultEntry): boolean {
    return !!(
      entry.id &&
      entry.userId &&
      entry.encryptedData &&
      entry.encryptedData.data &&
      entry.encryptedData.iv &&
      entry.encryptedData.algorithm &&
      entry.version > 0 &&
      entry.createdAt &&
      entry.updatedAt
    );
  }
}
