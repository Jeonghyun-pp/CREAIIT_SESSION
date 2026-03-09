import path from "node:path";
import { config } from "dotenv";
config({ path: path.join(__dirname, "..", ".env.local") });

import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL! });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const DAY5_ID = "cmm5wm5yk000xn4ul9i7pxfi9";

async function main() {
  const day5 = await prisma.session.findUnique({
    where: { id: DAY5_ID },
    include: { blocks: { orderBy: { order: "asc" } } },
  });

  if (!day5) {
    console.error("Day 5 session not found!");
    process.exit(1);
  }

  console.log(`Found Day 5: ${day5.title}`);
  console.log(`Existing blocks: ${day5.blocks.length}`);

  // ── 1. Session metadata 수정 ──
  await prisma.session.update({
    where: { id: DAY5_ID },
    data: {
      goals: [
        "보험의 기초 용어와 구조 (Mortality, Hazard, Segment, Premium, Assumption Table)",
        "세그먼트의 정확한 의미 (Hazard 공유 집합)",
        "보험의 Hazard 수식 구조 (실제 수식 포함)",
        "Premium 계산의 본질",
        "기존 세그먼트 구조의 한계",
        "온톨로지의 실제 구성 계층",
        "보험 실무 현실성 (규제·운영·리스크 풀)",
        "Agent 개입 지점 정의 (Feature Discovery / Actuarial Interpretation)",
      ],
    },
  });
  console.log("✓ Session metadata updated");

  // ── 2. 기존 블록 수정 ──
  for (const block of day5.blocks) {
    switch (block.order) {
      // Block 0: 보험 기초 용어 입문 보충 (문제 1 + 문제 6)
      case 0: {
        await prisma.sessionBlock.update({
          where: { id: block.id },
          data: {
            title: "보험은 무엇인가 — 기초 용어와 구조",
            description: `보험은 계약 판매 산업이 아니다.
보험은:
고객 데이터
→ 리스크 추정
→ 기대 손해액 계산
→ 할인 및 비용 반영
→ 보험료 산정
확률을 현재 가치로 환산하는 시스템이다.
보험의 본질은 감정이 아니라
수리적 기대값이다.

■ 보험 핵심 용어 — 수식 전에 개념부터

이후 블록에서 수식이 나오기 전에,
먼저 핵심 용어를 직관적으로 이해하자.

1. Mortality (사망률)
   — 특정 연령/집단이 1년 안에 사망할 확률.
   — 생명보험의 가장 기본적인 숫자.
   — 비유: "100명 중 올해 몇 명이 사망하는가?"
   — 예: 30대 남성 비흡연자의 연간 사망률 = 0.1% (1,000명 중 1명)
   — 이 숫자가 보험료 계산의 출발점이다.

2. Mortality Table (사망률표 / 경험생명표)
   — 연령별 사망 확률을 정리한 표.
   — 보험사의 가장 기본적인 참조 데이터.
   — 대한민국에서는 '경험생명표'를 사용하며,
     보험개발원이 주기적으로 갱신한다.
   — 비유: 보험의 "구구단표". 모든 계산이 여기서 시작된다.

3. Hazard Rate (위험률)
   — "지금까지 살아있는 사람이 다음 순간에 사고를 겪을 확률"
   — Mortality보다 정밀한 개념: 시간에 따라 변하는 위험을 표현한다.
   — 비유: 자동차 계기판의 엔진 온도. 지금 이 순간의 위험 수준.
   — 나이가 들수록 hazard rate가 올라간다.
   — 흡연, 직업, 건강 상태에 따라 달라진다.

4. Segment (세그먼트 / 위험 그룹)
   — 비슷한 리스크를 가진 고객 집단.
   — 비유: 학교의 "반" 분류. 같은 반 학생은 비슷한 수업을 듣듯,
     같은 세그먼트 고객은 비슷한 보험료를 낸다.
   — 현재: 나이·성별·직업 기준 (전통적, 단순)
   — 문제: 같은 "30대 남성 회사원"이라도
     실제 건강 상태는 천차만별

5. Premium (보험료)
   — 고객이 내는 돈. 단순히 "비용"이 아니라 수학적 산출물이다.
   — 기본 공식 (단순화):
     Premium = E[Loss|Segment] + Expense + Margin
   — E[Loss|Segment]: 해당 그룹의 예상 손실 (사망률 × 보험금)
   — Expense: 운영비
   — Margin: 이윤
   ※ 실제로는 시간가치 할인, 재보험 비용 등이 추가된다.

6. Assumption Table (가정 테이블)
   — 보험사가 상품 설계에 사용하는 가정값 모음.
   — 포함하는 것들: 이자율 가정, 사업비율 가정, 해약률 가정, 사망률 가정
   — 비유: 요리의 "레시피". 재료(데이터)가 같아도 레시피(가정)가 다르면
     결과(보험료)가 달라진다.
   — 왜 중요한가?
     → 신규 데이터가 들어와도, 가정 테이블에 반영되지 않으면
       보험료 계산에 영향을 주지 못한다.
     → Agent가 참조해야 할 "도메인 맥락"의 핵심이다.

7. 계리 연결 가능성 (Actuarial Linkability)
   — 새로운 변수가 실제로 보험료 계산에 반영될 수 있는가?
   — "운동 데이터"를 수집해도, 그것이 hazard rate에 어떻게 영향을 주는지
     수학적으로 연결 못 하면 의미 없다.
   — 이것이 이번 학기 산학 프로젝트의 핵심 과제다.

이 용어들을 먼저 잡아두자.
다음 블록부터 이 개념들이 수식과 구조로 깊어진다.`,
          },
        });
        console.log(`✓ Block 0 updated (기초 용어 입문 보충)`);
        break;
      }

      // Block 8: Feature Discovery Agent 확장 (문제 3)
      case 8: {
        await prisma.sessionBlock.update({
          where: { id: block.id },
          data: {
            description: `Feature Discovery Agent는
"어떤 새로운 데이터가 세그먼트를 더 정밀하게 만들 수 있는가?"
를 탐색하는 Agent다.

■ 핵심 역할
기존 세그먼트(나이/성별/직업)에 추가할 수 있는
새로운 feature 후보를 발굴하고,
각 후보의 가치를 평가한다.

■ 동작 흐름

Input:
- 현재 세그먼트 변수 목록 (예: age, gender, job)
- 목표 (예: "사망률 예측 정밀도 향상")
- 사용 가능한 데이터 카탈로그

Step 1. 후보 생성
- LLM이 도메인 지식을 기반으로 후보 feature를 제안
- 예: sleep_hours, exercise_frequency, BMI, smoking_duration

Step 2. 정보 이득량 분석
- 각 후보가 기존 세그먼트의 분산을 얼마나 줄이는가?
- Var(Loss | Segment + new_feature) < Var(Loss | Segment) ?
- Tool: variance_reduction_estimator

Step 3. 도입 난이도 평가
- 데이터 수집 가능성 (설문? 앱? IoT?)
- 비용 추정
- 개인정보 이슈 여부
- Tool: data_feasibility_checker

Step 4. 온톨로지 매핑 확인
- 후보 feature가 Risk Concept에 연결 가능한가?
- 기존 ontology.json에 매핑 경로가 있는가?
- Tool: ontology_lookup

■ 출력 예시
{
  "feature": "sleep_hours",
  "risk_concept": "chronic_fatigue",
  "variance_reduction": 0.12,
  "feasibility": "medium",
  "data_source": "건강 앱 / 설문",
  "privacy_risk": "low",
  "ontology_path": "sleep_hours → chronic_fatigue → hazard_multiplier(1.15)"
}

■ 핵심
Feature Discovery Agent는
"그럴듯한 아이디어"가 아니라
"계리적으로 연결 가능한 후보"를 찾는 Agent다.
아이디어 생성이 아니라 구조적 탐색이다.`,
          },
        });
        console.log(`✓ Block 8 updated (Feature Discovery Agent 확장)`);
        break;
      }

      // Block 9: Actuarial Interpretation Agent 확장 (문제 3)
      case 9: {
        await prisma.sessionBlock.update({
          where: { id: block.id },
          data: {
            description: `Actuarial Interpretation Agent는
Feature Discovery Agent가 찾은 후보를
실제 계리 모델에 연결하는 Agent다.

■ 핵심 역할
새로운 feature가 hazard rate를 어떻게 바꾸는지,
보험료에 어떤 영향을 주는지를 해석하고 제안한다.

■ 동작 흐름

Input:
- Feature Discovery Agent의 출력 (후보 feature + risk concept)
- 현재 Assumption Table
- 현재 온톨로지 구조

Step 1. Risk Concept 매핑
- feature → risk concept 연결을 검증한다
- "sleep_hours < 6 → chronic_fatigue"는 타당한가?
- 근거와 반례를 함께 제시한다
- Tool: ontology_lookup, hazard_hint

Step 2. Hazard 조정 제안
- risk concept이 hazard rate를 어떤 방향으로 바꾸는가?
- 증가? 감소? 얼마나?
- 예: chronic_fatigue → hazard_multiplier = 1.15 (15% 증가)
- 방향이 상식과 모순되면 경고 (예: "흡연이 hazard 감소" → 차단)

Step 3. Premium 영향 시뮬레이션
- hazard 조정이 보험료에 미치는 영향을 추정한다
- 예: "30대 남성 세그먼트에서 chronic_fatigue 적용 시
  보험료 약 8~12% 증가 예상"
- 세그먼트 간 영향 차이를 비교한다

Step 4. 세그먼트 재정의 제안
- 새 feature로 세그먼트를 어떻게 나눌 수 있는가?
- 예: "30대 남성 → 30대 남성(정상 수면) + 30대 남성(수면 부족)"
- 세분화 시 리스크 풀 크기가 유지되는지 확인

■ 출력 예시
{
  "feature": "sleep_hours",
  "risk_concept": "chronic_fatigue",
  "hazard_adjustment": {
    "direction": "increase",
    "multiplier": 1.15,
    "confidence": "medium",
    "evidence": "CDC 수면 부족-심혈관 연구(2023)",
    "limitation": "자가 보고 데이터의 정확성 한계"
  },
  "premium_impact": {
    "segment": "30대 남성",
    "estimated_change": "+8~12%",
    "pool_size_after_split": "충분 (N>5000)"
  },
  "compliance_note": "수면 데이터 수집 시 개인정보 동의 필요",
  "assumption_table_update": {
    "target_field": "hazard_multiplier_chronic_fatigue",
    "current_value": null,
    "proposed_value": 1.15,
    "review_required": true
  }
}

■ 두 Agent의 관계
Feature Discovery → "무엇을 추가할까?"
Actuarial Interpretation → "어떻게 연결할까?"

Feature Discovery가 후보를 찾고,
Actuarial Interpretation이 계리적 의미를 부여한다.
이 둘이 합쳐져야 보험 실무에서 쓸 수 있는 결과가 나온다.`,
          },
        });
        console.log(`✓ Block 9 updated (Actuarial Interpretation Agent 확장)`);
        break;
      }

      // Block 10: 마무리 → order 11로 이동
      case 10: {
        await prisma.sessionBlock.update({
          where: { id: block.id },
          data: { order: 11 },
        });
        console.log(`✓ Block 10 moved (order 10→11)`);
        break;
      }

      default:
        console.log(`  Block ${block.order} (${block.title}) — 변경 없음`);
        break;
    }
  }

  // ── 3. 신규 블록 생성: order 10 과제 안내 (문제 5) ──
  await prisma.sessionBlock.create({
    data: {
      sessionId: DAY5_ID,
      order: 10,
      type: "FLOW",
      title: "과제 안내 — 보험 도메인 Agent 설계 문서",
      description: `■ 과제: 보험 도메인 Agent 설계 문서 작성

오늘 배운 보험 구조와 온톨로지를 기반으로,
보험 Agent의 설계 문서를 작성한다.

제출 기한: 다음 세션 전까지
제출 형식: Markdown (.md) 또는 PDF — GitHub 또는 세션 웹 제출
분량: A4 기준 3~5페이지

■ 설계 문서 템플릿

===== 1. Agent 목표 정의 =====
- Agent가 해결하려는 구체적 보험 문제는?
- 최종 사용자는 누구인가? (계리사? 영업? 고객?)
- 성공 기준은 무엇인가?

작성 예시:
"Mortality 기반 세그먼트에 새로운 행동 변수를 추가하여
  기존 3변수(나이/성별/직업) 대비 hazard rate 예측 정밀도를 향상시키는
  Feature Discovery Agent"

===== 2. Context 4요소 설계 (4일차 복습 적용) =====
4일차에서 배운 Context 4요소를 보험 도메인에 적용한다:

(a) Selection — 무엇을 보여주고 무엇을 숨기나?
- Agent에 전달할 보험 데이터: [구체적으로 나열]
- 제외할 데이터: [왜 제외하는지 이유 포함]

(b) Compression — 어떻게 압축하나?
- 원본 데이터 크기 → 압축 후 크기
- 요약 전략 (예: 핵심 통계만 추출, 최근 N건만 사용)

(c) Framing — 어떤 관점으로 해석하나?
- 해석 프레임: [예: "계리적 유의성 관점", "규제 준수 관점"]
- LLM에 전달할 system prompt 초안

(d) Iteration — 결과를 어떻게 반영하나?
- 루프 구조: [몇 번 반복? 종료 조건?]
- update_context()에서 갱신하는 항목

===== 3. 온톨로지 매핑 설계 =====
오늘 배운 4계층 구조를 적용한다:
- Data Layer → Feature Layer → Risk Concept Layer → Actuarial Mapping Layer
- 최소 2개 feature에 대해 전체 매핑 경로를 작성

===== 4. Agent 역할 분리 =====
- Feature Discovery Agent의 역할과 입출력
- Actuarial Interpretation Agent의 역할과 입출력
- 두 Agent가 어떻게 연결되는가?

===== 5. 실패 케이스 분석 (1개 이상) =====
- 실패 상황 설명
- 왜 실패하는가? (맥락 설계의 어떤 부분이 부족한가?)
- 어떻게 개선할 수 있는가?

■ 평가 기준
- 온톨로지 매핑의 구체성 (30%)
- Context 4요소 보험 적용의 타당성 (25%)
- Agent 역할 분리와 연결 구조 (25%)
- 실패 케이스 분석의 논리성 (20%)

핵심: 코드 완성도가 아니라 "보험 도메인의 맥락 설계 사고 과정"을 평가한다.`,
    },
  });
  console.log(`✓ New Block 10 created (과제 안내)`);

  // ── 4. 최종 확인 ──
  const updated = await prisma.session.findUnique({
    where: { id: DAY5_ID },
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
