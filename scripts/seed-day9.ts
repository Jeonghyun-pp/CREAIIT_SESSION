import path from "node:path";
import { config } from "dotenv";
config({ path: path.join(__dirname, "..", ".env.local") });

import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const dbUrl = process.env.DATABASE_URL!;
const pool = new Pool({ connectionString: dbUrl });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const sessionId = "session-day9";

  // Delete if exists (cascade deletes blocks)
  await prisma.session.deleteMany({ where: { id: sessionId } });

  const session = await prisma.session.create({
    data: {
      id: sessionId,
      title: "9일차 세션: 보험 Agent 시스템 통합 설계 워크샵",
      date: new Date("2026-04-06"),
      summary: `작동하는 보험 Agent를 "도입 가능한 시스템" 수준으로 고정한다.
단일 루프 구현을 넘어, Guardrails/Policy/KPI Gate/Report/Traceability까지 포함한
통합 아키텍처를 팀별로 확정하고, 4/9 자율 구현 범위를 명확히 정의한다.`,
      goals: [
        "보험 Agent를 시스템 아키텍처(9블록)로 설계하는 방법",
        "KPI를 사후 평가가 아니라 런타임 정책(KPI Gate)으로 승격하는 방법",
        "최종 발표(4/13)를 위한 산출물(다이어그램/데모/리포트/로그/스코어)을 고정하는 방법",
      ],
      prerequisites: [],
      published: true,
      blocks: {
        create: [
          {
            order: 0,
            type: "FLOW",
            title: "왜 이 세션이 필요한가 (필수 배경)",
            description: `지금까지 우리는 "작동하는 Agent"를 만들었다.
하지만 보험 산업은 "그럴듯한 답"이 아니라 "검증된 답"만을 허용하는 구조다.

보험 AI에서 실제로 반복되는 실패 유형은 다음과 같다:

1) 환각(Hallucination)
- 보장 한도, 공제액 같은 수치를 그럴듯하게 잘못 생성
- 보험에서 수치 환각은 곧 금전 사고로 이어질 수 있음

2) 파싱 오류(Parsing Error)
- 비정형 문서에서 자릿수/단위를 잘못 읽는 문제
- 공제액 $500을 $10,000으로 잘못 읽으면 정산 전체가 왜곡됨

3) 연쇄 오류(Cascading Failure)
- 분류 오류 → 보장 확인 오류 → 손해 평가 오류 → 지급 오류 → 보고 왜곡 → 재학습 데이터 오염
- 하나의 판단 오류가 시스템 전체를 관통

이러한 문제가 발생하는 공통 원인은
"LLM이 판단했기 때문에" 결과가 채택되는 구조에 있다.

보험 시스템에서는 다음이 필요하다:
- 입력을 거르는 구조(Guardrails)
- 판단을 통제하는 정책(Policy)
- 출력 전 검사 장치(KPI Gate)
- 재현 가능한 로그(Traceability)
- 버전이 고정된 도메인 구조(Ontology Versioning)

4/6 세션은 기능을 추가하는 시간이 아니다.
지금까지 만든 Agent를 "도입 가능한 시스템" 수준으로 격상시키는 날이다.

작동하는 Agent ≠ 도입 가능한 시스템

오늘은 그 간극을 메우는 구조를 설계한다.`,
          },
          {
            order: 1,
            type: "FLOW",
            title: "① 문제 제기: '작동 ≠ 도입'을 합의하기",
            description: `"보험사가 지금 여러분의 Agent를 도입할 수 있을까?"
라는 질문으로 시작한다.

중간발표에서 흔히 나타나는 문제:
- 구조 부재: Agent는 작동하지만 시스템이 아니다
- KPI 미활용: 계산은 되지만 시스템에 영향을 주지 않는다
- Ontology 자산화 실패: 파일이지 관리되는 자산이 아니다
- 추적성 부족: 로그는 있지만 재현할 수 없다
- Compliance 표면화: 출력 문장에만 존재한다

보험 AI에서 반복되는 실패 유형 3가지를 공유한다:
- 환각: 보장한도/공제액 등 수치 생성 오류
- 파싱 오류: 비정형 문서에서 단위/자릿수 오독
- 연쇄 오류: 분류 오류가 보장 확인 → 손해 평가 → 지급 → 보고 → 재학습까지 오염

결론:
"Agent에 구조가 없으면 시스템 전체가 오염될 수 있다."

오늘은 기능 추가가 아니라
구조 고정의 날이라는 목표를 명확히 한다.`,
          },
          {
            order: 2,
            type: "FLOW",
            title: "② 통합 시스템 아키텍처: 9블록을 기준 구조로 고정하기",
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
- 3/19에 배운 Context 4요소를 시스템 수준으로 격상
- Selection: Ontology 기반 자동 concept 선택
- Compression: Token budget 내 자동 압축
- Framing: Hazard 방향 + 계리 해석 프레임 자동 주입
- Iteration: State 기반 자동 재질문
- Compliance context를 추가한다

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

각 블록별로 팀이 결정해야 할 체크 질문을 제공해
강의가 아니라 설계 결정을 유도한다.`,
          },
          {
            order: 3,
            type: "FLOW",
            title: "③ KPI → Runtime Gate: '성공 기준은 코드'를 루프 안으로 넣기",
            description: `현재:
Agent 실행 → 텍스트 출력 → eval.py 실행 → KPI 계산 → 사후 보고

목표:
Agent 실행 → KPI Gate 통과? → Yes → 출력 / No → 재루프 또는 에스컬레이션

핵심 전환:
KPI는 "사후 평가"에서 "런타임 정책"으로 승격된다.
이것은 개념적 전환이 아니라 코드 구조의 전환이다.

KPI Gate를 3가지 유형으로 분해한다:

Type A — Hard Gate (차단)
- 조건 미충족 시 출력 자체가 불가능 (종료 금지)
- 예: schema_conformance == false

Type B — Soft Gate (재시도)
- 조건 미충족 시 재루프 (최대 N회)
- 예: mapping_presence_rate < 1.0 → 누락된 매핑에 대해 재질문

Type C — Escalation Gate (에스컬레이션)
- 조건 미충족 시 인간에게 넘김
- 예: confidence_score < 0.5 → 사람 판단 요청

최소 Gate 세트 (예시):
- schema_conformance: Hard
- compliance_note_presence: Hard 또는 Soft (재작성)
- mapping_presence_rate: Soft (매핑 누락 보완)
- hazard_direction_consistency: Soft (힌트 재조회)
- confidence_score: Escalation (임계치 미만 시)

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
          {
            order: 4,
            type: "FLOW",
            title: "④ 팀별 아키텍처 워크: 최종 발표 구조를 팀 산출물로 확정하기",
            description: `각 팀은 아래 4가지를 문서/도식으로 완성한다.

A) 최종 시스템 다이어그램
- 9블록 전체 포함
- 데이터 흐름 + 실패 경로(재루프/에스컬레이션) 표시
- 각 블록의 입력/처리/출력/실패 처리를 간단히 명시

B) KPI Gate 정의 문서
- Gate로 사용할 KPI 최소 4개
- Hard / Soft / Escalation 분류
- 통과 기준(threshold) 수치
- 실패 시 전략 (retry prompt 또는 escalation 조건)
- KPI별 max_retries 및 최종 fallback

C) Ontology 버전 관리 계획
- Semantic versioning 규칙:
  MAJOR: 클래스 삭제, 속성 이름 변경 → Breaking change
  MINOR: 새 서브클래스, 새 선택 속성 추가 → 하위 호환
  PATCH: 라벨/설명 수정 → 의미 변경 없음
- 변경 시 tool/스키마 영향 범위 정의
- 모든 출력/리포트/로그에 ontology_version 포함 규칙 확정

D) 4/9 구현 체크리스트 (Must / Should / Could)

[Must — 반드시 구현]
□ 스키마 검증 (JSON Schema 또는 Pydantic)
□ KPI Gate (Hard 2개 + Soft 2개)
□ ontology_version을 모든 출력에 포함
□ Trace Log 최소 필드 (request_id, ontology_version, steps, kpi_scores)
□ Report 수치 섹션은 템플릿 기반

[Should — 강력 권장]
□ Injection 기본 방어 (키워드 필터 수준)
□ Tool error handling (실패 시 Agent에 알림)
□ Retry feedback loop (Gate 실패 이유 → LLM에 전달 → 재생성)
□ test_cases 최소 15개

[Could — 도전 과제]
□ Circuit breaker (연속 실패 시 시스템 차단 + 규칙 기반 fallback)
□ Callback 계층 (before/after agent, model, tool)
□ VCR 테스트 (API 응답 저장 → 결정적 재실행)
□ Escalation tier (자동/샘플링/필수검토/완전수동)
□ Adversarial cases 강화

운영진은 코드 디테일이 아니라
구조(누락 블록/게이트 구체성/추적성)를 기준으로 피드백한다.`,
          },
          {
            order: 5,
            type: "FLOW",
            title: "⑤ 최종 발표 요구사항 고정: 4/13 발표의 필수 산출물 잠금",
            description: `최종 발표는 반드시 5가지를 포함하도록 고정한다:

1) 시스템 아키텍처 다이어그램
- 9블록 전체 포함
- 데이터 흐름 화살표
- 실패 경로(재루프, 에스컬레이션) 표시

2) 실제 데모 (입력 → JSON 출력)
- 실시간 실행
- Gate 통과 시나리오 1개 + Gate 실패 시나리오 1개 시연

3) KPI 스코어 수치 제시
- 보편 KPI (40%) + 보험 특화 KPI (60%)
- 15개 이상 테스트 케이스에 대한 집계
- Gate 통과율 / 재시도율 / 에스컬레이션율 포함

4) 자동 생성 리포트
- 하이브리드 구조 (수치 템플릿 + LLM 서술)
- ontology_version 포함
- 모든 주장에 근거/출처 포함

5) 한계 및 개선 전략
- 현재 시스템의 구체적 한계
- 다음 구현 로드맵

발표 후 도입 관점 질문 리스트를 공유한다:

감사 및 추적:
- "이 결과가 3개월 전에 다른 입력으로 실행됐다면 같은 결과가 나오는가?"
- "감사 로그에서 특정 결정의 근거를 역추적할 수 있는가?"

운영 안정성:
- "LLM API 서버가 다운되면 어떻게 되는가?"
- "온톨로지가 업데이트됐을 때 기존 결과와의 호환성은?"

보안:
- "민감정보(고객 건강 데이터)는 LLM에 어떻게 전달되는가?"
- "Prompt Injection 공격에 대한 방어는?"

확장성:
- "보험사가 실제로 도입하려면 무엇이 더 필요한가?"
- "승인 프로세스(인간 감독)는 어디에 있는가?"

이 질문들을 통해 "프로덕트 관점의 설계"로 연결한다.`,
          },
          {
            order: 6,
            type: "FLOW",
            title: "오늘의 진짜 의미",
            description: `오늘은 새로운 기능을 배우는 날이 아니다.

"돌아가는 Agent"를
"측정 가능하고 재현 가능하며 통제 가능한 보험 시스템"으로
격상하는 날이다.

4/6에서 구조를 고정하면
4/9는 구현이 되고,
4/13은 데모가 아니라 '검증'이 된다.`,
          },
        ],
      },
    },
  });

  console.log(`Session created: ${session.title} (${session.id})`);
  console.log(`  Date: ${session.date}`);
  console.log(`  Blocks: 7`);
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
