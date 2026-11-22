import dotenv from "dotenv";
import { z } from "zod";

dotenv.config({ quiet: true });

const optionalUrlSchema = z
  .union([z.string().trim().url("Must be a valid URL"), z.literal("")])
  .default("")
  .refine((value) => value === "" || /^https?:\/\/.+/.test(value), {
    message: "Must be a valid http or https URL when provided",
  });

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),

  PORT: z.coerce.number().int().min(1).max(65535),

  CLIENT_URL: z
    .string()
    .trim()
    .refine(
      (value) => {
        const urls = value
          .split(",")
          .map((str) => str.trim())
          .filter(Boolean);

        return (
          urls.length > 0 && urls.every((url) => /^https?:\/\/.+/.test(url))
        );
      },
      {
        message: "CLIENT_URL must be http or https",
      },
    ),


    LOG_LEVEL:z
    .enum(["fatal","error","warn","info","debug","trace","silent"])
    .default('info'),

     MONGODB_URI: z
          .string()
          .trim()
          .min(1, 'MONGODB_URI is required')
          .refine((val) => val.startsWith('mongodb://') || val.startsWith('mongodb+srv://'), {
            message: 'MONGODB_URI must start with mongodb:// or mongodb+srv://',
          }),
});






export const validateEnv = (rawEnv = process.env) => {
  const parsed = envSchema.safeParse(rawEnv);

  if (!parsed.success) {
    const details = parsed.error.issues
      .map((issue) => `${issue.path.join('.') || 'ENV'}: ${issue.message}`)
      .join('; ');
    throw new Error(`Invalid environment configuration: ${details}`);
  }

  const data = parsed.data;
  const allowedOrigins = data.CLIENT_URL.split(',')
    .map((origin) => origin.trim().replace(/\/+$/, ''))
    .filter(Boolean);

  return Object.freeze({
    ...data,
    allowedOrigins: Object.freeze(allowedOrigins),
    isProduction: data.NODE_ENV === 'production',
    isDevelopment: data.NODE_ENV === 'development',
    isTest: data.NODE_ENV === 'test',
    apiDocsEnabled: data.ENABLE_API_DOCS ?? data.NODE_ENV !== 'production',
  });
};




 const env = validateEnv(process.env);
export default env;