import { z } from "zod";
import { DESCRICAO_MAX, TITULO_MAX } from "./task-limits";

export const titulo = z
  .string({ error: "Title is required." })
  .trim()
  .min(1, "Title is required.")
  .max(TITULO_MAX, `Title must be at most ${TITULO_MAX} characters.`);

export const descricao = z
  .string({ error: "Description must be text." })
  .trim()
  .max(DESCRICAO_MAX, `Description must be at most ${DESCRICAO_MAX} characters.`);
