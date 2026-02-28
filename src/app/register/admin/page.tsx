"use client";

import Link from "next/link";
import { useState } from "react";

export default function AdminRegisterPage() {
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const passwordConfirm = formData.get("passwordConfirm") as string;
    const secretCode = formData.get("secretCode") as string;

    if (password !== passwordConfirm) {
      setError("비밀번호가 일치하지 않습니다.");
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError("비밀번호는 6자 이상이어야 합니다.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, secretCode, role: "ADMIN" }),
      });
      const data = await res.json();

      if (!data.ok) {
        throw new Error(data.error?.message || "회원가입에 실패했습니다.");
      }

      setSuccess(true);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="flex min-h-[calc(100vh-56px)] items-center justify-center">
        <div className="w-full max-w-sm rounded-xl border border-gray-200 bg-white p-8 shadow-sm text-center">
          <div className="mb-4 text-4xl">✅</div>
          <h1 className="mb-2 text-xl font-bold text-slate-800">운영진 가입 완료</h1>
          <p className="mb-6 text-sm text-slate-600">
            운영진 계정이 생성되었습니다.<br />
            바로 로그인할 수 있습니다.
          </p>
          <Link
            href="/login"
            className="inline-block rounded-lg bg-blue-600 px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
          >
            로그인 페이지로 이동
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-56px)] items-center justify-center">
      <div className="w-full max-w-sm rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
        <h1 className="mb-1 text-center text-xl font-bold text-slate-800">
          운영진 회원가입
        </h1>
        <p className="mb-6 text-center text-sm text-slate-500">
          운영진 초대 코드가 필요합니다
        </p>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label htmlFor="secretCode" className="mb-1 block text-sm font-medium text-slate-700">
              초대 코드
            </label>
            <input
              id="secretCode"
              name="secretCode"
              type="text"
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="운영진 초대 코드를 입력하세요"
            />
          </div>
          <div>
            <label htmlFor="name" className="mb-1 block text-sm font-medium text-slate-700">
              이름
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="홍길동"
            />
          </div>
          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-medium text-slate-700">
              이메일
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="email@yonsei.ac.kr"
            />
          </div>
          <div>
            <label htmlFor="password" className="mb-1 block text-sm font-medium text-slate-700">
              비밀번호
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              minLength={6}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="6자 이상"
            />
          </div>
          <div>
            <label htmlFor="passwordConfirm" className="mb-1 block text-sm font-medium text-slate-700">
              비밀번호 확인
            </label>
            <input
              id="passwordConfirm"
              name="passwordConfirm"
              type="password"
              required
              minLength={6}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "가입 중..." : "운영진 가입"}
          </button>
        </form>
        <p className="mt-4 text-center text-sm text-slate-500">
          학회원이신가요?{" "}
          <Link href="/register" className="font-medium text-blue-600 hover:text-blue-700">
            학회원 가입
          </Link>
        </p>
      </div>
    </div>
  );
}
