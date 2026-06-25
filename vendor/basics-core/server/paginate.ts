import { Type } from '@sinclair/typebox';

export interface Page<T> { items: T[]; total: number; }

export const PaginationSchema = Type.Object({
    offset: Type.Number({ minimum: 0, default: 0 }),
    limit: Type.Number({ minimum: 1, maximum: 100, default: 20 }),
});
