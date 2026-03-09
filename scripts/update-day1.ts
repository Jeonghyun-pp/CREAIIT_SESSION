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
  // Find Day 1 session
  const day1 = await prisma.session.findFirst({
    where: { title: { contains: "1일차" } },
    include: { blocks: { orderBy: { order: "asc" } } },
  });

  if (!day1) {
    console.error("Day 1 session not found!");
    process.exit(1);
  }

  console.log(`Found Day 1: ${day1.id} - ${day1.title}`);
  console.log(`Blocks: ${day1.blocks.length}`);

  // 1. Update session-level fields
  await prisma.session.update({
    where: { id: day1.id },
    data: {
      summary: `이 학회가 무엇을 하는 조직인지 명확히 이해한다.
우리는 배우는 곳이 아니라 만드는 조직이라는 기준을 세운다.
한 학기 동안의 방향과 기대치를 정렬한다.
이번 학기 산학 프로젝트(AiNOS × 보험 AI Agent)의 방향을 예고한다.`,
      goals: [
        "Crea+it의 정체성과 '만드는 조직'의 구체적 기준",
        "지난 학기 결과물과 실제 실행 수준",
        "이번 학기 구조와 산학 프로젝트(AiNOS) 방향",
        "학회원 상호 소개 및 개인 목표 선언",
      ],
      prerequisites: ["본인 소개 One-Pager (선수 과제)"],
    },
  });
  console.log("✓ Session metadata updated");

  // 2. Update blocks one by one
  for (const block of day1.blocks) {
    let newDescription: string | undefined;
    let newTitle: string | undefined;

    switch (block.order) {
      case 0: // 오프닝
        newDescription = `질문:
"왜 여기 왔나요?"
이 질문의 목적은 수준을 확인하는 것이 아니다.
기대치를 맞추기 위함이다.
오늘은 기술을 배우는 날이 아니다.
기준을 세우는 날이다.

진행 방식 (10분):
- 각자 사전 과제로 준비한 One-Pager를 화면에 띄우거나 출력해 준비
- 운영진이 먼저 시범 소개 (1분)
- 이후 Block 4에서 전원 자기소개 진행`;
        break;

      case 1: // Crea+it 소개
        newDescription = `Crea+it은:
- AI를 활용해 실행력을 극대화하는 조직
- 결과 중심 문화
- 기록과 설계를 중시하는 팀
"배웠다"는 말은 의미 없다.
"만들었다"만 의미 있다.

"만드는 조직"의 구체적 기준:
1. 매 세션 후 산출물을 제출한다 (코드, 설계 문서, 프로토타입 등)
2. GitHub에 작업 과정을 기록한다
3. 학기가 끝나면 창업 수준의 결과물이 존재한다
4. 과정이 아니라 결과로 증명한다

이 기준은 오늘부터 적용된다.`;
        break;

      case 2: // 지난 학기 결과물 & 실제 팀
        newDescription = `[연결] 우리가 어떤 조직인지 이해했다면,
다음 질문은 이것이다.
"그 기준이 실제로 지켜졌는가?"

실제 팀과 결과:
- Rootedy: AI 기반 식물 진단 서비스
- Resio: 이력서 자동 생성 및 최적화 도구
- AiNOS: 보험 AI Agent 프로토타입 (→ 이번 학기 산학 연결)
- Potentivo Lab: AI 역량 평가 플랫폼
- Luminary: 콘텐츠 큐레이션 AI 서비스
- Undrew: AI 드로잉 보조 도구
- Tripnote: AI 여행 계획 서비스

이 사례를 보여주는 이유는 단 하나다.
이곳은 동아리가 아니라
실제로 실행하는 조직이라는 것을 증명하기 위함이다.`;
        break;

      case 3: // 이번 학기 구조
        newTitle = "이번 학기 구조 & 산학 프로젝트";
        newDescription = `[연결] 이미 실행 사례가 있다면,
이제 중요한 것은 방향이다.
이번 학기는 어디까지 갈 것인가?

중간 전:
AI 빌딩 + 산학 프로젝트
중간 후:
팀빌딩 → 창업 구체화 → 연사 초청
기초 없이 창업은 없다.
설계 없이 실행은 없다.
그래서 우리는
AI 설계 → 산학 → 창업
순서로 간다.

■ 산학 프로젝트 소개 (AiNOS 협력)
이번 학기 산학 프로젝트는 AiNOS와 함께 진행한다.
주제: 보험 AI Agent 개발
- 보험 도메인의 데이터를 분석하고
- 리스크를 추정하며
- 계리 모델에 연결 가능한 AI Agent를 설계·구현한다

왜 보험인가?
- 실제 산업 데이터 기반 프로젝트
- 수리적 구조가 명확해 Agent 설계에 적합
- AiNOS와의 협업으로 실무 피드백 확보 가능
- 4일차부터 본격적으로 보험 도메인에 진입한다

■ 전체 커리큘럼 로드맵
세션 웹(creait-session.vercel.app)에서 11주 전체 일정과 각 세션의 목표를 확인할 수 있다.
각 세션이 어떻게 연결되는지 전체 흐름을 반드시 파악해두자.`;
        break;

      case 4: // 자기소개 & 목표 선언
        newTitle = "자기소개 & 목표 선언 (One-Pager 기반)";
        newDescription = `[연결] 방향이 정해졌다면,
이제 각자의 역할이 필요하다.

진행 방식 (25~30분):
- 사전 과제로 제출한 One-Pager를 기반으로 자기소개
- 1인당 2분 내외
- 포함 내용:
  1. 이름 / 학과 / 학년
  2. 코딩 경험 수준 (없음 ~ 상급)
  3. 사용해본 AI 도구
  4. 이번 학기 목표
  5. 만들고 싶은 것 한 가지

목표를 말로 선언하면 책임이 생긴다.
One-Pager는 학기 말에 다시 꺼내본다.`;
        break;

      case 5: // 오늘의 진짜 의미
        newTitle = "마무리 & 다음 세션 준비";
        newDescription = `오늘은 시작이 아니다.
기준을 세운 날이다.

우리가 세운 기준:
- 매 세션 산출물 제출
- GitHub 기록
- 학기 말 창업 수준 결과물

이 기준이 낮으면 한 학기가 무너진다.
이 기준이 높으면 결과가 나온다.

■ 다음 세션(2일차) 준비물
2일차부터 바로 실습에 들어간다. 아래를 반드시 사전에 준비해올 것:
1. Node.js 설치 (https://nodejs.org — LTS 버전)
   - 설치 후 터미널에서 node -v 로 확인
2. Anthropic API Key 발급 (https://console.anthropic.com)
   - 회원가입 → API Keys → Create Key
   - 무료 크레딧 또는 소액 충전 필요 (예상 비용: 월 $5 이내)
   - Key는 절대 타인과 공유하지 말 것
3. GitHub 계정 생성 (이미 있으면 생략)

설치 중 문제가 생기면 학회 채널에 질문할 것.
준비가 안 되면 2일차 실습 시간이 세팅에 소모된다.`;
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

  console.log("\nDay 1 update complete!");
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
