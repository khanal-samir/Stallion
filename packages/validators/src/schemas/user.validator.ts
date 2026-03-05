import { z } from "zod";
import { idSchema } from "./common.validator.js";

export const createUserSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
});

export const updateUserSchema = createUserSchema.partial();
export const updateUserParamsSchema = z.object({ id: idSchema });

export type CreateUser = z.infer<typeof createUserSchema>;
export type UpdateUser = z.infer<typeof updateUserSchema>;
export type UpdateUserParams = z.infer<typeof updateUserParamsSchema>;
