import { z } from 'zod'

export const externalMatchIdSchema = z
  .string()
  .length(16)
  .regex(/^[a-fA-F0-9]+$/)
