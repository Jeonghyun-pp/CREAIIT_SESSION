import path from "node:path";
import { config } from "dotenv";
config({ path: path.join(__dirname, "..", ".env.local") });

import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL! });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const day2 = await prisma.session.findUnique({
    where: { id: "session-day2" },
    include: { blocks: { orderBy: { order: "asc" } } },
  });

  if (!day2) {
    console.error("Day 2 session not found!");
    process.exit(1);
  }

  console.log(`Found Day 2: ${day2.id} - ${day2.title}`);
  console.log(`Blocks: ${day2.blocks.length}`);

  // 1. Update session-level: summary에 Next.js 선택 이유 맥락 반영
  await prisma.session.update({
    where: { id: day2.id },
    data: {
      summary: `AI를 채팅 도구로 사용하는 상태에서 AI를 활용해 실행 가능한 결과물을 만드는 사람으로 사고방식을 전환한다.
오늘은 세팅이 아니라 사고 전환이다.
바이브코딩으로 빠르게 결과물을 만드는 경험을 하고, 맥락 주입이 결과를 바꾼다는 것을 체감한다.`,
      goals: [
        "AI를 로컬 개발 환경에 연결하는 방법",
        "작업을 사라지지 않게 기록하는 방법 (Git 기초)",
        "실행되는 웹을 AI와 함께 만들어보는 경험 (바이브코딩)",
        "평균적인 결과를 벗어나기 위한 맥락 주입 방법",
      ],
    },
  });
  console.log("✓ Session metadata updated");

  // 2. Update blocks
  for (const block of day2.blocks) {
    let newDescription: string | undefined;
    let newTitle: string | undefined;

    switch (block.order) {
      case 3: // ④ 프로젝트 구조 이해 → 보편적 프로젝트 구조로
        newDescription = `[연결] 지금 우리는 AI를 연결했고, 기록하는 법도 배웠다. 그런데 한 가지 문제가 남아 있다. 파일이 뒤죽박죽이면 AI도, 사람도, 기록도 의미를 잃는다. 그래서 다음 단계는 "구조"다.

왜 구조가 필요한가?
AI는 파일 단위로 맥락을 이해한다.
파일 위치가 명확해야 작업 맥락 전달이 쉬워진다.

잘못된 예:
과제_최종 / 과제_진짜최종 / 과제_제출용 → 혼란 발생

보편적인 프로젝트 폴더 구조:
- README.md — 프로젝트 설명서
- src/ — 소스 코드
- public/ — 정적 파일 (이미지, 폰트 등)
- docs/ — 문서
- tests/ — 테스트 코드
- .env — 환경 변수 (Git에 올리지 않음)
- .gitignore — Git 제외 목록

핵심:
구조는 정리가 아니다. 작업 설계다.
AI에게 일하기 좋은 환경을 만드는 것이다.
폴더 구조가 명확하면 AI가 파일 간 관계를 더 잘 이해한다.`;
        break;

      case 4: // ⑤ 바이브코딩 기본 실습 → Next.js 선택 이유 추가
        newDescription = `■ Next.js란 무엇인가?
React 기반 웹 프레임워크.

왜 Next.js인가?
1) 바이브코딩으로 빠르게 결과물을 만들기에 적합하다
   - 명령 한 줄로 프로젝트 생성
   - 코드 저장만 하면 바로 화면에 반영
   - AI와 대화하며 즉시 결과를 확인할 수 있다
2) 이번 학기 프로젝트에서의 역할 분리
   - 프론트엔드(UI/웹): Next.js (JavaScript/TypeScript)
   - 백엔드/Agent: Python
   - 오늘은 프론트엔드 경험에 집중한다
   - Day 3부터 Python으로 Agent 백엔드를 다룬다

비유: React는 부품이고 Next.js는 완성 조립 키트다.

실습:
1. create-next-app
2. npm run dev
3. localhost 접속
4. Claude Code에 요청

핵심:
- 코드를 배우는 시간이 아니다.
- 의도를 전달하는 시간이다.
- 수정하며 맞춰가는 과정이 핵심이다.`;
        break;

      case 5: // ⑥ 컨텍스트 엔지니어링 → "맥락 주입의 4대 요소"로 명칭 변경
        newTitle = "⑥ 맥락 주입(Context Injection)";
        newDescription = `[연결] 방금 만든 페이지를 보자. 실행은 되지만, 뭔가 평범하다. 왜 그런가? AI가 틀린 것이 아니다. 판단 기준이 없었기 때문이다. AI는 정보가 부족하면 "평균"을 선택한다.

맥락 주입의 4대 요소:
1. 역할 — AI가 어떤 관점에서 판단할지
2. 목표 — 무엇을 만들어야 하는지
3. 상태 — 현재 어떤 조건/제약이 있는지
4. 제약 — 하지 말아야 할 것, 지켜야 할 것

※ 참고: Day 4에서 다룰 "Context 4요소(Selection/Compression/Framing/Iteration)"는 시스템 설계 레벨의 맥락 통제다. 오늘의 4대 요소는 프롬프트 레벨에서 AI에게 맥락을 주입하는 기초 단위다.

실습 비교:

맥락 없음 → "랜딩페이지 만들어줘"

맥락 주입 → "너는 10년차 웹 디자이너야. AI 학회 페이지를 만든다. 흰 배경, 파란색 포인트. 상단 문구 포함."

결론:
AI의 성능 차이가 아니다. 판단 기준의 차이다.
AI를 잘 쓰는 것은 질문을 길게 쓰는 것이 아니라 판단 기준을 제공하는 것이다.`;
        break;

      case 6: // ⑦ 과제 안내 → 맥락 주입 용어로 통일
        newDescription = `과제 목표:
- Claude Code 활용
- 3페이지 이상 웹 제작

반드시 포함 (맥락 주입의 4대 요소):
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
- 기록의 구조성`;
        break;
    }

    if (newDescription !== undefined || newTitle !== undefined) {
      await prisma.sessionBlock.update({
        where: { id: block.id },
        data: {
          ...(newTitle && { title: newTitle }),
          ...(newDescription !== undefined && { description: newDescription }),
        },
      });
      console.log(`✓ Block ${block.order} (${newTitle || block.title}) updated`);
    }
  }

  // 3. Add new block: 환경 설정 가이드 (UI에서 바로 확인 가능하도록)
  const maxOrder = Math.max(...day2.blocks.map((b) => b.order));
  await prisma.sessionBlock.create({
    data: {
      sessionId: day2.id,
      order: maxOrder + 1,
      type: "FLOW",
      title: "📋 환경 설정 가이드",
      description: `이 가이드는 세션 중 환경 문제가 생겼을 때 참고용입니다.

■ Node.js 설치 확인
터미널(맥: Terminal, 윈도우: PowerShell)을 열고:
  node -v    → v20.x.x 이상이면 OK
  npm -v     → 10.x.x 이상이면 OK
안 되면: https://nodejs.org 에서 LTS 버전 재설치

■ Claude Code 설치
  npm install -g @anthropic-ai/claude-code
설치 후:
  claude --version   → 버전 번호가 나오면 OK

■ API Key 설정
  claude 실행 → 최초 실행 시 API Key 입력 프롬프트

■ 흔한 문제 해결
- "command not found: node"
  → Node.js 설치가 안 됐거나 PATH 미등록. 재설치 후 터미널 재시작.
- "npm ERR! EACCES permission denied"
  → 맥: sudo npm install -g ... / 윈도우: 관리자 권한 PowerShell
- "포트 3000 이미 사용 중"
  → 다른 터미널에서 npm run dev가 이미 실행 중. 종료 후 재실행.
- "ANTHROPIC_API_KEY not set"
  → claude 재실행 또는 .env에 Key 추가 확인

■ Git 기본 명령어 요약
  git clone <URL>       — 원격 저장소 복제
  git add .             — 변경 파일 스테이징
  git commit -m "메시지" — 변경 기록 저장
  git push              — 원격에 업로드
  git pull              — 원격에서 최신 받기`,
    },
  });
  console.log(`✓ New block added: 환경 설정 가이드 (order ${maxOrder + 1})`);

  console.log("\nDay 2 update complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
