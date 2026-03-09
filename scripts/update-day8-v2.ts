import path from "node:path";
import { config } from "dotenv";
config({ path: path.join(__dirname, "..", ".env.local") });

import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL! });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const DAY8_ID = "cmm6d6c85000004lb4wijlgo3";

async function main() {
  const day8 = await prisma.session.findUnique({
    where: { id: DAY8_ID },
    include: { blocks: { orderBy: { order: "asc" } } },
  });

  if (!day8) {
    console.error("Day 8 session not found!");
    process.exit(1);
  }

  console.log(`Found Day 8: ${day8.title}`);
  console.log(`Existing blocks: ${day8.blocks.length}`);

  for (const block of day8.blocks) {
    switch (block.order) {
      // 문제 1: Block 0 — 학습 흐름 정리를 업데이트된 Day 4~7 반영
      case 0: {
        await prisma.sessionBlock.update({
          where: { id: block.id },
          data: {
            description: `지금까지의 학습 흐름을 다시 정리한다:

[3일차] API & Tool Calling & ReAct 구조
- LLM이 도구를 선택·호출하는 구조를 배웠다

[4일차] Context Engineering
- Context 4요소 (Selection / Compression / Framing / Iteration)
- Context Window와 토큰 한계
- 맥락 오염과 4단계 디버깅 (격리 → 최소 재현 → 변수 통제 → 비교 실험)
- 실제 프로덕트의 Context Engineering 사례 (Claude Code, Cursor 등)

[5일차] 보험 도메인 이해
- 보험 핵심 용어 (Mortality, Hazard Rate, Segment, Premium, Assumption Table)
- Risk Concept 기반 Ontology 4계층 설계
- 보험 전용 JSON 출력 스키마

[6일차] Agent 구축 워크샵
- A~F 6단계 구조 (Input Handler → Context Builder → LLM Reasoner → Tool Executor → State Update → Stop Condition)
- build_context()와 Ontology 연결
- 실행 로그 포맷 설계 (step, tool, result, duration_ms, error)

[7일차] Agent 성공 기준 & KPI
- 8대 평가 축 (Task Success, Plan Quality, Tool Correctness, Robustness, Efficiency, Explainability, Business Impact, Context Quality)
- scorer 구현과 eval 자동화
- KPI 자동 산출 구조

핵심 질문:
"지금 여러분의 Agent는 보험 도메인을 이해하고 있는가,
아니면 단순히 그럴듯한 JSON을 생성하고 있는가?"
이 질문을 중간발표 전체의 기준으로 삼는다.`,
          },
        });
        console.log(`✓ Block 0 updated (학습 흐름 → Day 4~7 업데이트 반영)`);
        break;
      }

      // 문제 2: Block 1 — 발표 요구사항을 Day 6 A~F 구조에 맞춤
      case 1: {
        await prisma.sessionBlock.update({
          where: { id: block.id },
          data: {
            description: `각 팀은 반드시 아래 5가지를 포함해 발표한다.

1) 현재 프로젝트 정의
- 우리가 해결하려는 보험 문제는 무엇인가?
- 어떤 상품/세그먼트를 다루는가?

2) 현재 Agent 구조 (6일차 A~F 기준)
- A(Input Handler) → B(Context Builder) → C(LLM Reasoner) → D(Tool Executor) → E(State Update) → F(Stop Condition) 흐름 설명
- 각 단계가 실제 코드에 어떻게 구현되어 있는가?
- build_context()는 무엇을 선택하고 어떻게 프레이밍하는가?
- State는 어떤 정보를 누적하는가?

3) 보험 도메인 연결
- Risk Concept는 어떻게 정의했는가?
- Ontology를 어떻게 사용하고 있는가?
- Actuarial Mapping은 어디에 반영되어 있는가?

4) 현재 출력 예시
- 실제 JSON 결과 1개 시연
- compliance_note, hazard_mapping, confidence 포함 여부 확인

5) 현재 KPI 스코어
- 보험 특화 KPI 중 최소 3개 수치 제시
- mapping_presence_rate
- compliance_note_presence
- hazard_reasonableness 등

중요:
중간발표는 "잘했다"를 보여주는 자리가 아니다.
현재의 구조 수준을 명확히 드러내는 자리다.`,
          },
        });
        console.log(`✓ Block 1 updated (발표 요구사항 → A~F 구조 반영)`);
        break;
      }

      // 문제 3: Block 2 — 피드백 기준에 Context Quality 관점 추가
      case 2: {
        await prisma.sessionBlock.update({
          where: { id: block.id },
          data: {
            description: `[연결] 팀 발표를 통해 공통적으로 나타나는 패턴을 정리한다.
이제 우리는 "잘 만든 프롬프트"와 "보험 시스템"의 차이를 구분할 수 있어야 한다.

운영진은 아래 기준으로 피드백한다.

1) Context 문제
- Selection이 명확한가?
- Ontology 기반 자동 선택인가, 하드코딩인가?
- Framing이 계리 관점으로 고정되어 있는가?

2) Context Quality 문제 (7일차 8번째 축)
- 맥락이 충분한가? (필요 정보가 build_context()에 누락되지 않았는가)
- 맥락이 과한가? (불필요 정보로 핵심이 묻히지 않았는가)
- 맥락이 일관되는가? (모순된 지시가 공존하지 않는가)
- 맥락이 오염되지 않았는가? (이전 턴의 잔류 정보가 간섭하지 않는가)
- 출력이 나쁠 때, 모델 탓인지 맥락 탓인지 구분할 수 있는가?

3) Tool 사용 문제
- Tool은 실제로 근거를 제공하는가?
- Tool 호출은 의미 있는가, 형식적인가?

4) KPI 문제
- KPI가 코드에 연결되어 있는가?
- 아니면 단순 eval 결과인가?

5) 도메인 연결 문제
- Risk Concept가 단순 feature 나열인가?
- Hazard 방향 논리가 포함되어 있는가?

6) 추적성
- request_id가 있는가?
- ontology_version을 출력에 포함하는가?
- 6일차 로그 포맷(step, tool, result, duration_ms, error)이 구현되어 있는가?

이 시간의 목적은 "문제 발견"이다.
4/6 이전에 구조적 빈틈을 드러내는 것이 성공이다.`,
          },
        });
        console.log(`✓ Block 2 updated (Context Quality 관점 + 로그 포맷 연결 추가)`);
        break;
      }

      // 문제 4: Block 3 — 개선 방향에 맥락 품질 진단 항목 추가
      case 3: {
        await prisma.sessionBlock.update({
          where: { id: block.id },
          data: {
            description: `각 팀은 발표 후 10분간 내부 논의 후 아래를 작성한다:

A) 현재 구조의 가장 큰 결함 1가지
B) 보험 도메인 연결에서 부족한 부분 1가지
C) KPI를 실제 설계 기준으로 반영하기 위해 필요한 수정 1가지
D) 맥락 품질 진단
   - 현재 build_context()에 필요한 정보가 빠져 있는가?
   - 불필요한 정보가 맥락에 포함되어 출력을 오염시키고 있는가?
   - 출력 문제의 원인이 모델인가, 맥락인가?
   (4일차 맥락 오염/디버깅 + 7일차 Context Quality 축 적용)
E) 4/6에서 반드시 해결해야 할 설계 이슈 1가지

이 5가지는 문서로 제출한다.`,
          },
        });
        console.log(`✓ Block 3 updated (맥락 품질 진단 항목 D 추가, 기존 D→E)`);
        break;
      }

      default:
        console.log(`  Block ${block.order} (${block.title}) — 변경 없음`);
        break;
    }
  }

  // 최종 확인
  const updated = await prisma.session.findUnique({
    where: { id: DAY8_ID },
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
