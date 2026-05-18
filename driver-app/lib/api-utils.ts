import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

export function handleError(error: unknown) {
  console.error("API Error:", error);

  if (error instanceof ZodError) {
    return NextResponse.json(
      { success: false, error: { code: 'VALIDATION_ERROR', details: error.flatten().fieldErrors } },
      { status: 400 }
    );
  }

  if (typeof error === 'object' && error !== null && 'code' in error) {
    const prismaError = error as { code: string; meta?: { target?: string[] } };
    if (prismaError.code === 'P2002') {
      return NextResponse.json(
        { success: false, error: { code: 'CONFLICT', details: `Unique constraint failed on ${prismaError.meta?.target}` } },
        { status: 409 }
      );
    }
  }

  return NextResponse.json(
    { success: false, error: { code: 'INTERNAL_SERVER_ERROR', details: 'An unexpected error occurred' } },
    { status: 500 }
  );
}
