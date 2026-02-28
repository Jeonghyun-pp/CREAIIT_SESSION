import { auth } from "./auth";
import { AppError } from "./errors";

export async function requireAdmin() {
  const session = await auth();
  if (!session?.user) {
    throw new AppError("UNAUTHORIZED", "로그인이 필요합니다", 401);
  }
  if (session.user.role !== "ADMIN") {
    throw new AppError("FORBIDDEN", "관리자 권한이 필요합니다", 403);
  }
  return session.user;
}

export async function requireAuth() {
  const session = await auth();
  if (!session?.user) {
    throw new AppError("UNAUTHORIZED", "로그인이 필요합니다", 401);
  }
  return session.user;
}
