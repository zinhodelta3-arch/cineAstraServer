import 'server-only';
import { notFound } from 'next/navigation';
import { AuthError, backendAuth } from '@/lib/auth/server';

export async function catalogRecord(collection, reference) {
  if (typeof reference !== 'string' || reference.length > 180 ||
      !/^(?:[1-9]\d{0,9}|[\p{L}\p{N}]+(?:-[\p{L}\p{N}]+)*-[a-f0-9]{16})$/u.test(reference)) notFound();
  try {
    return await backendAuth(`/${collection}/${encodeURIComponent(reference)}`);
  } catch (error) {
    if (error instanceof AuthError && [404, 422].includes(error.status)) notFound();
    throw error;
  }
}
