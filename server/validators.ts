import { z } from 'zod';

// Username regex rule: 3-20 characters, starts with a letter, contains only letters, numbers, underscores
export const USERNAME_REGEX = /^[a-zA-Z][a-zA-Z0-9_]{2,19}$/;

export const usernameParamSchema = z.string().trim().regex(USERNAME_REGEX, {
  message: 'Username harus 3-20 karakter alfanumerik (diawali huruf)',
});

export const onboardingSchema = z.object({
  username: z.string().trim().regex(USERNAME_REGEX, {
    message: 'Format username tidak valid (3-20 karakter alfanumerik, diawali huruf)',
  }),
  favoriteCategories: z.array(z.string().trim().max(50)).max(10).optional(),
});

export const updateProfileSchema = z.object({
  name: z.string().trim().min(1, 'Nama tidak boleh kosong').max(100, 'Nama maksimal 100 karakter').optional(),
  username: z.string().trim().regex(USERNAME_REGEX, {
    message: 'Username harus 3-20 karakter alfanumerik (diawali huruf)',
  }).optional(),
  favoriteCategories: z.union([
    z.array(z.string().trim().max(50)).max(10),
    z.string().max(500),
  ]).optional(),
});

const sanitizeMinutes = z.preprocess((val) => {
  if (val === undefined || val === null || val === '') return null;
  const num = typeof val === 'string' ? parseInt(val, 10) : Number(val);
  return isNaN(num) ? null : num;
}, z.number().int().min(1, 'Estimasi waktu minimal 1 menit').max(1440, 'Estimasi waktu maksimal 1440 menit (24 jam)').nullable().optional());

export const createQuestSchema = z.object({
  name: z.string().trim().min(1, 'Nama quest wajib diisi').max(150, 'Nama quest maksimal 150 karakter').optional(),
  title: z.string().trim().min(1).max(150).optional(),
  category: z.string().trim().min(1).max(50).default('coding'),
  estimatedMinutes: sanitizeMinutes,
  timeGoalMinutes: sanitizeMinutes,
  duration: sanitizeMinutes,
}).refine((data) => Boolean(data.name || data.title), {
  message: 'Nama quest wajib diisi',
  path: ['name'],
});

export const updateQuestSchema = z.object({
  name: z.string().trim().min(1, 'Nama quest wajib diisi').max(150, 'Nama quest maksimal 150 karakter').optional(),
  title: z.string().trim().min(1).max(150).optional(),
  category: z.string().trim().min(1).max(50).default('coding'),
  estimatedMinutes: sanitizeMinutes,
  timeGoalMinutes: sanitizeMinutes,
  duration: sanitizeMinutes,
}).refine((data) => Boolean(data.name || data.title), {
  message: 'Nama quest wajib diisi',
  path: ['name'],
});

export const friendRequestSchema = z.object({
  friendId: z.string().trim().min(1, 'Invalid friend ID').max(100),
});

export const friendRespondSchema = z.object({
  requestId: z.string().trim().min(1, 'Invalid request ID').max(100),
  action: z.enum(['accept', 'reject'], {
    message: "Aksi harus 'accept' atau 'reject'",
  }),
});

/**
 * Escapes characters with special meaning in SQL LIKE / ILIKE patterns
 */
export function escapeSqlLike(input: string): string {
  return input.replace(/[%_\\]/g, '\\$&');
}
