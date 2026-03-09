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

  console.log(`Found Day 4: ${day4.id} - ${day4.title}`);
  console.log(`Blocks: ${day4.blocks.length}`);

  // 1. Update session-level metadata
  await prisma.session.update({
    where: { id: day4.id },
    data: {
      summary: `Agent는 LLM의 확장이 아니라
맥락 설계 파이프라인임을 이해한다.
좋은 Agent와 나쁜 Agent의 차이를
코드 구조와 Context 설계 관점에서 명확히 구분한다.
LLM Agent의 고유 한계(환각, 비결정성)를 인식하고,
이를 맥락 설계로 통제하는 방법을 학습한다.
보험 산학 프로젝트에 적용 가능한
Context 기반 Agent 설계 능력을 확보한다.`,
      goals: [
        "LLM Agent의 정의 — 보편적 Agent와의 차이, 고유 한계 포함",
        "왜 지금 Agent가 각광받는가",
        "Agent = Context Builder + Loop라는 구조",
        "나쁜 Agent vs 좋은 Agent의 라이브 코드 비교",
        "Context 4요소의 단계적 실험 (on/off)",
        "보험 도메인 기초 용어와 맥락 재설계 적용",
      ],
    },
  });
  console.log("✓ Session metadata updated");

  // 2. Update blocks
  for (const block of day4.blocks) {
    let newDescription: string | undefined;
    let newTitle: string | undefined;

    switch (block.order) {
      // ──────────────────────────────────────────
      // Block 0: Q6 — LLM Agent 고유 한계를 정의에 포함
      // ──────────────────────────────────────────
      case 0:
        newDescription = `AI Agent는:
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
   — 보험에서 존재하지 않는 hazard rate를 만들어낼 수 있다.
2. 비결정성(Non-determinism)
   — 같은 입력에도 다른 출력이 나온다.
   — 동일 고객 데이터로 매번 다른 리스크 판단이 나올 수 있다.
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
실제 시스템으로 확장하는 구조다.`;
        break;

      // ──────────────────────────────────────────
      // Block 1: Q7 — "Agent는 맥락의 결과" → "Agent의 품질 = 맥락 설계의 품질"
      // ──────────────────────────────────────────
      case 1:
        newDescription = `[연결] 하지만 여기서 가장 중요한 것은
LLM이 변한 것이 아니라는 점이다.

LLM은 여전히 다음 토큰 예측기다.
Agent처럼 보이는 이유는
우리가:
- 이전 결과를 다시 넣고
- Tool 결과를 다시 넣고
- 외부 데이터를 다시 넣고
맥락을 반복적으로 공급하기 시작했기 때문이다.

Agent는 마법이 아니다.
Agent의 품질 = 맥락 설계의 품질이다.

똑같은 LLM이라도
맥락을 잘 설계하면 좋은 Agent,
맥락을 대충 넣으면 나쁜 Agent가 된다.
이것이 오늘 증명할 핵심 명제다.`;
        break;

      // ──────────────────────────────────────────
      // Block 3: Q1 — 나쁜 Agent 라이브 데모 구조 + Q3 보험 용어 설명
      // ──────────────────────────────────────────
      case 3:
        newTitle = "❌ 나쁜 Agent 예시 — 라이브 데모";
        newDescription = `[연결] 이제 실제 예시로 비교해보자.
이 블록과 다음 블록은 동일 입력으로 두 코드를 실행하고,
결과를 직접 비교하는 라이브 데모다.

■ 라이브 데모 — 나쁜 Agent
[시연 코드: GitHub / Colab 링크 세션 전 준비]

단순 프롬프트 기반:
prompt = """
보험 상품 개선을 위해 추가할 수 있는 피쳐를 제안해줘.
현재 데이터는 나이, 성별, 직업이야.
"""
response = llm(prompt)

문제점:
- 목표 불명확 → LLM이 "아무 방향"으로 생성
- 리스크 정의 없음 → 어떤 위험을 줄이려는 건지 모름
- 계리 연결 기준 없음 → 보험 수리적으로 의미 없는 제안
- 상태 관리 없음 → 이전 판단을 기억 못 함
- 평가 기준 없음 → 좋은/나쁜 판단 불가

결과 (라이브 실행):
- 건강 데이터
- 소득 수준
- 라이프스타일
그럴듯하지만
계리 모델에 연결 불가.

■ 용어 참고 — "계리 모델"이란?
보험료를 수학적으로 계산하는 체계다.
"이 고객이 보험금을 청구할 확률"을 예측하고,
그에 맞는 보험료를 산출하는 것이 핵심이다.
계리 모델에 연결 불가 = 보험 실무에서 쓸 수 없다는 뜻이다.

맥락이 오염되어 있다.`;
        break;

      // ──────────────────────────────────────────
      // Block 4: Q1 — 좋은 Agent 라이브 데모 + Q3 보험 용어 상세 설명
      // ──────────────────────────────────────────
      case 4:
        newTitle = "✅ 좋은 Agent 예시 — 라이브 데모";
        newDescription = `[연결] 같은 문제를 구조화하면 어떻게 달라질까?
동일한 LLM, 동일한 입력. 맥락만 다르다.

■ 라이브 데모 — 좋은 Agent
[시연 코드: GitHub / Colab 링크 세션 전 준비]

context = {
    "goal": "Mortality 기반 세그먼트 확장",
    "current_variables": ["age", "gender", "job"],
    "risk_definition": "hazard rate 조정 가능성",
    "constraint": "실제 수집 가능 데이터",
    "evaluation_metric": "계리 연결 가능성"
}
response = llm_reason(context)

■ 보험 도메인 핵심 용어 해설

1. Mortality (사망률)
   — 특정 연령/집단의 사망 확률.
   — 생명보험의 가장 기본적인 리스크 지표.
   — 예: "30대 남성 비흡연자의 연간 사망률 = 0.1%"
   — 이 숫자가 보험료 계산의 출발점이다.

2. Hazard Rate (위험률)
   — 특정 시점에 사고/질병/사망이 발생할 순간 확률.
   — Mortality보다 정밀한 개념: "지금까지 살아있는 사람이 다음 순간 사망할 확률"
   — 보험에서 중요한 이유: 시간에 따라 위험이 변하기 때문.
   — 예: 흡연자의 hazard rate는 비흡연자보다 1.5~2배 높다.

3. 세그먼트 (Segment)
   — 비슷한 리스크를 가진 고객 그룹.
   — 현재: 나이·성별·직업 기준 (전통적, 단순)
   — 목표: 행동 데이터 등 새 변수로 더 정밀한 세그먼트 구성

4. 계리 연결 가능성
   — 새로운 변수가 실제로 보험료 계산에 반영될 수 있는가?
   — "운동 데이터"를 수집해도, 그것이 hazard rate에 어떻게 영향을 주는지 수학적으로 연결 못 하면 의미 없다.

차이:
- 목적 명확 → Mortality 기반 세그먼트 확장
- 해석 기준 명확 → hazard rate 조정 가능성
- 평가 지표 존재 → 계리 연결 가능성
- 도메인 맥락 반영 → 보험 특화

결과 (라이브 실행):
- 특정 행동 데이터 (운동빈도, 건강검진 결과)
- hazard rate 조정 논리 포함
- 계리 모델 연결 경로 설명

LLM은 동일하다.
맥락이 결과를 바꾼다.

[데모 후] 두 결과를 나란히 비교하며 토론:
- 어떤 출력이 실무에서 사용 가능한가?
- 나쁜 Agent의 출력을 "개선"할 수 있는가, 아니면 구조를 바꿔야 하는가?`;
        break;

      // ──────────────────────────────────────────
      // Block 5: Q4 — Day 2 "맥락 주입 4대 요소"와 Day 4 "Context 4요소" 계층 연결
      // ──────────────────────────────────────────
      case 5:
        newDescription = `[연결] 이 차이를 만드는 것이 무엇인가?

■ Day 2 복습 — 프롬프트 레벨의 맥락 주입
Day 2에서 배운 "맥락 주입의 4대 요소":
1. 역할 — AI가 어떤 관점에서 판단할지
2. 목표 — 무엇을 만들어야 하는지
3. 상태 — 현재 어떤 조건/제약이 있는지
4. 제약 — 하지 말아야 할 것, 지켜야 할 것
이것은 프롬프트 한 번에 넣는 맥락이다.
사람이 직접 작성하는 수준.

■ Day 4 — 시스템 레벨의 맥락 통제
오늘 다루는 "Context 4요소":
1. Context Selection
   무엇을 보여주고 무엇을 숨길 것인가
   → 불필요한 정보는 LLM을 혼란시킨다
2. Context Compression
   불필요한 정보 제거 및 요약
   → 토큰 한계 안에서 핵심만 전달
3. Context Framing
   해석 관점 명시
   → 같은 데이터도 프레이밍에 따라 다르게 해석된다
4. Context Iteration
   결과를 다시 반영
   → Agent가 자기 출력을 다음 입력으로 사용

■ 두 프레임워크의 관계
프롬프트 레벨 (Day 2):
  "한 번의 질문"에 맥락을 잘 넣는 기술
  → 사람이 수동으로 작성

시스템 레벨 (Day 4):
  "코드로 맥락을 자동 구성"하는 설계
  → build_context()가 자동으로 수행
  → 매 루프마다 update_context()가 갱신

Day 2의 4대 요소는 "재료"이고,
Day 4의 4요소는 "재료를 조립하는 파이프라인"이다.

좋은 Agent는
맥락을 통제한다.`;
        break;

      // ──────────────────────────────────────────
      // Block 7: Q2 — Context 4요소 단계적 on/off 실험
      // ──────────────────────────────────────────
      case 7:
        newTitle = "실습 — Context 4요소 단계적 실험";
        newDescription = `[연결] 이제 이 구조 위에서 실험한다.
4요소를 하나씩 켜면서 결과가 어떻게 달라지는지 확인한다.

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
→ 예상: 일반적이고 모호한 응답

[실험 2] Selection만 ON
context_config = {
    "selection": True,    # ← ON
    "compression": False,
    "framing": False,
    "iteration": False
}
→ 관련 데이터만 골라서 전달
→ 예상: 관련성은 높아지지만 해석 기준 없음
→ 관찰 포인트: 불필요한 정보가 빠지면 결과가 얼마나 달라지나?

[실험 3] Selection + Compression + Framing ON
context_config = {
    "selection": True,
    "compression": True,   # ← ON
    "framing": True,       # ← ON
    "iteration": False
}
→ 핵심만 압축 + 해석 관점 명시
→ 예상: 도메인에 맞는 구조화된 응답
→ 관찰 포인트: Framing이 추가되면 "관점"이 생기는가?

[실험 4] 4요소 모두 ON
context_config = {
    "selection": True,
    "compression": True,
    "framing": True,
    "iteration": True     # ← ON
}
→ 이전 결과를 반영하여 2차 판단
→ 예상: 자기 수정, 일관성 향상
→ 관찰 포인트: Iteration이 추가되면 "자기 수정"이 발생하는가?

■ 비교 기준
각 실험 결과를 다음 기준으로 비교:
1. 판단 일관성 — 같은 질문에 유사한 답변이 나오는가?
2. 도메인 적합성 — 보험/계리 맥락에 맞는 답변인가?
3. 오류 유형 — 환각이 줄어드는가? 어떤 요소에서?
4. 해석 안정성 — 프레이밍에 따라 해석이 흔들리지 않는가?

LLM은 동일하다.
맥락을 하나씩 추가할 때마다 결과가 어떻게 바뀌는지,
직접 눈으로 확인한다.`;
        break;

      // ──────────────────────────────────────────
      // Block 8: Q3 — 보험 도메인 용어 상세 설명 추가
      // ──────────────────────────────────────────
      case 8:
        newDescription = `[연결] 이 프레임을 산학 문제에 적용한다.

■ 보험 도메인 기본 구조 — 상세 해설

보험의 핵심 질문:
"이 고객에게 얼마를 받아야 하는가?"
이 질문에 답하려면 리스크를 수학적으로 측정해야 한다.

1. Mortality Table (사망률표 / 경험생명표)
   — 연령별 사망 확률을 정리한 표.
   — 보험사의 가장 기본적인 데이터.
   — 예: "35세 남성의 1년 내 사망 확률 = 0.0015"
   — 이 표를 기반으로 생명보험료가 계산된다.
   — 대한민국 보험에서는 '경험생명표'를 사용하며,
     보험개발원이 주기적으로 갱신한다.

2. Hazard Rate (위험률 / 순간사고발생률)
   — 특정 시점에서의 위험 발생 확률.
   — "지금까지 무사한 사람이 다음 순간에 사고를 겪을 확률"
   — 시간에 따라 변하는 위험을 모델링한다.
   — 왜 중요한가?
     → 나이가 들수록 hazard rate가 올라간다.
     → 흡연, 직업, 건강 상태에 따라 달라진다.
     → Agent가 "새 변수 추가"를 제안할 때,
        그 변수가 hazard rate를 어떻게 바꾸는지 설명할 수 있어야 한다.

3. 세그먼트 (Segment / 위험 그룹)
   — 비슷한 리스크 프로필을 가진 고객 집단.
   — 전통적 세그먼트: 나이, 성별, 직업 (3변수)
   — 목표: 더 정밀한 세그먼트
     → 행동 데이터, 건강검진 결과, IoT 데이터 등 추가
   — 주의: 과도한 세그먼트 세분화는 "리스크 풀 붕괴"를 유발할 수 있다.
     (보험은 대수의 법칙에 기반하므로 그룹이 너무 작으면 예측이 불안정해진다)

4. Premium (보험료) 기본 공식
   Premium = E[Loss|Segment] + Expense + Margin
   — E[Loss|Segment]: 해당 그룹의 예상 손실 (사망률 × 보험금)
   — Expense: 운영비
   — Margin: 이윤
   ※ 이것은 단순화된 개념 모형이다.
   실제로는 시간가치 할인, 재보험 비용 등이 추가된다.

5. 기존 가정 테이블 (Assumption Table)
   — 보험사가 상품 설계에 사용하는 가정값 모음.
   — 예: 이자율 가정, 사업비율 가정, 해약률 가정
   — Agent가 참조해야 할 "도메인 맥락"의 핵심.

■ 현재 보험 구조의 문제
- 나이·성별 중심 세그먼트 (너무 단순)
- 평균 기반 리스크 (개인차 무시)
- 정태적 변수 (시간에 따른 변화 미반영)

■ Agent가 해결할 문제
새로운 feature를
계리 모델에 연결할 맥락이 없다.

질문:
보험 Agent의 Context Builder는
어떤 요소를 포함해야 하는가?
- Mortality 구조 (어떤 사망률표를 기준으로 하는가?)
- Hazard rate 정의 (어떤 위험을 측정하는가?)
- 기존 가정 테이블 (현재 어떤 가정을 사용하는가?)
- 데이터 수집 가능성 (현실적으로 얻을 수 있는 데이터인가?)
- 계리 연결 경로 (새 변수가 보험료 계산에 어떻게 반영되는가?)

산학 과제는
기능 구현이 아니라
맥락 재설계다.

이 용어들은 Day 5에서 온톨로지 설계와 함께 더 깊이 다룬다.
오늘은 "맥락 설계에 도메인 지식이 왜 필수인지"를 이해하는 것이 목표다.`;
        break;

      // ──────────────────────────────────────────
      // Block 9: Q8 — 과제 템플릿 & 루브릭
      // ──────────────────────────────────────────
      case 9:
        newTitle = "과제 안내 — 보험 도메인 Agent 설계 문서";
        newDescription = `[연결] 이제 설계 문서를 작성한다.

■ 과제: 보험 도메인 Agent 설계 문서 작성

제출 기한: 다음 세션 전까지
제출 형식: Markdown (.md) 또는 PDF — GitHub 또는 세션 웹 제출
분량: A4 기준 3~5페이지

■ 설계 문서 템플릿

===== 1. Agent 목표 정의 =====
- Agent가 해결하려는 구체적 문제는?
- 최종 사용자는 누구인가? (계리사? 영업? 고객?)
- 성공 기준은 무엇인가?

작성 예시:
"Mortality 기반 세그먼트에 새로운 행동 변수를 추가하여
  기존 3변수(나이/성별/직업) 대비 hazard rate 예측 정밀도를 향상시키는
  Feature Discovery Agent"

===== 2. Context 4요소 설계 =====
각 요소별로 구체적으로 작성한다:

(a) Selection — 무엇을 보여주고 무엇을 숨기나?
- Agent에 전달할 데이터: [구체적으로 나열]
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

===== 3. Context 기반 평가 지표 (3개 이상) =====
각 지표에 대해:
- 지표 이름
- 측정 방법 (코드로 자동 측정 가능? 인간 평가 필요?)
- 기준값 (어느 수준이면 합격?)

작성 예시:
1. "계리 연결 가능성 점수" — 출력에 hazard rate 조정 논리가 포함되었는가? (0~1)
2. "맥락 최소화 수준" — 불필요 정보 제거 비율 (목표: 70% 이상)
3. "반복 실행 안정성" — 5회 실행 시 결과 일관성 (표준편차 기반)

===== 4. 실패 케이스 분석 (1개 이상) =====
- 실패 상황 설명
- 왜 실패하는가? (맥락 설계의 어떤 부분이 부족한가?)
- 어떻게 개선할 수 있는가?

작성 예시:
"Context Selection에서 과거 클레임 이력을 제외했더니,
  Agent가 신규 고객과 기존 고객을 구분하지 못해
  hazard rate 추정이 30% 이상 벗어남.
  → Selection에 최근 3년 클레임 요약을 추가하여 해결."

===== 5. 나쁜 Agent vs 좋은 Agent 비교 =====
- 나쁜 Agent: 동일 문제를 맥락 없이 접근하는 코드/구조
- 좋은 Agent: Context 4요소가 적용된 코드/구조
- 핵심 차이점 3가지 이상 서술

■ 평가 루브릭

| 항목 | 배점 | A (탁월) | B (양호) | C (미흡) |
|---|---|---|---|---|
| Context 4요소 설계 | 40% | 4요소 모두 구체적 구현 수준 기술, Selection/Compression에 데이터 예시 포함 | 4요소 작성했으나 일부 추상적 | 2개 이하 작성 또는 형식적 |
| 평가 지표 | 20% | 3개 이상, 측정 방법과 기준값 구체적 | 3개 작성했으나 기준값 모호 | 2개 이하 또는 측정 불가능한 지표 |
| 실패 케이스 분석 | 20% | 원인→결과→개선까지 논리적 흐름 | 실패 상황은 있으나 개선안 부족 | 실패 사례 없음 또는 피상적 |
| 나쁜/좋은 비교 분석 | 20% | 코드 수준 비교 + 차이점 3개 이상 | 개념적 비교만 존재 | 비교 없음 |

핵심: 코드 완성도가 아니라 "맥락 설계의 사고 과정"을 평가한다.`;
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

  console.log("\nDay 4 update complete!");
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
