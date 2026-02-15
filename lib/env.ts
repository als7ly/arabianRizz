import { z } from "zod";

const envSchema = z.object({
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().min(1),
  CLERK_SECRET_KEY: z.string().min(1),
  MONGODB_URI: z.string().url(),
  OPENROUTER_API_KEY: z.string().min(1),
  STRIPE_SECRET_KEY: z.string().min(1),
  STRIPE_WEBHOOK_SECRET: z.string().min(1),
  NEXT_PUBLIC_SERVER_URL: z.string().url(),
  NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: z.string().min(1),
  CLOUDINARY_API_KEY: z.string().min(1),
  CLOUDINARY_API_SECRET: z.string().min(1),
  // Stripe Price IDs
  NEXT_PUBLIC_STRIPE_STARTER_PRICE_ID: z.string().optional(),
  NEXT_PUBLIC_STRIPE_PLAYBOY_PRICE_ID: z.string().optional(),
  NEXT_PUBLIC_STRIPE_RIZZ_GOD_PRICE_ID: z.string().optional(),
  // Optional but recommended
  OPENAI_API_KEY: z.string().optional(),
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM_ADDRESS: z.string().optional(),
});

export const env = envSchema.parse(process.env);

// Type inference for global use
declare global {
  namespace NodeJS {
    interface ProcessEnv extends z.infer<typeof envSchema> {}
  }
}
