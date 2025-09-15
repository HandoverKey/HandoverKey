/// <reference types="vite/client" />

// Global types for browser APIs and Jest
declare global {
  interface Window {
    setTimeout: typeof globalThis.setTimeout;
    clearTimeout: typeof globalThis.clearTimeout;
    btoa: typeof globalThis.btoa;
    atob: typeof globalThis.atob;
    crypto: typeof globalThis.crypto;
  }

  const setTimeout: typeof globalThis.setTimeout;
  const clearTimeout: typeof globalThis.clearTimeout;
  const btoa: typeof globalThis.btoa;
  const atob: typeof globalThis.atob;
  const crypto: typeof globalThis.crypto;

  // Jest globals
  const jest: typeof import("jest");

  // HTML Element types - extending globals with additional properties
  interface HTMLInputElement {
    // Add any additional input element properties if needed
    placeholder?: string;
  }
  interface HTMLDivElement {
    // Add any additional div element properties if needed  
    role?: string;
  }
  interface HTMLSelectElement {
    // Add any additional select element properties if needed
    multiple?: boolean;
  }
}

export {};
