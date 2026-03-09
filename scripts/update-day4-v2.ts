import path from "node:path";
import { config } from "dotenv";
config({ path: path.join(__dirname, "..", ".env.local") });

import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL! });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const DAY4_ID = "cmm5w437b000ln4ulewvhdzg7";

async function main() {
  const day4 = await prisma.session.findUnique({
    where: { id: DAY4_ID },
    include: { blocks: { orderBy: { order: "asc" } } },
  });

  if (!day4) {
    console.error("Day 4 session not found!");
    process.exit(1);
  }

  console.log(`Found Day 4: ${day4.title}`);
  console.log(`Existing blocks: ${day4.blocks.length}`);

  // ── 1. Session metadata 수정 ──
  await prisma.session.update({
    where: { id: DAY4_ID },
    data: {
      summary: `Agent는 LLM의 확장이 아니라
맥락 설계 파이프라인임을 이해한다.
좋은 Agent와 나쁜 Agent의 차이를
Context 설계 관점에서 명확히 구분한다.
LLM Agent의 고유 한계(환각, 비결정성)를 인식하고,
이를 맥락 설계로 통제하는 방법을 학습한다.
실제 프로덕트의 Context Engineering 사례를 분석하고,
맥락 오염의 유형과 디버깅 방법을 익힌다.`,
      goals: [
        "LLM Agent의 정의 — 보편적 Agent와의 차이, 고유 한계 포함",
        "왜 지금 Agent가 각광받는가",
        "Agent = Context Builder + Loop라는 구조",
        "나쁜 Agent vs 좋은 Agent의 라이브 비교",
        "Context 4요소 (Selection/Compression/Framing/Iteration)",
        "Context Window의 물리적 한계와 실무 전략",
        "실제 프로덕트(Claude Code, Cursor, Perplexity)의 Context Engineering",
        "맥락 오염 유형과 체계적 디버깅 방법",
      ],
    },
  });
  console.log("✓ Session metadata updated");

  // ── 2. 기존 블록 수정 ──
  for (const block of day4.blocks) {
    switch (block.order) {
      // Block 0: 보험 예시 → 범용 예시
      case 0: {
        await prisma.sessionBlock.update({
          where: { id: block.id },
          data: {
            description: `AI Agent는:
- 목표를 가진다
- 환경을 관찰한다
- 판단한다
- 행동한다
- 결과를 다시 반영한다
즉,
목표 지향적이고
자율적이며
반복 루프를 가지는 시스템이다.

■ 그런데, LLM Agent는 일반 Agent와 다르다.

LLM Agent의 고유 특성:
1. 환각(Hallucination)
   — 없는 사실을 그럴듯하게 생성한다.
   — 존재하지 않는 통계, 가짜 인용, 허구의 사실을 자신 있게 말한다.
2. 비결정성(Non-determinism)
   — 같은 입력에도 다른 출력이 나온다.
   — 동일한 요청을 5번 하면 5개의 다른 답이 나올 수 있다.
3. 맥락 의존성(Context Dependency)
   — 주어진 맥락에 따라 결과가 극적으로 달라진다.
   — 맥락이 부족하면 "그럴듯한 쓰레기"를 생성한다.

이 한계를 무시하면 Agent는 위험하다.
이 한계를 설계로 통제하면 Agent는 강력하다.
오늘의 핵심은 "통제"다.

왜 지금 Agent인가?
LLM 단독 시대:
→ 텍스트 생성
Agent 시대:
→ 멀티스텝 자동화
→ Tool 호출
→ 워크플로우 구성
→ 상태 기반 반복
Agent는 생성형 AI를
실제 시스템으로 확장하는 구조다.`,
          },
        });
        console.log(`✓ Block 0 updated (보험 예시 → 범용 예시)`);
        break;
      }

      // Block 3: 나쁜 Agent 데모 → 범용 도메인
      case 3: {
        await prisma.sessionBlock.update({
          where: { id: block.id },
          data: {
            title: "❌ 나쁜 Agent 예시 — 라이브 데모",
            description: `[연결] 이제 실제 예시로 비교해보자.
이 블록과 다음 블록은 동일 목적으로 두 코드를 실행하고,
결과를 직접 비교하는 라이브 데모다.

■ 라이브 데모 — 나쁜 Agent
[시연 코드: demos/day4/bad_agent.py — 비교 실행: demos/day4/compare.py]

예시 도메인: 학회 세션 공지 작성

단순 프롬프트 기반:
prompt = """
학회 세션 공지 작성해줘. 주제는 AI Agent야.
"""
response = llm(prompt)

문제점:
- 대상 불명확 → 누구에게 보내는 공지인가?
- 목적 불명확 → 참석 유도? 과제 안내? 회고?
- 제약 없음 → 형식, 길이, 톤이 무작위
- 상태 없음 → 이전 세션에서 뭘 했는지 모름
- 평가 기준 없음 → 좋고 나쁨을 판단 불가

결과 (라이브 실행):
그럴듯하지만 어디에도 쓸 수 없는 공지가 나온다.
LLM은 "평균적인 공지"를 생성할 뿐이다.
맥락이 없으면 LLM은 가장 무난한 답을 선택한다.`,
          },
        });
        console.log(`✓ Block 3 updated (나쁜 Agent → 범용 도메인)`);
        break;
      }

      // Block 4: 좋은 Agent 데모 → 범용 도메인
      case 4: {
        await prisma.sessionBlock.update({
          where: { id: block.id },
          data: {
            title: "✅ 좋은 Agent 예시 — 라이브 데모",
            description: `[연결] 같은 문제를 구조화하면 어떻게 달라질까?
동일한 LLM, 동일한 목적. 맥락만 다르다.

■ 라이브 데모 — 좋은 Agent
[시연 코드: demos/day4/good_agent.py — 비교 실행: demos/day4/compare.py]

context = {
    "goal": "3일차 실습 결과를 기반으로 4일차 사전 준비를 유도",
    "audience": "코딩 경험 0~1년 학회원, 3일차 Agent Loop 실습 완료",
    "current_state": "API 호출과 Tool Calling은 경험함, Context 설계는 미경험",
    "constraint": "전문 용어 최소화, 구체적 행동 지시 포함, 500자 이내",
    "evaluation": "수신자가 실제로 사전 준비를 실행하는가"
}
response = llm_reason(context)

차이:
- 대상 명확 → 학회원 특성에 맞춘 어조
- 목적 명확 → 행동 유도에 집중
- 상태 반영 → 이미 아는 것과 모르는 것을 구분
- 제약 존재 → 형식과 길이가 통제됨
- 평가 가능 → "준비를 했는가"로 성공 판단

LLM은 동일하다.
맥락이 결과를 바꾼다.

[데모 후] 두 결과를 나란히 비교하며 토론:
- 어떤 출력을 실제로 학회 채널에 올릴 수 있는가?
- 나쁜 Agent의 출력을 "수정"하면 되는가,
  아니면 구조를 바꿔야 하는가?`,
          },
        });
        console.log(`✓ Block 4 updated (좋은 Agent → 범용 도메인)`);
        break;
      }

      // Block 6: Evaluation → Context Window (C)
      case 6: {
        await prisma.sessionBlock.update({
          where: { id: block.id },
          data: {
            title: "Context Window — 맥락의 물리적 한계",
            description: `[연결] Context 4요소를 이해했다면,
다음 질문은 이것이다.
"맥락을 무한히 넣을 수 있는가?"
답은 아니다.

■ Context Window란?
LLM이 한 번에 볼 수 있는 텍스트의 최대 크기다.
- GPT-4: 128K tokens
- Claude: 200K tokens
- 크다고 무한이 아니다.
토큰은 대략 한글 1글자 ≈ 1~2토큰, 영어 1단어 ≈ 1토큰이다.
200K 토큰 ≈ 한글 기준 약 10~15만 자 ≈ A4 200장 내외

■ 왜 이게 중요한가?
1. 창 안에 다 안 들어간다
   - 코드베이스 전체, 문서 전체를 넣을 수 없다
   - 선택(Selection)과 압축(Compression)이 필수인 물리적 이유
2. 넣어도 다 보지 못한다
   - "Lost in the Middle" 현상: 맥락 중간에 있는 정보를 놓침
   - 앞과 끝은 잘 보고, 가운데를 무시하는 경향
3. 길수록 비싸다
   - API 비용 = 입력 토큰 + 출력 토큰
   - 불필요한 맥락은 비용 낭비
4. 길수록 느려진다
   - 토큰이 많을수록 응답 시간 증가

■ 실무 전략
1. Selection — 관련 정보만 골라 넣기
2. Compression — 요약, 핵심만 추출
3. Sliding Window — 최근 N턴만 유지
4. RAG (Retrieval-Augmented Generation)
   — 전체를 넣지 않고, 질문에 관련된 조각만 검색해서 주입
   — 이후 세션에서 더 깊이 다룸

■ Context 4요소와의 연결
- Selection과 Compression이 단순히 "좋은 습관"이 아니라
  물리적으로 필수인 이유가 여기에 있다.
- Framing은 같은 토큰 예산 안에서
  해석 방향을 고정하는 효율 장치다.

맥락 설계는 "무엇을 넣을까"의 문제이기도 하지만,
"무엇을 뺄까"의 문제이기도 하다.`,
          },
        });
        console.log(`✓ Block 6 updated (Evaluation → Context Window)`);
        break;
      }

      // Block 7: 기존 실습 → 프로덕트 사례 (A)
      case 7: {
        await prisma.sessionBlock.update({
          where: { id: block.id },
          data: {
            title: "실제 프로덕트의 Context Engineering",
            description: `[연결] 이 원리는 이론이 아니다.
여러분이 매일 쓰는 도구에 이미 적용되어 있다.

■ Claude Code — CLAUDE.md
- 프로젝트 루트에 CLAUDE.md 파일을 두면
  매 호출마다 자동으로 맥락에 주입된다.
- 이것은 Context Selection의 자동화다.
  "이 프로젝트에서 항상 알아야 할 것"을 코드가 관리한다.
- 매번 사람이 설명하지 않아도 Agent가 프로젝트를 이해한다.

■ Cursor — .cursorrules + 코드베이스 인덱싱
- .cursorrules: 프로젝트별 코딩 컨벤션과 제약을 자동 주입 (Framing)
- 코드베이스 인덱싱: 전체 코드를 벡터화해서
  질문에 관련된 파일만 선택해 맥락에 넣는다 (Selection + Compression)
- "200K 토큰 창에 프로젝트 전체를 넣을 수 없으니
  관련 파일만 골라 넣는다" — 방금 배운 원리의 실제 구현

■ Perplexity — 검색 결과 기반 Context
- 사용자 질문 → 웹 검색 → 검색 결과를 Context로 주입
- Framing이 "검색된 사실 기반"으로 고정된다
- LLM의 학습 데이터가 아니라 실시간 정보가 맥락이 됨
- 환각을 줄이는 구조적 장치

■ ChatGPT Memory
- 이전 대화에서 사용자 정보를 추출 → 다음 대화에 자동 주입
- Context Iteration의 가장 단순한 형태
- 그러나 무엇을 기억하고 무엇을 잊을지(Selection)가 불완전

■ 공통 패턴
모든 프로덕트가 동일한 문제를 풀고 있다:
1. 어떤 맥락을 넣을 것인가 (Selection)
2. 어떻게 줄일 것인가 (Compression)
3. 어떤 관점으로 해석시킬 것인가 (Framing)
4. 이전 결과를 어떻게 반영할 것인가 (Iteration)

차이는 LLM 모델이 아니다.
맥락 설계 파이프라인이다.`,
          },
        });
        console.log(`✓ Block 7 updated (실습 → 프로덕트 사례)`);
        break;
      }

      // Block 8: 산학 보험 → 맥락 오염과 디버깅 (B)
      case 8: {
        await prisma.sessionBlock.update({
          where: { id: block.id },
          data: {
            title: "맥락 오염과 디버깅",
            description: `[연결] 맥락 설계가 중요하다는 것은 알았다.
그렇다면 맥락이 잘못되면 어떻게 되는가?

■ 맥락 오염(Context Pollution)이란?
불필요하거나, 모순되거나, 오래된 정보가
맥락에 포함되어 결과를 왜곡하는 현상이다.

■ 오염 유형 4가지

1. 과잉 주입 (Information Overload)
   - 관련 없는 정보를 너무 많이 넣음
   - LLM이 핵심을 놓치고 부수적 정보에 반응
   - 예: 공지 작성에 학회 회칙 전문을 넣으면 회칙 해설을 시작함

2. 모순 주입 (Contradiction)
   - 서로 충돌하는 지시가 맥락에 공존
   - 예: "간결하게 써" + "모든 세부사항을 빠짐없이 포함해"
   - LLM은 둘 중 하나를 임의로 선택하거나 절충안을 만듦

3. 잔류 오염 (Stale Context)
   - 이전 턴의 맥락이 현재 작업에 간섭
   - 예: 이전 대화에서 "Python으로" 했는데
     새 작업에서도 Python을 고집함

4. 편향 주입 (Biased Framing)
   - 특정 방향으로 유도하는 맥락
   - 예: "이 코드의 문제점을 찾아줘"
     → 문제가 없어도 억지로 문제를 만들어냄

■ 디버깅 순서 — Agent가 이상할 때

Step 1. 출력을 본다
  "결과가 이상한가?"

Step 2. 맥락을 본다 (가장 먼저 의심)
  "LLM에 전달된 실제 맥락을 출력해보라"
  → 80%의 문제는 여기서 발견된다

Step 3. 맥락이 정상이면, 모델을 의심한다
  "같은 맥락으로 여러 번 실행하면 결과가 흔들리는가?"
  → 비결정성 문제

Step 4. 도구를 의심한다
  "Tool 호출 결과가 올바른가?"
  → Tool이 잘못된 데이터를 반환하면 LLM도 잘못된 판단을 함

■ 핵심 원칙
AI가 틀렸다고 느끼면,
먼저 맥락을 의심하라.
모델을 바꾸기 전에 맥락을 바꿔라.`,
          },
        });
        console.log(`✓ Block 8 updated (산학 보험 → 맥락 오염과 디버깅)`);
        break;
      }

      // Block 9: 과제 → 과제 + 5일차 예고 (order 10으로 이동)
      case 9: {
        await prisma.sessionBlock.update({
          where: { id: block.id },
          data: {
            order: 10,
            title: "과제 안내 & 5일차 예고",
            description: `■ 과제: Context 4요소 적용 실험 보고서

1. 본인이 관심 있는 도메인을 하나 선택한다
   (학회 운영, 여행 계획, 이력서 작성, 코드 리뷰, 콘텐츠 기획 등)
2. 동일 입력으로 4요소를 하나씩 켜며 실행한다 (실습과 동일 구조)
3. 각 단계의 결과를 기록하고, 어떤 요소가 가장 큰 차이를 만들었는지 분석한다

제출: Markdown 또는 PDF — GitHub 또는 세션 웹
분량: 4단계 실험 결과 + 분석 1페이지

반드시 포함:
- 4단계 각각의 입력 맥락(context_config)과 출력 결과
- 각 요소가 추가될 때 결과가 어떻게 바뀌었는지 비교
- "가장 큰 차이를 만든 요소"와 그 이유 분석
- (선택) 맥락 오염 실험 — 일부러 모순된 맥락을 넣고 결과 관찰

평가 기준:
- 4요소 각각의 효과를 구분해서 설명했는가 (40%)
- "이 요소가 왜 차이를 만들었는가"에 대한 분석이 있는가 (30%)
- 코드/프롬프트가 재현 가능한가 (20%)
- 실험의 창의성 (도메인 선택, 추가 실험 등) (10%)

■ 5일차 예고
오늘 배운 Context 4요소는 어떤 도메인에나 적용된다.
다음 세션(5일차)에서는 이 프레임을 보험 도메인에 적용한다.
보험의 핵심 구조(세그먼트, Hazard, 계리 가정)를 해체하고,
Agent가 어디에 개입하는지를 정의한다.

오늘 익힌 "맥락 통제"가 보험에서 왜 특히 중요한지,
5일차에서 직접 확인하게 된다.`,
          },
        });
        console.log(`✓ Block 9 updated (과제 수정 + order 9→10)`);
        break;
      }

      // Block 10: 마무리 → order 11로 이동
      case 10: {
        await prisma.sessionBlock.update({
          where: { id: block.id },
          data: {
            order: 11,
          },
        });
        console.log(`✓ Block 10 moved (order 10→11)`);
        break;
      }

      default:
        // Block 1, 2, 5: 변경 없음
        console.log(`  Block ${block.order} (${block.title}) — 변경 없음`);
        break;
    }
  }

  // ── 3. 신규 블록 생성: order 9 실습 ──
  await prisma.sessionBlock.create({
    data: {
      sessionId: DAY4_ID,
      order: 9,
      type: "FLOW",
      title: "실습 — Context 4요소 단계적 실험",
      description: `[연결] 이제 이 구조 위에서 실험한다.
4요소를 하나씩 켜면서 결과가 어떻게 달라지는지 확인한다.

■ 실습 도메인: 학회 세션 기획 Agent

공통 입력:
"다음 주 세션 기획안을 작성해줘. 주제는 프롬프트 엔지니어링이야."

■ 공통 Agent 루프
class BasicAgent:
    def run(self, input, context_config):
        context = build_context(input, context_config)
        decision = llm(context)
        return decision

■ 실험 설계 — 4단계 누적 실험

[실험 1] Baseline — 4요소 모두 OFF
context_config = {
    "selection": False,
    "compression": False,
    "framing": False,
    "iteration": False
}
→ Raw input 그대로 LLM에 전달
→ 예상: 일반적이고 어디서나 볼 수 있는 기획안

[실험 2] Selection만 ON
context_config = {
    "selection": True,    # ← ON
    "compression": False,
    "framing": False,
    "iteration": False
}
→ 대상(코딩 초보 학회원), 이전 세션 내용을 맥락에 추가
→ 예상: 대상에 맞춰지지만 구조는 여전히 평범
→ 관찰: 불필요한 정보가 빠지면 결과가 얼마나 달라지나?

[실험 3] Selection + Compression + Framing ON
context_config = {
    "selection": True,
    "compression": True,   # ← ON
    "framing": True,       # ← ON
    "iteration": False
}
→ 핵심만 압축 + "실습 중심, 이론 최소화" 관점 명시
→ 예상: 뚜렷한 관점이 있는 구조화된 기획안
→ 관찰: Framing이 추가되면 "관점"이 생기는가?

[실험 4] 4요소 모두 ON
context_config = {
    "selection": True,
    "compression": True,
    "framing": True,
    "iteration": True     # ← ON
}
→ 이전 실험 결과를 반영하여 2차 기획
→ 예상: 자기 수정, 일관성 향상
→ 관찰: Iteration이 추가되면 "자기 수정"이 발생하는가?

■ 비교 기준
각 실험 결과를 다음 기준으로 비교:
1. 구체성 — 실제로 실행 가능한 기획인가?
2. 대상 적합성 — 학회원 수준에 맞는가?
3. 관점 일관성 — 하나의 방향으로 정렬되어 있는가?
4. 자기 수정 — Iteration 후 품질이 개선되었는가?

LLM은 동일하다.
맥락을 하나씩 추가할 때마다 결과가 어떻게 바뀌는지,
직접 눈으로 확인한다.`,
    },
  });
  console.log(`✓ New Block 9 created (실습 — Context 4요소 단계적 실험)`);

  // ── 4. 최종 확인 ──
  const updated = await prisma.session.findUnique({
    where: { id: DAY4_ID },
    include: { blocks: { orderBy: { order: "asc" } } },
  });
  console.log(`\n=== 최종 결과 ===`);
  console.log(`Blocks: ${updated!.blocks.length}`);
  for (const b of updated!.blocks) {
    console.log(`  [${b.order}] ${b.title}`);
  }
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
