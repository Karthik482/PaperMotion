import type { z } from 'zod';
import type { moduleSchema } from '@/lib/lessonSchemas';
export type LessonModule = z.infer<typeof moduleSchema>;
