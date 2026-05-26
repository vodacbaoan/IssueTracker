import { z } from 'zod';

const emailSchema = z
  .string()
  .trim()
  .email()
  .transform((email) => email.toLowerCase());

const passwordSchema = z.string().min(8).max(72);

export const signupBodySchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: emailSchema,
  password: passwordSchema,
});

export const loginBodySchema = z.object({
  email: emailSchema,
  password: z.string().min(1).max(72),
});

export type SignupBody = z.infer<typeof signupBodySchema>;
export type LoginBody = z.infer<typeof loginBodySchema>;
