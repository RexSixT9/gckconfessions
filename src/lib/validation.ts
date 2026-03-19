import { z } from "zod";
import { MAX_MUSIC_LENGTH } from "@/lib/constants";

export const adminLoginSchema = z.object({
  email: z.string().min(1),
  password: z.string().min(1),
});

export const confessionSubmitSchema = z.object({
  message: z.string().max(10000),
  music: z.string().max(MAX_MUSIC_LENGTH * 4).optional().default(""),
  website: z.string().max(200).optional().default(""),
});
