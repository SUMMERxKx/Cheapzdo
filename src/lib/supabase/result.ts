import type { PostgrestError } from "@supabase/supabase-js";

// Every data access function returns one of these so callers handle errors
// explicitly instead of throwing and swallowing. No silent catches.
export type Result<T> =
  | { ok: true; data: T }
  | { ok: false; error: AppError };

export interface AppError {
  message: string;
  code?: string;
  details?: string;
}

export function ok<T>(data: T): Result<T> {
  return { ok: true, data };
}

export function fail(error: AppError): Result<never> {
  return { ok: false, error };
}

// Turn a Supabase error into our AppError shape with a readable message.
export function fromPostgrestError(e: PostgrestError): AppError {
  return { message: e.message, code: e.code, details: e.details ?? undefined };
}
