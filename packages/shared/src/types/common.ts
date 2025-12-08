import { z } from 'zod';

// Base response types
export const ApiResponseSchema = z.object({
  success: z.boolean(),
  data: z.unknown().optional(),
  error: z.string().optional(),
  timestamp: z.string(),
});

export type ApiResponse<T = unknown> = {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
};

// Pagination
export const PaginationSchema = z.object({
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20),
});

export type Pagination = z.infer<typeof PaginationSchema>;

export const PaginatedResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    items: z.array(dataSchema),
    total: z.number(),
    page: z.number(),
    limit: z.number(),
    totalPages: z.number(),
  });

// Grid position
export const GridPositionSchema = z.object({
  x: z.number().int(),
  y: z.number().int(),
});

export type GridPosition = z.infer<typeof GridPositionSchema>;

// Entity ID
export const EntityIdSchema = z.string().cuid();
export type EntityId = z.infer<typeof EntityIdSchema>;
