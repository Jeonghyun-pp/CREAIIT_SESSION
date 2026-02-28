import { prisma } from "@/lib/db";
import { errorResponse, successResponse, AppError } from "@/lib/errors";
import bcrypt from "bcryptjs";
import { z } from "zod";

const registerSchema = z.object({
  name: z.string().min(1, "이름을 입력해주세요"),
  email: z.string().email("올바른 이메일을 입력해주세요"),
  password: z.string().min(6, "비밀번호는 6자 이상이어야 합니다"),
  role: z.enum(["MEMBER", "ADMIN"]).default("MEMBER"),
  secretCode: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      throw new AppError("VALIDATION", parsed.error.issues[0].message);
    }

    const { name, email, password, role, secretCode } = parsed.data;

    // 운영진 가입: 초대 코드 검증
    if (role === "ADMIN") {
      const validCode = process.env.ADMIN_SECRET_CODE;
      if (!validCode) {
        throw new AppError("FORBIDDEN", "운영진 가입이 비활성화되어 있습니다.", 403);
      }
      if (secretCode !== validCode) {
        throw new AppError("FORBIDDEN", "초대 코드가 올바르지 않습니다.", 403);
      }
    }

    // 이메일 중복 확인
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new AppError("VALIDATION", "이미 등록된 이메일입니다.");
    }

    const passwordHash = await bcrypt.hash(password, 10);

    await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role,
        // 운영진은 즉시 ACTIVE, 학회원은 PENDING
        status: role === "ADMIN" ? "ACTIVE" : "PENDING",
      },
    });

    const message =
      role === "ADMIN"
        ? "운영진 계정이 생성되었습니다."
        : "회원가입이 완료되었습니다. 관리자 승인을 기다려주세요.";

    return successResponse({ message }, 201);
  } catch (err) {
    return errorResponse(err);
  }
}
