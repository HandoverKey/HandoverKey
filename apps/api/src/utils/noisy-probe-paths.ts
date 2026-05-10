const NOISY_PROBE_EXACT_PATHS = new Set([
  "/application.properties",
  "/application.yml",
  "/app-config.json",
  "/config.js",
  "/config.json",
  "/config.env",
  "/env.js",
  "/env.json",
  "/firebase-config.json",
  "/manifest.webmanifest",
  "/openapi.json",
  "/runtime-config.js",
  "/secrets.json",
  "/secrets.yml",
  "/service-account.json",
  "/settings.json",
  "/settings.py",
  "/swagger.json",
  "/__env.js",
  "/__/firebase/init.json",
]);

const NOISY_PROBE_PREFIXES = [
  "/.aws/",
  "/.docker/",
  "/.env",
  "/.git/",
  "/.ssh/",
  "/admin/.env",
  "/api/.env",
  "/app/.env",
  "/backend/.env",
  "/config/",
  "/public/.env",
  "/storage/logs/",
];

const NOISY_PROBE_PATTERNS = [
  /^\/api\/(env|config|settings)(?:$|\/)/i,
  /^\/api\/v[0-9]+\/(env|config|settings)(?:$|\/)/i,
  /^\/.+\.php$/i,
];

export function normalizeRequestPath(path: string): string {
  const [withoutQuery] = path.split("?");
  return withoutQuery || "/";
}

export function isNoisyProbePath(path: string): boolean {
  const normalizedPath = normalizeRequestPath(path).toLowerCase();

  if (NOISY_PROBE_EXACT_PATHS.has(normalizedPath)) {
    return true;
  }

  if (
    NOISY_PROBE_PREFIXES.some((prefix) => normalizedPath.startsWith(prefix))
  ) {
    return true;
  }

  return NOISY_PROBE_PATTERNS.some((pattern) => pattern.test(normalizedPath));
}
