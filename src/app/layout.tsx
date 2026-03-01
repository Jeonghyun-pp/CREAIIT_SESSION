import type { Metadata } from "next";
import { TopNav } from "@/components/layout/TopNav";
import { AuthProvider } from "@/components/providers/AuthProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "CREAI+IT Sessions",
  description: "연세대학교 AI 창업학회 CREAI+IT 세션 관리",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <head>
        <link
          rel="stylesheet"
          as="style"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard.min.css"
        />
      </head>
      <body className="antialiased">
        <AuthProvider>
          <TopNav />
          <main>{children}</main>
        </AuthProvider>
      </body>
    </html>
  );
}
