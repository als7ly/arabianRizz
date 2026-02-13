import { z } from "zod";

export const UserUpdateSchema = z.object({
  firstName: z.string().nullable().optional(),
  lastName: z.string().nullable().optional(),
  username: z.string().optional(),
  photo: z.string().optional(),
  bio: z.string().optional(),
  age: z.number().optional(),
  gender: z.string().optional(),
  occupation: z.string().optional(),
  relationshipGoal: z.string().optional(),
});
