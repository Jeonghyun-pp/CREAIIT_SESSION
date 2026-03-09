import path from "node:path";
import { config } from "dotenv";
config({ path: path.join(__dirname, "..", ".env.local") });

import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL! });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const DAY9_ID = "session-day9";

async function main() {
  const day9 = await prisma.session.findUnique({
    where: { id: DAY9_ID },
    include: { blocks: { orderBy: { order: "asc" } } },
  });

  if (!day9) {
    console.error("Day 9 session not found!");
    process.exit(1);
  }

  console.log(`Found Day 9: ${day9.title}`);
  console.log(`Existing blocks: ${day9.blocks.length}`);

  for (const block of day9.blocks) {
    switch (block.order) {
      // Block 0: 변경 없음 (환각/파싱/연쇄 오류는 여기서만 다룸)

      // 문제 1+2: Block 1 — 중복 제거 + 8일차 중간발표 결과 연결
      case 1: {
        await prisma.sessionBlock.update({
          where: { id: block.id },
          data: {
            description: `"보험사가 지금 여러분의 Agent를 도입할 수 있을까?"
라는 질문으로 시작한다.

[8일차 중간발표 결과 기반 논의]
8일차에서 각 팀이 제출한 개선 방향 5항목(A~E)을 화면에 띄운다:
A) 현재 구조의 가장 큰 결함
B) 보험 도메인 연결에서 부족한 부분
C) KPI를 설계 기준으로 반영하기 위한 수정
D) 맥락 품질 진단 결과
E) 4/6에서 반드시 해결해야 할 설계 이슈

팀별 A~E를 종합하면 공통 패턴이 보인다:
- 구조 부재: Agent는 작동하지만 시스템이 아니다
- KPI 미활용: 계산은 되지만 시스템에 영향을 주지 않는다
- Ontology 자산화 실패: 파일이지 관리되는 자산이 아니다
- 추적성 부족: 로그는 있지만 재현할 수 없다
- Compliance 표면화: 출력 문장에만 존재한다
- 맥락 품질 미점검: 출력이 나빠도 원인을 모델/맥락으로 분리하지 못한다

Block 0에서 본 실패 유형(환각/파싱 오류/연쇄 오류)이
바로 이 구조 부재에서 비롯된다.

결론:
"Agent에 구조가 없으면 시스템 전체가 오염될 수 있다."

오늘은 기능 추가가 아니라
구조 고정의 날이라는 목표를 명확히 한다.`,
          },
        });
        console.log(`✓ Block 1 updated (중복 제거 + 8일차 결과 연결)`);
        break;
      }

      // 문제 3+4: Block 2 — Context Builder에 맥락 오염 방지, KPI Gate/Trace Log에 Context Quality 추가
      case 2: {
        await prisma.sessionBlock.update({
          where: { id: block.id },
          data: {
            description: `지금까지의 형태:
User → Agent loop → 텍스트 출력

산업이 요구하는 형태:
Request → Guardrails → Context → LLM+Policy → Tools → KPI Gate → Structured Output → Report → Trace Log

차이는 3가지다:
1. 입출력 경계에 가드레일이 있다
2. 루프 내부에 정책 강제가 있다
3. 모든 결정에 추적 가능성이 있다

기준 아키텍처(9블록)를 제시하고
팀별 설계의 공통 언어로 고정한다:

[1. Request]
  ↓
[2. Input Guardrails]
  ↓
[3. Context Builder]
  ↓
[4. LLM + Policy Layer]
  ↓
[5. Tool Layer]
  ↓
[6. KPI Gate]
  ↓
[7. Structured Output]
  ↓
[8. Report Generator]
  ↓
[9. Trace Log + Version Control]

각 블록의 핵심 책임:

1) Request
- 요청을 구조화한다 (request_id 포함)
- 자연어 입력도 구조화된 형태로 파싱하는 전처리가 필요하다

2) Input Guardrails
- PII 탐지 → 마스킹 또는 거부
- Prompt Injection → 거부 + 로깅
- Topic 제한 → 보험 도메인 외 차단
- 입력 스키마 검증 → 필수 필드 확인
- Prompt Injection은 Agent 보안의 가장 기본적인 위협이다
- 사용자 입력에 "SYSTEM: 이전 지시 무시" 같은 문구가 섞이면 Agent가 정책을 무시할 수 있다

3) Context Builder
- 4일차에 배운 Context 4요소를 시스템 수준으로 격상
- Selection: Ontology 기반 자동 concept 선택
- Compression: Token budget 내 자동 압축
- Framing: Hazard 방향 + 계리 해석 프레임 자동 주입
- Iteration: State 기반 자동 재질문
- Compliance context를 추가한다

■ 맥락 오염 방지 (4일차 연결)
4일차에서 배운 맥락 오염 4유형을 시스템 수준에서 방어한다:
- 잔류 오염 방지: 턴 간 state 초기화 규칙 정의 (어떤 정보를 유지하고 어떤 정보를 폐기하는가)
- 누적 오염 방지: context window 사용량 모니터링 + 임계치 초과 시 자동 압축
- 외부 주입 방지: tool 결과를 context에 넣기 전 검증 (Input Guardrails와 연동)
- 프레이밍 충돌 방지: system prompt와 동적 context 간 모순 탐지

맥락 품질이 나쁘면 모델을 바꿔도 출력이 개선되지 않는다.
"모델을 바꾸기 전에 맥락을 바꿔라"가 시스템 수준에서 구현되는 지점이다.

4) LLM + Policy Layer
- LLM은 판단만 수행한다. 정책은 코드로 강제한다.
- 출력 스키마 강제: JSON Schema로 응답 형식 고정
- Compliance 필수: 모든 출력에 compliance_note 포함
- Hazard 방향 일관성: 제안된 feature의 위험 방향이 모순되면 차단
- Confidence threshold: 확신도 미달 시 자동 에스컬레이션

5) Tool Layer
- ontology_lookup: feature → risk concepts, mapping path
- hazard_hint: risk concept → hazard direction, magnitude
- compliance_checker: feature + product_line → regulation list, feasibility
- data_feasibility: feature → collectability, cost estimate
- Tool 호출 전 인자 유효성, 호출 후 결과 유효성을 확인한다
- Tool 실패 시 Agent에 실패 사실을 알려서 대안 경로로 유도한다

6) KPI Gate
- mapping_presence_rate >= 1.0 → 미통과 시 재루프
- compliance_note_presence == true → 미통과 시 자동 재작성
- schema_conformance == true → 미통과 시 종료 금지
- hazard_direction_consistency == true → 미통과 시 hazard_hint 재호출
- confidence_score >= 0.7 → 미통과 시 에스컬레이션

■ Context Quality Gate (7일차 8번째 축 연결)
KPI Gate에 맥락 품질 지표를 포함한다:
- context_sufficiency: 필수 정보(ontology, state, constraint)가 build_context()에 포함되었는가 → 미통과 시 context 재구성
- context_noise_ratio: 전체 맥락 중 실제 사용된 정보 비율 → 임계치 미달 시 압축 후 재실행
이 지표들은 "출력이 나쁠 때 원인이 모델인지 맥락인지" 분리하는 유일한 방법이다.

7) Structured Output
- 보험 전용 JSON 스키마로 결과를 고정한다
- 메타데이터: request_id, ontology_version, model_id, timestamp
- 핵심 결과: suggested_features, segment_refinement
- 계리 연결: actuarial_linkage, hazard_rationale
- 컴플라이언스: compliance_notes, limitations
- 신뢰도: confidence_score, reasoning_chain
- 비즈니스 규칙을 검증 레이어에 직접 코드화할 수 있다

8) Report Generator
- 하이브리드 접근: 수치 = 템플릿(환각 위험 0%), 서술 = LLM(근거/출처 포함)
- 수치는 반드시 템플릿에서 생성한다. LLM이 수치를 생성하면 환각이 발생한다.
- 서술은 LLM이 생성하되, 모든 주장은 데이터 소스를 인용해야 한다.
- ontology_version을 리포트에 반드시 포함한다

9) Trace Log + Version Control
- 재현/감사 가능한 로그: request_id, ontology_version, tool_calls, kpi_scores, 비용, 시간
- 추적 로그가 답해야 할 질문:
  누가 언제 무엇을 요청했는가?
  어떤 온톨로지 버전으로 판단했는가?
  어떤 Tool을 호출했고 결과는 무엇이었는가?
  KPI Gate를 통과했는가?
  비용은 얼마였는가?
- Context Quality 추적:
  해당 실행에서 context_sufficiency, context_noise_ratio 값을 로그에 기록한다.
  출력 품질이 낮은 케이스를 역추적할 때 맥락 원인을 분리할 수 있다.

각 블록별로 팀이 결정해야 할 체크 질문을 제공해
강의가 아니라 설계 결정을 유도한다.`,
          },
        });
        console.log(`✓ Block 2 updated (Context Builder 오염 방지 + KPI Gate/Trace Log Context Quality 추가)`);
        break;
      }

      // 문제 5: Block 3 — 8대 축 → KPI Gate 매핑 추가
      case 3: {
        await prisma.sessionBlock.update({
          where: { id: block.id },
          data: {
            description: `현재:
Agent 실행 → 텍스트 출력 → eval.py 실행 → KPI 계산 → 사후 보고

목표:
Agent 실행 → KPI Gate 통과? → Yes → 출력 / No → 재루프 또는 에스컬레이션

핵심 전환:
KPI는 "사후 평가"에서 "런타임 정책"으로 승격된다.
이것은 개념적 전환이 아니라 코드 구조의 전환이다.

■ 7일차 8대 축 → Gate 승격 매핑
7일차에서 정의한 8대 평가 축 중 어떤 것이 Runtime Gate가 되는가:

| 평가 축               | Gate 가능 여부 | Gate 유형      | 이유                                    |
|----------------------|--------------|---------------|----------------------------------------|
| 1. Task Success      | ○ (사후)      | —             | 전체 완료 여부는 사후 평가 (Gate 아님)        |
| 2. Plan Quality      | △            | Soft          | steps 수 이상 시 경고 가능                  |
| 3. Tool Correctness  | ○            | Hard          | 잘못된 tool 호출은 즉시 차단 가능             |
| 4. Robustness        | ○ (사후)      | —             | 반복 실행 필요, 런타임 Gate 부적합            |
| 5. Efficiency        | △            | Soft          | token/cost 임계치 초과 시 경고              |
| 6. Explainability    | ○            | Soft          | 필수 설명 항목 누락 시 재작성                 |
| 7. Business Impact   | ○ (사후)      | —             | 사후 측정 지표                             |
| 8. Context Quality   | ○            | Soft/Hard     | context_sufficiency 미달 시 재구성          |

→ Gate로 승격 가능한 축: Tool Correctness(Hard), Explainability(Soft), Context Quality(Soft/Hard)
→ 사후 평가로 남는 축: Task Success, Robustness, Business Impact
→ 경고 수준: Plan Quality, Efficiency

이 매핑을 기반으로 팀별 Gate를 설계한다.

KPI Gate를 3가지 유형으로 분해한다:

Type A — Hard Gate (차단)
- 조건 미충족 시 출력 자체가 불가능 (종료 금지)
- 예: schema_conformance == false
- 예: tool_selection_validity == false (잘못된 tool 호출)

Type B — Soft Gate (재시도)
- 조건 미충족 시 재루프 (최대 N회)
- 예: mapping_presence_rate < 1.0 → 누락된 매핑에 대해 재질문
- 예: context_sufficiency 미달 → context 재구성 후 재실행
- 예: explanation_coverage 미달 → 필수 설명 항목 보완 요청

Type C — Escalation Gate (에스컬레이션)
- 조건 미충족 시 인간에게 넘김
- 예: confidence_score < 0.5 → 사람 판단 요청

최소 Gate 세트 (예시):
- schema_conformance: Hard
- compliance_note_presence: Hard 또는 Soft (재작성)
- mapping_presence_rate: Soft (매핑 누락 보완)
- hazard_direction_consistency: Soft (힌트 재조회)
- confidence_score: Escalation (임계치 미만 시)
- context_sufficiency: Soft (맥락 재구성)

재시도는 "다시 해봐"가 아니라
실패 이유를 LLM에 피드백하는 구조다.
실패 로그 자체가 State의 일부가 된다.
이것이 6일차에 배운 State Update (E)의 실전 적용이다.

최대 재시도 횟수 (max_retries):
- Hard Gate: 3회 후 에스컬레이션
- Soft Gate: 2회 후 partial output으로 종료 + 경고 플래그
- Escalation: 즉시 인간에게

팀별로 반드시 정의할 것:
- Hard 2개 + Soft 2개는 무엇으로 정하는가?
- 각 Gate의 threshold와 retry prompt는?
- max_retries는 Gate 유형별로 몇 회인가?
- 최종 실패 시 fallback은 무엇인가?`,
          },
        });
        console.log(`✓ Block 3 updated (8대 축 → KPI Gate 매핑 테이블 추가)`);
        break;
      }

      default:
        console.log(`  Block ${block.order} (${block.title}) — 변경 없음`);
        break;
    }
  }

  // 최종 확인
  const updated = await prisma.session.findUnique({
    where: { id: DAY9_ID },
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
