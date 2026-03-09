import path from "node:path";
import { config } from "dotenv";
config({ path: path.join(__dirname, "..", ".env.local") });

import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL! });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const DAY10_ID = "cmm6dbklw000704lbaloqr926";
const DAY11_ID = "cmm6detwh000c04lbnlu7kp7b";

async function main() {
  // ===== Day 10 =====
  const day10 = await prisma.session.findUnique({
    where: { id: DAY10_ID },
    include: { blocks: { orderBy: { order: "asc" } } },
  });

  if (!day10) {
    console.error("Day 10 session not found!");
    process.exit(1);
  }

  console.log(`Found Day 10: ${day10.title}`);
  console.log(`Existing blocks: ${day10.blocks.length}`);

  for (const block of day10.blocks) {
    switch (block.order) {
      // 문제 1: Block 0 — Must/Should에 Context Quality Gate + 맥락 오염 방지 반영
      case 0: {
        await prisma.sessionBlock.update({
          where: { id: block.id },
          data: {
            description: `각 팀은 4/6에서 작성한 체크리스트를 기반으로 자율 구현을 진행한다.

Must 항목을 우선 완성한다:
- 출력 스키마 검증 (JSON Schema 또는 Pydantic)
- KPI Gate 최소 4개 (Hard 2 + Soft 2)
  → Context Quality Gate(context_sufficiency) 포함 권장
- ontology_version을 모든 출력에 포함
- Trace Log 최소 필드 구현
  (request_id, ontology_version, steps, kpi_scores, context_sufficiency)
- Report 수치 섹션 템플릿 기반 생성

Should 항목은 여력에 따라 구현한다:
- Prompt Injection 기본 방어
- Tool 에러 핸들링
- Gate 실패 시 재시도 피드백 루프
- 테스트 케이스 최소 15개 확보
- 맥락 오염 방지 로직 (턴 간 state 초기화 규칙, context window 사용량 모니터링)

운영진은 코드를 대신 고쳐주지 않는다.
구조적 방향성과 우선순위만 피드백한다.`,
          },
        });
        console.log(`✓ Day 10 Block 0 updated (Must/Should에 Context Quality + 오염 방지 반영)`);
        break;
      }

      default:
        console.log(`  Day 10 Block ${block.order} (${block.title}) — 변경 없음`);
        break;
    }
  }

  // ===== Day 11 =====
  const day11 = await prisma.session.findUnique({
    where: { id: DAY11_ID },
    include: { blocks: { orderBy: { order: "asc" } } },
  });

  if (!day11) {
    console.error("Day 11 session not found!");
    process.exit(1);
  }

  console.log(`\nFound Day 11: ${day11.title}`);
  console.log(`Existing blocks: ${day11.blocks.length}`);

  for (const block of day11.blocks) {
    switch (block.order) {
      // 문제 1: Block 0 — 전반기 총정리를 세션별 핵심 전환점으로 보강
      case 0: {
        await prisma.sessionBlock.update({
          where: { id: block.id },
          data: {
            description: `전반기 11개 세션의 여정을 되짚는다.

[1일차] OT — 왜 AI 시스템인가, 방향 정렬
[2일차] AI 기초 — LLM의 작동 원리와 한계 (환각, 비결정성)
[3일차] API & Tool Calling — LLM이 도구를 선택·호출하는 ReAct 구조
[4일차] Context Engineering — 4요소(Selection/Compression/Framing/Iteration) + Context Window + 맥락 오염·디버깅
[5일차] 보험 도메인 — 핵심 용어, Ontology 4계층, 계리 연결 가능성
[6일차] Agent 구축 — A~F 6단계 구조, build_context(), 로그 설계
[7일차] 성공 기준 — 8대 평가 축 + Context Quality, scorer, eval 자동화
[8일차] 중간발표 — 구조적 결함 진단, 맥락 품질 점검
[9일차] 시스템 통합 — 9블록 아키텍처, KPI Gate(Hard/Soft/Escalation), 맥락 오염 방지
[10일차] 스프린트 — 설계를 코드로 구현

초기 상태:
User → LLM → 텍스트

현재 목표:
Request → Guardrails → Context → LLM + Policy
→ Tool → KPI Gate → Structured Output
→ Report → Trace Log

오늘은 이 구조가 실제로 구현되었는지를 확인하는 날이다.`,
          },
        });
        console.log(`✓ Day 11 Block 0 updated (전반기 세션별 핵심 전환점 추가)`);
        break;
      }

      // 문제 2: Block 1 — KPI 스코어 기준을 9일차 Block 5와 일치시키고 Context Quality 포함
      case 1: {
        await prisma.sessionBlock.update({
          where: { id: block.id },
          data: {
            description: `각 팀은 반드시 아래 5가지를 포함해야 한다.

1) 시스템 아키텍처 다이어그램
- 9개 블록 모두 포함
- 데이터 흐름 표시
- 실패 경로(재루프/에스컬레이션) 포함

2) 실제 데모
- 입력 → JSON 출력까지 실시간 실행
- KPI Gate 통과 사례 1개
- KPI Gate 실패 후 재시도 또는 에스컬레이션 사례 1개

3) KPI 스코어 제시 (7일차 8대 축 기준)
- 보편 KPI (40%) + 보험 특화 KPI (60%)
- 8대 축 중 측정한 항목의 점수 제시
  (Task Success, Tool Correctness, Explainability, Context Quality 등)
- Context Quality 지표 포함: context_sufficiency, context_noise_ratio
- 최소 15개 테스트 케이스 집계
- Gate 통과율 / 재시도율 / 에스컬레이션율 제시

4) 자동 생성 리포트
- 수치 섹션은 템플릿 기반
- 서술은 LLM 생성
- ontology_version 포함
- 주요 주장에 근거 명시

5) 한계 및 다음 단계
- 현재 시스템의 구조적 한계
- 실제 도입을 위해 필요한 추가 요소
- 다음 버전에서 개선할 계획

중요:
기능이 많다고 좋은 발표가 아니다.
구조가 명확하고 통제가 작동하면 좋은 발표다.`,
          },
        });
        console.log(`✓ Day 11 Block 1 updated (KPI 기준 9일차 일치 + 8대 축 + Context Quality)`);
        break;
      }

      // 문제 3: Block 2 — 질의응답에 맥락 품질 관련 질문 추가
      case 2: {
        await prisma.sessionBlock.update({
          where: { id: block.id },
          data: {
            description: `운영진은 아래 질문을 중심으로 검증한다:

감사 및 추적:
- "이 결과는 3개월 후에도 재현 가능한가?"
- "감사 로그로 특정 판단의 근거를 역추적할 수 있는가?"
- "ontology_version이 바뀌면 어떻게 되는가?"

운영 안정성:
- "LLM API 장애 시 어떻게 대응하는가?"
- "사람이 개입하는 지점은 어디인가?"

맥락 품질:
- "출력 오류의 원인이 모델인지 맥락인지 구분할 수 있는가?"
- "맥락 품질이 나쁠 때 어떻게 진단하는가?"
- "context_sufficiency가 낮은 케이스를 보여줄 수 있는가?"
- "맥락 오염이 발생했을 때 어떻게 감지하고 대응하는가?"

보안:
- "민감정보(고객 건강 데이터)는 LLM에 어떻게 전달되는가?"
- "Prompt Injection 공격에 대한 방어는?"

확장성:
- "보험사가 실제로 도입하려면 무엇이 더 필요한가?"
- "승인 프로세스(인간 감독)는 어디에 있는가?"

이 질문에 구조적으로 답할 수 있어야 한다.`,
          },
        });
        console.log(`✓ Day 11 Block 2 updated (맥락 품질 관련 질문 추가)`);
        break;
      }

      default:
        console.log(`  Day 11 Block ${block.order} (${block.title}) — 변경 없음`);
        break;
    }
  }

  // 최종 확인
  const updatedDay10 = await prisma.session.findUnique({
    where: { id: DAY10_ID },
    include: { blocks: { orderBy: { order: "asc" } } },
  });
  console.log(`\n=== Day 10 최종 결과 ===`);
  console.log(`Blocks: ${updatedDay10!.blocks.length}`);
  for (const b of updatedDay10!.blocks) {
    console.log(`  [${b.order}] ${b.title}`);
  }

  const updatedDay11 = await prisma.session.findUnique({
    where: { id: DAY11_ID },
    include: { blocks: { orderBy: { order: "asc" } } },
  });
  console.log(`\n=== Day 11 최종 결과 ===`);
  console.log(`Blocks: ${updatedDay11!.blocks.length}`);
  for (const b of updatedDay11!.blocks) {
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
