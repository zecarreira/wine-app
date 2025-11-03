import { z } from "zod";

// Login validation
export const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Password deve ter pelo menos 6 caracteres"),
});

export type LoginFormData = z.infer<typeof loginSchema>;

// Register validation
export const registerSchema = z
  .object({
    name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
    email: z.string().email("Email inválido"),
    password: z.string().min(6, "Password deve ter pelo menos 6 caracteres"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As passwords não coincidem",
    path: ["confirmPassword"],
  });

export type RegisterFormData = z.infer<typeof registerSchema>;

// Create Dinner validation
export const createDinnerSchema = z.object({
  name: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
  event_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida (formato: YYYY-MM-DD)"),
  location: z.string().optional(),
  is_blind: z.boolean().default(true),
});

export type CreateDinnerFormData = z.infer<typeof createDinnerSchema>;

// Rating validation
export const ratingSchema = z.object({
  score: z.number().min(1, "Mínimo: 1").max(10, "Máximo: 10"),
  tasting_notes: z.string().max(500, "Máximo 500 caracteres").optional(),
});

export type RatingFormData = z.infer<typeof ratingSchema>;

// Add Bottle validation
export const addBottleSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  producer: z.string().optional(),
  vintage: z
    .number()
    .int()
    .min(1900)
    .max(new Date().getFullYear() + 1)
    .optional(),
  wine_type: z
    .enum(["red", "white", "rosé", "sparkling", "dessert", "other"])
    .optional(),
  description: z.string().max(500, "Máximo 500 caracteres").optional(),
});

export type AddBottleFormData = z.infer<typeof addBottleSchema>;
