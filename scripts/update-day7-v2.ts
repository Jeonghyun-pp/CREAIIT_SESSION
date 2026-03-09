import path from "node:path";
import { config } from "dotenv";
config({ path: path.join(__dirname, "..", ".env.local") });

import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL! });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const DAY7_ID = "cmm5y4xz4001jn4uljqp4tnyt";

async function main() {
  const day7 = await prisma.session.findUnique({
    where: { id: DAY7_ID },
    include: { blocks: { orderBy: { order: "asc" } } },
  });

  if (!day7) {
    console.error("Day 7 session not found!");
    process.exit(1);
  }

  console.log(`Found Day 7: ${day7.title}`);
  console.log(`Existing blocks: ${day7.blocks.length}`);

  for (const block of day7.blocks) {
    switch (block.order) {
      // Block 1: 7대 축 끝에 Context Quality 추가 (문제 2)
      case 1: {
        await prisma.sessionBlock.update({
          where: { id: block.id },
          data: {
            title: "보편 Agent 성공 기준 프레임 (8대 축 + 예시)",
            description: `[연결] 먼저 보편적인 Agent 평가 프레임을 잡는다.

Agent 평가의 보편 8대 축:
1) Task Success (목표 달성도)
2) Plan & Trajectory Quality (행동 경로 품질)
3) Tool Correctness (도구 선택/사용 정확성)
4) Robustness (강건성/안정성)
5) Efficiency (속도/비용)
6) Explainability (설명 가능성/추적 가능성)
7) Business Impact (업무 가치)
8) Context Quality (맥락 품질)
각 항목을 "측정"으로 내려야 한다.
---
[1] Task Success — "끝냈는가?"
예시(공지 작성 Agent):
- 필수 항목(일시/장소/준비물/신청방법) 누락 0개 → Success
- 누락 1개 이상 → Fail
예시(보험 feature 제안 Agent):
- "신규 피처 후보 5개" + 각 후보에 "계리적 연결 가설 1개" + "수집 가능성 1줄"
  → 요구사항 만족하면 Success
측정 방식:
- test_cases 10개 중 pass 비율 = Completion Rate
---
[2] Plan & Trajectory Quality — "제대로 된 경로로 갔는가?"
예시:
- "검증이 필요한 작업"이면 tool로 먼저 검증 후 수정해야 함
- 그런데 tool 없이 바로 최종 답을 내면 Plan 품질 낮음
측정 방식(간단):
- tool을 써야 하는 케이스에서 tool을 사용했는가? (Yes/No)
- steps 수가 max_steps 대비 합리적인가?
---
[3] Tool Correctness — "맞는 도구를 맞게 썼는가?"
예시:
- 누락 검사는 check_required_fields를 써야 한다.
- 보험 개념 조회는 ontology_lookup을 써야 한다.
- 엉뚱한 tool 호출 → Fail
측정:
- Tool selection accuracy (%)
- Tool args validity (%)
---
[4] Robustness — "반복해도 안정적인가?"
예시:
- 동일 입력 5회 실행 시, 추천 피처 Top3가 5회 중 4회 이상 동일하면 안정적
측정:
- consistency@k (예: top3 일치율)
- variance of scores
---
[5] Efficiency — "비용/시간이 합리적인가?"
예시:
- 불필요한 tool 호출 반복은 비용 증가
- 같은 목표를 steps 2~3에 끝낼 수 있어야 함
측정:
- avg_steps
- tool_calls_per_run
- (가능하면) token/cost 추정
---
[6] Explainability — "근거가 남는가?"
예시:
- "왜 smoking_status를 추천했는가?"에 대해
  hazard 연결 가설 + 근거 + 한계(반례 가능성)가 있어야 함
측정:
- explanation_coverage (필수 항목을 설명에 포함했는가)
  (예: [가설][근거][한계][다음 액션] 4요소)
---
[7] Business Impact — "업무가 빨라지는가?"
예시:
- 사람이 30분 걸리던 "피처 후보 정리+근거 정리"를
  Agent가 3분에 초안 제공 → "의사결정 단축률"로 연결
측정:
- time_saved_estimate (정성+정량 혼합)
- decision_latency_reduction (팀 내부 정의)
---
[8] Context Quality — "맥락이 올바르게 구성되었는가?"
4일차에서 배운 맥락 오염과 디버깅의 연장이다.
Agent의 출력이 나쁠 때, 모델 탓인지 맥락 탓인지 구분해야 한다.

평가 질문:
- 맥락이 충분했는가? (필요 정보 누락 여부)
- 맥락이 과했는가? (불필요 정보로 핵심이 묻혔는가)
- 맥락이 일관됐는가? (모순된 지시가 공존하지 않는가)
- 맥락이 오염됐는가? (이전 턴의 잔류 정보가 간섭하는가)

측정:
- context_sufficiency: 필수 정보(ontology, state, constraint)가 build_context()에 포함되었는가 (%)
- context_noise_ratio: 전체 맥락 중 실제 사용된 정보의 비율
- context_consistency: 동일 입력에서 build_context() 결과가 일관되는가

왜 중요한가:
- 출력 KPI(1~7번)가 낮을 때, 원인이 모델인지 맥락인지 구분하는 유일한 방법
- 맥락을 개선하면 모델을 바꾸지 않고도 KPI가 올라간다
- 이것이 4일차에서 배운 "모델을 바꾸기 전에 맥락을 바꿔라"의 측정 가능한 형태다`,
          },
        });
        console.log(`✓ Block 1 updated (7대 축 → 8대 축, Context Quality 추가)`);
        break;
      }

      // Block 4: scorer의 데이터 소스 명시 (문제 4)
      case 4: {
        await prisma.sessionBlock.update({
          where: { id: block.id },
          data: {
            description: `[연결] 이제 이 성공 기준을 "코드"에 반영한다. (오늘의 핵심)

핵심 아이디어:
- Agent 출력은 "텍스트"지만
- 평가는 "구조화된 데이터"가 있어야 자동화된다.
따라서 우리는:
1) Agent 출력 포맷을 강제한다 (JSON 또는 JSON-like 섹션)
2) 출력에서 지표를 자동 추출한다 (scorer)
3) 테스트 케이스를 돌려 점수를 만든다 (eval runner)
4) 리포트를 생성한다 (report generator)

■ Scorer의 데이터 소스
scorer는 두 곳에서 데이터를 읽는다:
1) Agent의 최종 출력 (JSON) → 출력 품질 KPI 산출
2) state.json의 실행 로그 → 행동 품질 KPI 산출

6일차에서 정의한 로그 포맷:
{ "step": 1, "tool": "ontology_lookup", "result": {...}, "duration_ms": 230, "error": null }

이 로그가 있어야 tool_selection_accuracy, avg_steps, tool_calls_per_run 등을 자동 산출할 수 있다.
6일차의 로그 설계가 오늘의 KPI 측정 기반이다.

---
[코드 반영 포인트 1] Output Schema 강제
Agent가 피처를 추천할 때
다음 구조를 반드시 포함하도록 한다:
- feature_name
- risk_concept (ontology key)
- actuarial_mapping_hint (예: hazard_multiplier)
- rationale (근거)
- limitation (반례/한계)
- data_feasibility (low/med/high)
- compliance_note (주의점)
이 스키마가 곧 평가 기준이 된다.
---
[코드 반영 포인트 2] Scorer 구현
운영진 코드베이스에 scorer.py를 추가한다:

출력 기반 지표 (JSON 출력에서 산출):
- mapping_presence_rate
- explanation_coverage_score
- compliance_note_presence
- schema_conformance

로그 기반 지표 (state.json에서 산출):
- tool_selection_accuracy
- avg_steps
- tool_calls_per_run

안정성 지표 (반복 실행으로 산출):
- consistency@k

즉 "성공 기준 = scorer 함수 집합"이 된다.
---
[코드 반영 포인트 3] Test Set 구축
보험 테스트 케이스는 최소 10개:
- 정상 케이스 6개
- 엣지 케이스 4개 (모호한 입력, 규제 이슈, 과도한 피처 등)
각 케이스에는 "기대되는 평가 항목"을 라벨링:
- expected_tool
- required_schema_fields
- must_include_compliance_note (True/False)
---
[코드 반영 포인트 4] Report Generator
eval 결과를 run_report.md / eval_report.md로 생성:
- 전체 점수 표
- 케이스별 실패 이유
- 개선 액션 제안
이게 산학 과제 보고서의 뼈대가 된다.`,
          },
        });
        console.log(`✓ Block 4 updated (scorer 데이터 소스 + 로그 연결 명시)`);
        break;
      }

      // Block 5: 실습 성공 기준 구체화 (문제 3)
      case 5: {
        await prisma.sessionBlock.update({
          where: { id: block.id },
          data: {
            description: `[연결] 이제 실습으로 "실제로 KPI를 만들어본다."

실습 목표:
운영진 Agent skeleton에
보험 성공 기준을 붙여서
실제 점수를 산출한다.

■ Step 1: 보험 출력 스키마 정의
- Agent 출력에 포함할 JSON 필드를 확정한다
- 최소: feature_name, risk_concept, rationale, compliance_note
성공 기준: 스키마를 Python dict 또는 JSON Schema로 정의 완료
확인 방법: schema 파일(또는 코드 내 dict)이 존재하고, 필수 필드 7개가 정의됨

■ Step 2: Agent 프롬프트에 스키마 강제
- system prompt에 "반드시 다음 JSON 형식으로 응답하라"를 추가
- 형식 예시를 프롬프트에 포함
성공 기준: Agent 실행 시 JSON 형식의 출력이 나온다
확인 방법: Agent를 1회 실행하고, 출력이 JSON으로 파싱 가능한지 확인

■ Step 3: scorer.py에서 KPI 산출
- Block 4의 scorer 함수들을 구현한다
- 최소 4개 함수: mapping_presence_rate, compliance_note_presence, schema_conformance, explanation_coverage_score
성공 기준: scorer.py에 함수 4개 이상 구현, 각 함수가 점수를 반환
확인 방법: 테스트 출력 1개를 scorer에 넣고, 점수 dict가 출력되는지 확인
예시 출력: {"mapping_presence_rate": 0.8, "compliance_note_presence": true, ...}

■ Step 4: 10개 케이스 eval 실행
- test_cases.json에 10개 입력을 정의한다
- 각 케이스에 expected_tool, required_fields를 라벨링한다
- eval runner가 10개를 순차 실행하고 scorer로 점수를 산출한다
성공 기준: 10개 케이스 전부 실행 완료, 각 케이스에 점수가 산출됨
확인 방법: eval 실행 후 결과 테이블이 터미널에 출력되거나 파일로 저장됨

■ Step 5: eval_report.md 생성
- Step 4의 결과를 Markdown 리포트로 자동 생성한다
- 포함: 전체 평균 점수, 케이스별 점수, 실패 케이스 목록
성공 기준: eval_report.md 파일이 자동 생성되고, 점수표가 포함됨
확인 방법: cat eval_report.md 로 내용 확인

■ 실습 전체 성공 기준
- 보험 KPI 6개 중 최소 4개는 자동 산출
- report_schema_conformance 80% 이상
- mapping_presence_rate 목표치(팀이 설정) 달성
- eval_report.md가 자동 생성됨`,
          },
        });
        console.log(`✓ Block 5 updated (실습 성공 기준 구체화)`);
        break;
      }

      default:
        console.log(`  Block ${block.order} (${block.title}) — 변경 없음`);
        break;
    }
  }

  // 최종 확인
  const updated = await prisma.session.findUnique({
    where: { id: DAY7_ID },
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
