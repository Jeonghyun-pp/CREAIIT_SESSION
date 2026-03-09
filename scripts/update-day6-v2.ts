import path from "node:path";
import { config } from "dotenv";
config({ path: path.join(__dirname, "..", ".env.local") });

import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL! });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const DAY6_ID = "cmm5x8r6l0019n4ulxm2w1wdg";

async function main() {
  const day6 = await prisma.session.findUnique({
    where: { id: DAY6_ID },
    include: { blocks: { orderBy: { order: "asc" } } },
  });

  if (!day6) {
    console.error("Day 6 session not found!");
    process.exit(1);
  }

  console.log(`Found Day 6: ${day6.title}`);
  console.log(`Existing blocks: ${day6.blocks.length}`);

  // ── 1. Session metadata 수정 ──
  await prisma.session.update({
    where: { id: DAY6_ID },
    data: {
      goals: [
        "3일차(단일 Tool Calling)에서 6일차(Loop + State + Stop Condition)로의 구조적 도약",
        "Agent의 전형적 구조 (A~F)",
        "ReAct 패턴의 의미 (Reason + Act)",
        "Tool Calling 루프의 최소 구현 방식",
        "State 설계와 Stop Condition의 중요성",
        "5일차 온톨로지와 Agent skeleton의 연결",
        "실무형 가드레일 설계 (에러 처리, retry, 로그)",
      ],
    },
  });
  console.log("✓ Session metadata updated");

  // ── 2. 기존 블록 수정 ──
  for (const block of day6.blocks) {
    switch (block.order) {
      // Block 0: 이전 세션 참조 업데이트 + 3일차와 차별점 명시 (문제 1)
      case 0: {
        await prisma.sessionBlock.update({
          where: { id: block.id },
          data: {
            description: `지금까지의 흐름을 정리한다:

3/16 (3일차): API 호출, Tool Calling, Brain–Hands 비유
→ LLM이 Tool을 1번 호출하고 결과를 받는 구조
→ 단일 호출. 루프 없음. 상태 없음.

3/19 (4일차): Context 4요소, Context Window, 맥락 오염과 디버깅
→ 맥락이 결과를 바꾼다는 것을 증명
→ 설계 원리는 배웠지만 구현은 아직

3/23 (5일차): 보험 도메인 해체, 온톨로지 4계층 설계
→ Feature → Risk Concept → Actuarial Mapping 구조
→ Agent가 어디에 개입하는지 정의

하지만 아직 우리는
"Agent를 직접 만들어보지 않았다."

■ 3일차와 오늘의 차이
3일차: 단일 Tool Calling
→ LLM 호출 1번 → Tool 1번 → 끝

오늘: 완전한 Agent 구조
→ Loop (반복)
→ State (상태 유지)
→ Stop Condition (종료 조건)
→ 여러 Tool 중 상황에 맞는 것을 선택
→ 실패 시 대응

지금 필요한 것은 사고 확장이 아니라
구조 체험이다.
오늘의 목표는:
똑똑한 Agent가 아니라
구조가 있는 Agent.`,
          },
        });
        console.log(`✓ Block 0 updated (이전 세션 참조 + 3일차 차별점)`);
        break;
      }

      // Block 3: 코드 구조 설명 — 최소한의 코드 스니펫 추가 (문제 2) + 온톨로지 연결 (문제 5)
      case 3: {
        await prisma.sessionBlock.update({
          where: { id: block.id },
          data: {
            description: `[연결] 이제 실제 코드 구조를 본다.
※ 전체 코드는 배포 자료로 다운로드한다. 여기서는 핵심 구조만 확인한다.

■ 공통 skeleton 파일 구조
- agent.py      — Agent 메인 루프
- tools.py      — Tool 함수 정의 + JSON Schema
- ontology.json — 5일차에서 설계한 온톨로지 (4계층)
- state.json    — 실행 상태 저장
- run_report.md — 실행 리포트 자동 생성

■ A~F가 코드에서 어디에 해당하는가

A) Input
   user_input = input("요청: ")

B) Context Builder
   def build_context(user_input, state, ontology):
       return f"""
       [목표] {user_input}
       [이전 실행] {state.get('last_result', '없음')}
       [도메인] {ontology['risk_concepts']}
       [제약] 계리 연결 가능성을 반드시 포함할 것
       """

C) LLM Reason
   response = client.responses.create(
       model="...",
       instructions=context,
       input=user_input,
       tools=TOOLS
   )

D) Tool Exec
   for item in response.output:
       if item.type == "function_call":
           result = execute_tool(item.name, item.arguments)

E) State Update
   state["runs"].append({
       "step": step,
       "tool": item.name,
       "result": result
   })
   save_state(state)

F) Stop Condition
   for step in range(max_steps):
       ...
       if no_tool_call:
           break

■ 핵심 루프 구조 (agent.py의 뼈대)
state = load_state()
ontology = load_ontology()

for step in range(max_steps):
    context = build_context(user_input, state, ontology)
    response = llm_call(context, tools=TOOLS)

    if has_tool_call(response):
        result = execute_tool(response)
        state = update_state(state, step, result)
        # Tool 결과를 다시 LLM에 전달 → 다음 루프
    else:
        final_answer = response.output_text
        break

save_report(state, final_answer)

여기서 가장 중요한 부분은:
1. build_context()가 ontology와 state를 조합하는 것
2. Tool 결과를 state에 저장하고 다시 LLM에 넣는 것
3. Tool 호출이 없으면 루프가 종료되는 것

■ ontology.json과 5일차의 연결
이 파일은 5일차에서 설계한 4계층 구조를 그대로 사용한다:
{
  "version": "0.1.0",
  "data_features": { ... },     // Layer 1: Data
  "feature_definitions": { ... }, // Layer 2: Feature
  "risk_concepts": { ... },      // Layer 3: Risk Concept
  "actuarial_mappings": { ... }   // Layer 4: Actuarial Mapping
}

Tool인 ontology_lookup()은 이 파일을 참조해서
feature → risk concept → hazard multiplier 경로를 반환한다.
5일차의 설계가 오늘의 코드에 직접 연결된다.`,
          },
        });
        console.log(`✓ Block 3 updated (코드 스니펫 + 온톨로지 연결)`);
        break;
      }

      // Block 4: Checkpoint 성공 기준 구체화 (문제 3)
      case 4: {
        await prisma.sessionBlock.update({
          where: { id: block.id },
          data: {
            description: `[연결] 이제 실습으로 들어간다.

운영 방식:
운영진과 동일 코드베이스에서
5개 Checkpoint를 순차 통과한다.

■ Checkpoint 1: LLM 1회 호출 + State 기록
목표: Agent가 LLM을 호출하고 응답을 받는다.
구현: build_context() → llm_call() → print(response)
성공 기준:
- 터미널에 LLM 응답 텍스트가 출력된다
- state.json에 {"runs": [{"step": 0, ...}]} 가 저장된다
확인 방법: cat state.json 으로 내용 확인

■ Checkpoint 2: Tool 1개 연결
목표: LLM이 Tool을 호출하고, 결과가 반영된 수정 출력이 나온다.
구현: tools.py에 ontology_lookup 정의 → TOOLS에 등록
성공 기준:
- LLM 응답에 "function_call"이 포함된다
- Tool 실행 결과가 LLM에 다시 전달된다
- 최종 출력에 Tool 결과가 반영되어 있다
확인 방법: 로그에서 "Tool called: ontology_lookup" 확인

■ Checkpoint 3: Tool 2개 이상 + 상황별 선택
목표: LLM이 상황에 따라 다른 Tool을 선택한다.
구현: hazard_hint, data_feasibility 등 추가 Tool 등록
성공 기준:
- 서로 다른 입력에서 서로 다른 Tool이 호출된다
- state.json의 tool_history에 2종류 이상의 Tool 이름이 존재한다
확인 방법: state.json의 runs 배열에서 tool 필드 확인

■ Checkpoint 4: State 반영 + 판단 안정화
목표: 2회 실행 시 이전 실행 결과가 다음 판단에 반영된다.
구현: build_context()에서 state["runs"]를 맥락에 포함
성공 기준:
- 1회차와 2회차의 출력이 다르다 (이전 결과를 참조하므로)
- 2회차 출력에 "이전 실행에서..."와 같은 참조가 포함된다
- state.json의 runs 배열에 2개 이상의 항목이 존재한다
확인 방법: 2회 연속 실행 후 출력 비교

■ Checkpoint 5: 종료 조건 + 에러 처리 + 리포트
목표: max_steps, Tool 실패 대응, run_report.md 자동 생성
구현:
- max_steps=5 설정
- Tool 실패 시 에러를 state에 기록하고 LLM에 알림
- 루프 종료 후 run_report.md 생성
성공 기준:
- max_steps에 도달하면 루프가 안전하게 종료된다
- Tool에 잘못된 인자를 넣어도 Agent가 크래시하지 않는다
- run_report.md에 실행 요약이 자동 기록된다
확인 방법: run_report.md 파일 내용 확인

각 Checkpoint는 이전 단계가 완성되어야 진행할 수 있다.
막히면 운영진에게 구조적 질문을 할 것.
코드를 대신 짜주지는 않지만 방향은 잡아준다.`,
          },
        });
        console.log(`✓ Block 4 updated (Checkpoint 성공 기준 구체화)`);
        break;
      }

      // Block 5: 실무형 설계 포인트 보충 (문제 4)
      case 5: {
        await prisma.sessionBlock.update({
          where: { id: block.id },
          data: {
            description: `[연결] 이제 실무 관점의 설계 포인트를 본다.

실무에서 Agent가 실패하는 이유:
- 상태가 없다 → 이전 판단을 기억 못 함
- 무한 루프에 빠진다 → 종료 조건이 없음
- Tool 결과를 반영하지 않는다 → 같은 실수를 반복
- 로그가 없다 → 문제를 진단할 수 없음

■ 1. 에러 처리 패턴

절대 하면 안 되는 것:
try:
    result = execute_tool(name, args)
except:
    pass  # ← 에러를 삼켜버리면 Agent가 잘못된 상태로 진행

올바른 패턴:
try:
    result = execute_tool(name, args)
except Exception as e:
    result = {"error": str(e)}
    state["errors"].append({"step": step, "tool": name, "error": str(e)})

# 에러를 LLM에 알려서 대안을 찾게 한다
context += f"이전 Tool 호출 실패: {e}. 다른 방법을 시도하라."

핵심: 에러를 무시하지 말고 LLM에 전달하면
Agent가 스스로 대안 경로를 탐색할 수 있다.

■ 2. Retry 전략

Tool 호출 실패 시 무조건 재시도하면 비용만 낭비된다.
권장 전략:
- 동일 Tool 최대 2회 재시도
- 2회 실패 시 → 에러 메시지를 LLM에 전달 → 다른 Tool 또는 fallback
- API 타임아웃은 별도 처리 (3초 대기 후 1회 재시도)

■ 3. 로그 포맷

모든 실행은 다음 정보를 기록해야 한다:
{
  "step": 1,
  "timestamp": "2026-03-26T14:32:00",
  "action": "tool_call",
  "tool": "ontology_lookup",
  "args": {"feature": "sleep_hours"},
  "result": {"risk_concept": "chronic_fatigue", ...},
  "duration_ms": 230,
  "error": null
}
이 로그가 있어야:
- 문제 발생 시 어떤 단계에서 잘못되었는지 추적 가능
- 7일차에서 KPI를 산출할 때 이 로그를 기반으로 측정
- 9일차 Trace Log 설계의 기반이 됨

■ 4. 안전 종료 (Graceful Shutdown)

- max_steps 도달: "최대 단계에 도달했습니다" 메시지 + 지금까지의 partial result 반환
- 연속 에러 N회: Agent를 멈추고 상태를 저장한 뒤 사람에게 알림
- 예상치 못한 예외: state를 저장하고 종료 → 다음 실행에서 이어갈 수 있음

오늘 만든 구조는
보험 Agent의 기반이 된다.
7일차에서 이 구조 위에 성공 기준(KPI)을 얹는다.`,
          },
        });
        console.log(`✓ Block 5 updated (실무형 설계 포인트 보충)`);
        break;
      }

      // Block 6: 프레임워크 나열 → 구조적 대응 비교 (문제 6)
      case 6: {
        await prisma.sessionBlock.update({
          where: { id: block.id },
          data: {
            title: "우리가 만든 구조와 프레임워크의 대응 관계",
            description: `[연결] 오늘 만든 skeleton은
실제 Agent 프레임워크와 동일한 구조를 가진다.

■ 구조 대응표

| 우리의 skeleton | OpenAI Agents SDK | LangGraph | CrewAI |
|---|---|---|---|
| A) Input | Runner.run(input) | graph.invoke(input) | crew.kickoff(input) |
| B) Context Builder | instructions + context | State + prompt template | agent.backstory |
| C) LLM Reason | model.create() | LLM node | agent.llm |
| D) Tool Exec | function tools | ToolNode | agent.tools |
| E) State Update | 자동 (conversation) | State dict | memory |
| F) Stop Condition | max_turns | conditional edges | max_iter |

■ 핵심 차이

우리의 skeleton:
- 모든 단계가 명시적 코드로 드러남
- build_context()를 직접 제어
- state를 직접 설계
- 블랙박스 없음

프레임워크:
- 편의 기능이 많지만 내부가 추상화됨
- 맥락 조립이 프레임워크에 위임됨
- 디버깅이 어려울 수 있음

■ 왜 프레임워크를 지금 쓰지 않는가?
구조를 이해하지 못한 채 프레임워크를 쓰면:
- 문제가 생겼을 때 어디를 고쳐야 하는지 모른다
- Context Builder를 커스터마이징할 수 없다
- 보험 도메인의 특수한 요구사항을 반영할 수 없다

오늘 skeleton을 직접 만들었기 때문에
나중에 프레임워크를 쓸 때 "내부에서 무슨 일이 일어나는지" 안다.

확장 학습용 (관심 있는 사람만):
- OpenAI Agents SDK: github.com/openai/openai-agents-python
- LangGraph: langchain-ai.github.io/langgraph
- CrewAI: docs.crewai.com
- AutoGen: microsoft.github.io/autogen`,
          },
        });
        console.log(`✓ Block 6 updated (구조적 대응 비교)`);
        break;
      }

      // Block 7: 마무리 → order 8로 이동
      case 7: {
        await prisma.sessionBlock.update({
          where: { id: block.id },
          data: { order: 8 },
        });
        console.log(`✓ Block 7 moved (order 7→8)`);
        break;
      }

      default:
        console.log(`  Block ${block.order} (${block.title}) — 변경 없음`);
        break;
    }
  }

  // ── 3. 신규 블록 생성: order 7 과제 안내 (문제 7) ──
  await prisma.sessionBlock.create({
    data: {
      sessionId: DAY6_ID,
      order: 7,
      type: "FLOW",
      title: "과제 안내 — Agent Checkpoint 완성 및 제출",
      description: `■ 과제: Checkpoint 5 완성 + 실행 리포트 제출

오늘 세션에서 Checkpoint 5까지 완성하지 못한 경우,
다음 세션 전까지 반드시 완성한다.

제출물:
1) GitHub 커밋 링크
   - agent.py, tools.py, ontology.json, state.json 포함
   - Checkpoint 5까지 동작하는 코드

2) run_report.md (Agent가 자동 생성한 실행 리포트)
   - 포함 내용:
     - 실행 일시
     - 입력 요청
     - 실행 단계 수
     - 호출한 Tool 목록
     - 최종 출력 요약
     - 에러 발생 여부

3) 자기 진단 (간단 텍스트, 5줄 이내)
   - 현재 Agent의 가장 큰 구조적 약점 1가지
   - 7일차에서 어떤 KPI로 이 Agent를 평가할 수 있을지 1가지 제안

제출: GitHub 또는 세션 웹
기한: 다음 세션(7일차) 전까지

■ 왜 이 과제가 중요한가
7일차에서는 오늘 만든 Agent 위에 성공 기준(KPI)을 얹는다.
Agent가 돌아가지 않으면 KPI를 측정할 수 없다.
오늘의 skeleton이 이후 모든 세션의 기반이다.`,
    },
  });
  console.log(`✓ New Block 7 created (과제 안내)`);

  // ── 4. 최종 확인 ──
  const updated = await prisma.session.findUnique({
    where: { id: DAY6_ID },
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
