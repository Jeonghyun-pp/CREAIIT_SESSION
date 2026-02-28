import { NextResponse } from "next/server";

export class AppError extends Error {
  constructor(
    public code: string,
    message: string,
    public status: number = 400
  ) {
    super(message);
  }
}

export function errorResponse(err: unknown) {
  if (err instanceof AppError) {
    return NextResponse.json(
      { ok: false, error: { code: err.code, message: err.message } },
      { status: err.status }
    );
  }
  console.error(err);
  return NextResponse.json(
    { ok: false, error: { code: "INTERNAL", message: "Internal server error" } },
    { status: 500 }
  );
}

export function successResponse<T>(data: T, status = 200) {
  return NextResponse.json({ ok: true, data }, { status });
}
