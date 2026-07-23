import { z } from "zod";

// Login validation
export const loginSchema = z.object({
  email: z.email("Email inválido"),
  password: z.string().min(6, "Password deve ter pelo menos 6 caracteres"),
});

/** API login body (same as form). */
export const loginApiSchema = loginSchema;

/** API register body — no confirmPassword; role is ignored server-side. */
export const registerApiSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  email: z.email("Email inválido"),
  password: z.string().min(12, "Password deve ter pelo menos 12 caracteres"),
});

// Create Dinner validation (form + API)
export const createDinnerSchema = z.object({
  name: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
  event_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida (formato: YYYY-MM-DD)"),
  location: z.string().optional().nullable(),
  is_blind: z.boolean().default(true),
  is_extra: z.boolean().optional(),
  organizer_id: z.uuid("Organizer ID inválido").nullable().optional(),
});

export type CreateDinnerFormData = z.infer<typeof createDinnerSchema>;

// Rating validation
export const ratingSchema = z.object({
  score: z
    .number()
    .min(1, "Mínimo: 1")
    .max(10, "Máximo: 10")
    .refine((n) => Math.abs(n * 2 - Math.round(n * 2)) < 1e-9, {
      message: "Score deve ser em passos de 0.5",
    }),
  tasting_notes: z.string().max(500, "Máximo 500 caracteres").nullish(),
});

export type RatingFormData = z.infer<typeof ratingSchema>;

// Add Bottle validation
export const addBottleSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  producer: z.string().nullish(),
  vintage: z
    .number()
    .int()
    .min(1900)
    .nullish()
    .refine((y) => y == null || y <= new Date().getFullYear() + 1, {
      message: "Vintage inválido",
    }),
  wine_type: z
    .enum(["red", "white", "rosé", "sparkling", "dessert", "other"])
    .nullish(),
  description: z.string().max(500, "Máximo 500 caracteres").nullish(),
  photo_url: z.url().nullish(),
  position: z.number().int().positive().nullish(),
});

export type AddBottleFormData = z.infer<typeof addBottleSchema>;

export const fineSchema = z.object({
  amount: z.number().positive("Valor deve ser maior que 0"),
  reason: z.string().min(1, "Motivo é obrigatório"),
});

export const paymentCreateSchema = z.object({
  user_id: z.uuid("user_id inválido"),
  base_amount: z.number().int().positive().optional(),
});

export const paymentStatusSchema = z.object({
  status: z.enum(["pending", "paid"]),
});

export const adminRoleSchema = z.object({
  role: z.enum(["guest", "founder"]),
});
