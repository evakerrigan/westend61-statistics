/**
 * Centralised, validated access to environment variables.
 * Read env values from here instead of touching `import.meta.env` directly.
 */
const getEnvVar = (key: string, fallback?: string): string => {
  const value = import.meta.env[key] ?? fallback;

  if (value === undefined) {
    throw new Error(`Missing required environment variable: ${key}`);
  }

  return value as string;
};

export const env = {
  API_URL: getEnvVar('VITE_API_URL', 'https://your-api-url.com/'),
} as const;
