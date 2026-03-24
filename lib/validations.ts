import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string()
    .min(2, 'Username must be at least 2 characters')
    .max(30, 'Username must be under 30 characters')
    .regex(/^[a-zA-Z0-9_ -]+$/, 'Username can only contain letters, numbers, hyphens, and spaces'),
  email: z.string()
    .email('Invalid email format')
    .max(255, 'Email too long'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password too long')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required')
});

export const sessionSchema = z.object({
  category_id: z.string().uuid('Invalid category ID'),
  category_type: z.enum(['primary', 'essential', 'scattered']).optional(),
  title: z.string().max(100).optional()
});

export const categorySchema = z.object({
  name: z.string()
    .min(1, 'Section name is required')
    .max(50, 'Section name too long'),
  emoji: z.string().max(10).optional(),
  color: z.string().optional(),
  category_type: z.enum(['primary', 'essential', 'scattered']).optional(),
  category: z.enum(['primary', 'essential', 'scattered']).optional(),
  is_default: z.boolean().optional()
});
