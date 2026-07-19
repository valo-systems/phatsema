import { z } from 'zod';

const schema = z.object({
  VITE_API_BASE: z.string().default('/api/v1'),
  VITE_DEMO_MODE: z
    .string()
    .default('true')
    .transform((v) => v === 'true'),
  VITE_APP_VERSION: z.string().default('1.0.0-dev'),
});

const parsed = schema.safeParse(import.meta.env);

if (!parsed.success) {
  throw new Error(`Invalid frontend environment: ${parsed.error.message}`);
}

export const env = {
  apiBase: parsed.data.VITE_API_BASE,
  demoMode: parsed.data.VITE_DEMO_MODE,
  appVersion: parsed.data.VITE_APP_VERSION,
};
