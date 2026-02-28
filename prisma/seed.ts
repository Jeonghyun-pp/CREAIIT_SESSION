import path from "node:path";
import { config } from "dotenv";
config({ path: path.join(__dirname, "..", ".env.local") });

import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import bcrypt from "bcryptjs";

const pool = new Pool({ connectionString: process.env.DATABASE_URL! });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  // Create admin user
  const adminEmail = process.env.ADMIN_EMAIL || "admin@creait.kr";
  const adminPassword = process.env.ADMIN_PASSWORD || "admin1234";
  const passwordHash = await bcrypt.hash(adminPassword, 10);

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: { passwordHash, role: "ADMIN", status: "ACTIVE" },
    create: {
      email: adminEmail,
      name: "관리자",
      passwordHash,
      role: "ADMIN",
      status: "ACTIVE",
    },
  });
  console.log(`Admin user ready: ${adminEmail}`);

  // Delete existing sessions to refresh with latest content (cascade deletes blocks)
  await prisma.session.deleteMany({
    where: { id: { in: ["session-day1", "session-day2"] } },
  });

  const session1 = await prisma.session.create({
    data: {
      id: "session-day1",
      title: "1일차 세션: AI 기초와 프롬프트 엔지니어링",
      date: new Date("2026-03-08"),
      summary:
        "AI의 기본 개념과 LLM(대규모 언어 모델)의 작동 원리를 배우고, 효과적인 프롬프트를 작성하는 방법을 실습합니다.",
      goals: [
        "AI와 LLM의 기본 개념 이해하기",
        "프롬프트 엔지니어링 기법 학습하기",
        "ChatGPT/Claude를 활용한 실습",
      ],
      prerequisites: ["노트북", "OpenAI 또는 Anthropic 계정"],
      published: true,
      blocks: {
        create: [
          { order: 0, type: "FLOW", title: "오프닝 & 아이스브레이킹", description: "학회 소개, 팀원 소개, 세션 개요 안내" },
          { order: 1, type: "FLOW", title: "AI/LLM 기초 이론", description: "Transformer 아키텍처, 토큰화, 생성 과정 설명" },
          { order: 2, type: "FLOW", title: "프롬프트 엔지니어링 실습", description: "Zero-shot, Few-shot, Chain-of-Thought 기법 실습" },
          { order: 3, type: "FLOW", title: "과제 안내 & 마무리", description: "과제 설명 및 Q&A" },
          { order: 4, type: "TIMELINE", title: "오프닝", description: "학회 소개 및 아이스브레이킹", startTime: "14:00", endTime: "14:20" },
          { order: 5, type: "TIMELINE", title: "이론 강의", description: "AI/LLM 기초 이론", startTime: "14:20", endTime: "15:10" },
          { order: 6, type: "TIMELINE", title: "쉬는 시간", description: "", startTime: "15:10", endTime: "15:20" },
          { order: 7, type: "TIMELINE", title: "실습", description: "프롬프트 엔지니어링 실습", startTime: "15:20", endTime: "16:30" },
          { order: 8, type: "TIMELINE", title: "과제 안내", description: "과제 설명 및 Q&A", startTime: "16:30", endTime: "17:00" },
        ],
      },
    },
  });

  const session2 = await prisma.session.create({
    data: {
      id: "session-day2",
      title: "2일차 세션: AI를 쓰는 사람이 아니라 설계하는 사람으로",
      date: new Date("2026-03-09"),
      summary:
        "AI를 채팅 도구로 사용하는 상태에서 AI를 활용해 실행 가능한 결과물을 만드는 사람으로 사고방식을 전환한다. 오늘은 세팅이 아니라 사고 전환이다.",
      goals: [
        "AI를 로컬 개발 환경에 연결하는 방법",
        "작업을 사라지지 않게 기록하는 방법",
        "실행되는 웹을 AI와 함께 만들어보는 경험",
        "평균적인 결과를 벗어나기 위한 맥락 설계 방법",
      ],
      prerequisites: ["노트북", "Node.js 설치", "Anthropic API Key"],
      published: true,
      blocks: {
        create: [
          {
            order: 0,
            type: "FLOW",
            title: "① 방향 설정",
            description: `이번 학기 구조:
- 중간 전: AI 빌딩 + 산학
- 중간 후: 팀빌딩 → 창업 설계 → 연사

우리가 키우는 능력:
1) AI 활용 능력
2) 실행력
3) 프로덕트 제작 경험

오늘의 의미:
AI를 잘 "쓰는 법"이 아니라 AI를 다루는 사고를 배우는 날이다.`,
          },
          {
            order: 1,
            type: "FLOW",
            title: "② Claude Code 설치",
            description: `■ Node.js란 무엇인가?
Node.js는 자바스크립트를 브라우저 밖에서 실행하게 해주는 런타임이다.

왜 필요한가?
- Next.js는 Node 위에서 실행된다.
- Claude Code도 Node 환경에서 실행된다.
- 즉, Node는 실행 엔진이다.

비유: Node는 엔진이다. 엔진이 없으면 아무것도 움직이지 않는다.

■ API Key란 무엇인가?
AI 서버에 접속하기 위한 인증 키.

왜 필요한가?
- Claude Code는 로컬 프로그램
- 실제 AI 모델은 서버에 존재
- API Key는 출입증 역할

이제 우리는 AI를 내 컴퓨터 안으로 가져왔다.`,
          },
          {
            order: 2,
            type: "FLOW",
            title: "③ GitHub 기본 활용",
            description: `왜 Git을 지금 배우는가?
AI로 만든 결과는 사라지면 안 된다.

Git은 변경 기록 시스템이다.
무엇이, 언제, 왜 바뀌었는지 기록한다.

오늘 다루는 범위:
- clone
- branch 생성
- commit
- push
- pull

commit의 의미:
단순 저장이 아니라 되돌릴 수 있는 지점 만들기.`,
          },
          {
            order: 3,
            type: "FLOW",
            title: "④ 프로젝트 구조 이해",
            description: `[연결] 지금 우리는 AI를 연결했고, 기록하는 법도 배웠다. 그런데 한 가지 문제가 남아 있다. 파일이 뒤죽박죽이면 AI도, 사람도, 기록도 의미를 잃는다. 그래서 다음 단계는 "구조"다.

왜 구조가 필요한가?
AI는 파일 단위로 맥락을 이해한다.
파일 위치가 명확해야 작업 맥락 전달이 쉬워진다.

잘못된 예:
과제_최종 / 과제_진짜최종 / 과제_제출용 → 혼란 발생

기본 구조 예시:
- README.md
- src/
- components/
- assets/

핵심:
구조는 정리가 아니다. 작업 설계다.
AI에게 일하기 좋은 환경을 만드는 것이다.`,
          },
          {
            order: 4,
            type: "FLOW",
            title: "⑤ 바이브코딩 기본 실습",
            description: `■ Next.js란 무엇인가?
React 기반 웹 프레임워크.

왜 필요한가?
- 실제 서비스와 유사한 구조
- 라우팅 + UI + 서버 기능 통합
- 현대 웹 개발 표준

비유: React는 부품이고 Next.js는 완성 조립 키트다.

실습:
1. create-next-app
2. npm run dev
3. localhost 접속
4. Claude Code에 요청

핵심:
- 코드를 배우는 시간이 아니다.
- 의도를 전달하는 시간이다.
- 수정하며 맞춰가는 과정이 핵심이다.`,
          },
          {
            order: 5,
            type: "FLOW",
            title: "⑥ 컨텍스트 엔지니어링",
            description: `[연결] 방금 만든 페이지를 보자. 실행은 되지만, 뭔가 평범하다. 왜 그런가? AI가 틀린 것이 아니다. 판단 기준이 없었기 때문이다. AI는 정보가 부족하면 "평균"을 선택한다.

컨텍스트 4대 요소:
1. 역할
2. 목표
3. 상태
4. 제약

실습 비교:

컨텍스트 없음 → "랜딩페이지 만들어줘"

컨텍스트 포함 → "너는 10년차 웹 디자이너야. AI 학회 페이지를 만든다. 흰 배경, 파란색 포인트. 상단 문구 포함."

결론:
AI의 성능 차이가 아니다. 판단 기준의 차이다.
AI를 잘 쓰는 것은 질문을 길게 쓰는 것이 아니라 판단 기준을 제공하는 것이다.`,
          },
          {
            order: 6,
            type: "FLOW",
            title: "⑦ 과제 안내",
            description: `과제 목표:
- Claude Code 활용
- 3페이지 이상 웹 제작

반드시 포함:
- 역할
- 목표
- 상태
- 제약

제출:
- GitHub 링크 또는 세션 웹

평가 기준:
- 디자인 완성도 아님
- 의도 → 수정 → 개선 과정 중심
- 사고 과정의 명확성
- 기록의 구조성`,
          },
          {
            order: 7,
            type: "FLOW",
            title: "오늘의 진짜 의미",
            description: `AI를 잘 쓰는 법을 배운 것이 아니다.

AI를 설계하고 기록하고 반복 가능하게 만드는 사람이 되는 출발점이다.`,
          },
        ],
      },
    },
  });

  console.log(`Sessions created: ${session1.title}, ${session2.title}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
