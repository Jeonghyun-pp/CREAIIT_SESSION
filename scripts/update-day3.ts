import path from "node:path";
import { config } from "dotenv";
config({ path: path.join(__dirname, "..", ".env.local") });

import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL! });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const DAY3_ID = "cmm5viulk000fn4ul166hw0t7";

async function main() {
  const day3 = await prisma.session.findUnique({
    where: { id: DAY3_ID },
    include: { blocks: { orderBy: { order: "asc" } } },
  });

  if (!day3) {
    console.error("Day 3 session not found!");
    process.exit(1);
  }

  console.log(`Found Day 3: ${day3.id} - ${day3.title}`);
  console.log(`Blocks: ${day3.blocks.length}`);

  // 1. Update session-level: GPT → LLM 통일, Brain 비유 단서
  await prisma.session.update({
    where: { id: day3.id },
    data: {
      summary: `LLM을 사용하는 사용자가 아니라,
LLM을 시스템 안에 통합하는 설계자가 된다.
LLM을 "판단(Brain)"으로,
Tool을 "행동(Hands)"으로 분리하여
최소 단위의 Agent 구조를 구현한다.
(Brain은 비유다 — LLM은 실제로 사고하지 않으며, 적절한 맥락이 주어지면 판단처럼 보이는 출력을 생성한다.)`,
      goals: [
        "AI 웹 서비스와 LLM API의 구조적 차이",
        "API 호출 구조 — HTTP 요청/응답, JSON, messages 배열",
        "Tool Calling의 본질과 JSON Schema 기반 Tool 정의",
        "Agent Loop — 종료 조건과 에러 처리 포함",
        "Brain–Hands 분리를 적용한 실제 구현",
      ],
    },
  });
  console.log("✓ Session metadata updated");

  // 2. Update blocks
  for (const block of day3.blocks) {
    let newDescription: string | undefined;
    let newTitle: string | undefined;

    switch (block.order) {
      case 0: // GPT를 '사용'에서 '설계'로 → LLM 통일
        newTitle = "LLM을 '사용'에서 '설계'로 전환하기";
        newDescription = `질문:
"ChatGPT를 쓰는 것과 LLM API를 쓰는 것의 차이는?"

ChatGPT, Claude 웹은 사람이 직접 사용하는 인터페이스다.
LLM API는 코드에서 모델을 호출하는 방식이다.
ChatGPT는 API 위에 얹힌 하나의 UI일 뿐이다.

Day 2에서는 Claude Code로 AI와 대화하며 웹을 만들었다.
오늘부터는 다르다.
LLM을 코드 안에서 직접 호출하고, 제어하는 법을 배운다.`;
        break;

      case 1: // API와 LLM 호출 구조 이해 → HTTP/JSON/messages 기초 추가
        newDescription = `[연결] LLM을 시스템 안에 넣는다는 것은
API를 이해한다는 뜻이다.

■ API란 무엇인가?
서로 다른 소프트웨어가 대화하기 위한 규칙이다.
남의 서버 기능을 빌려 쓰는 방식이다.
현대 서비스는 API의 조합으로 구성된다.
UI → API → 기능 동작

■ HTTP 요청/응답 기본 구조
- 요청(Request): URL + Method(POST) + Headers + Body
- 응답(Response): Status Code(200/400/500) + Body(JSON)
- LLM API도 이 구조를 따른다

■ LLM API의 메시지 구조
messages 배열로 대화를 구성한다:
- system: AI의 역할/지침 설정
- user: 사용자 입력
- assistant: AI 응답
예시:
messages = [
  {"role": "system", "content": "너는 학회 운영 도우미다"},
  {"role": "user", "content": "다음 주 세션 공지 작성해줘"}
]

■ 단일 호출의 한계
Input → LLM Server → Output
- 외부 실행 ❌ (파일 생성, 웹 검색 불가)
- DB 접근 ❌ (데이터 조회/저장 불가)
- 상태 유지 ❌ (이전 결과 기억 불가)
LLM은 텍스트를 생성하지만 행동은 못 한다.

예: "오늘 날씨 알려줘" → LLM은 실제 날씨 API를 호출할 수 없다.
예: "DB에서 회원 목록 조회해줘" → LLM은 DB에 접근할 수 없다.
이런 한계를 해결하는 것이 Tool과 Agent Loop다.`;
        break;

      case 2: // Tool과 Agent의 개념 → Brain 비유 단서 + JSON Schema + 종료 조건 + 에러 처리
        newDescription = `[연결] 행동이 없다면,
AI는 시스템이 될 수 없다.

■ Brain–Hands 비유
LLM = Brain (판단)
Tool = Hands (실행)
※ "Brain"은 비유다. LLM은 실제로 사고하지 않는다.
적절한 맥락이 주어지면 판단처럼 보이는 출력을 생성할 뿐이다.
이 비유는 역할 분리를 이해하기 위한 것이다.

■ Tool Calling이란?
일반 함수 호출과 다르다.
개발자가 결정하는 것이 아니라,
LLM이 상황에 따라 호출 여부를 판단한다.

■ Tool 정의 — JSON Schema
LLM에게 "이런 도구가 있다"고 알려주는 형식:
{
  "type": "function",
  "function": {
    "name": "check_required_fields",
    "description": "공지에 필수 항목이 포함됐는지 검증",
    "parameters": {
      "type": "object",
      "properties": {
        "title": { "type": "string", "description": "공지 제목" },
        "date": { "type": "string", "description": "일정 날짜" }
      },
      "required": ["title", "date"]
    }
  }
}
- name: 도구 이름 (LLM이 호출 시 사용)
- description: 도구 설명 (LLM이 언제 쓸지 판단하는 핵심)
- parameters: 입력 스키마 (type, properties, required)
description이 명확할수록 LLM이 올바른 Tool을 선택한다.

■ Primitive Agent 구조
User → LLM 판단 → Tool 요청 → 코드 실행 → 결과 반환 → LLM 최종 응답
Brain → Hands → Brain 루프
이것이 최소 단위의 Agent다.

■ Agent Loop 종료 조건
루프는 언제 멈추는가?
1. 목표 달성: LLM이 "완료"로 판단 (Tool 호출 없이 최종 응답)
2. 최대 반복 횟수: 무한 루프 방지 (예: max_steps=10)
3. 타임아웃: 시간 초과 시 강제 종료
4. 에러 임계값: 연속 실패 N회 시 중단
Day 6에서 이 종료 조건을 직접 구현한다.

■ 에러 처리 기본
- API 호출 실패: 재시도 (최대 3회) 또는 기본값 반환
- Tool 실행 실패: 에러 메시지를 LLM에 전달 → LLM이 다른 접근법 시도
- JSON 파싱 실패: LLM 응답이 형식에 맞지 않을 때 재요청
에러를 무시하면 Agent는 잘못된 상태로 계속 진행한다.
에러를 LLM에 전달하면 Agent가 스스로 수정할 기회를 갖는다.`;
        break;

      case 3: // 실습 — LLM API로 통일 + 보험 브릿지
        newTitle = "실습 — 학회 공지 자동 작성기 구현";
        newDescription = `[연결] 이제 이 구조를 직접 구현한다.

이번 실습의 목적은 공지를 만드는 것이 아니라,
Agent 구조를 완성하는 것이다.

Step 1. 환경 설정
API Key는 코드에 직접 두지 않는다.
.env 파일을 만들고 환경변수로 로딩한다.
이것은 실행 환경과 코드의 분리를 의미한다.

Step 2. LLM 클라이언트 생성
서버에 있는 LLM과 통신하기 위한 인터페이스를 만든다.
LLM은 로컬에 존재하지 않는다. API로 호출한다.

Step 3. 단일 API 호출
messages 배열을 구성하여 초안을 생성한다.
이 단계에서는 단순 텍스트 생성만 이루어진다.
행동은 없다.

Step 4. Tool 함수 정의
check_required_fields()는 규칙 기반 검증 코드다.
확률 모델이 아닌 코드로 안정성을 확보한다.

Step 5. JSON Schema로 Tool 등록
LLM이 이 함수를 사용할 수 있도록 JSON Schema를 정의한다.
name, description, parameters를 명확히 작성한다.

Step 6. Tool Calling 실행
tools=TOOLS, instructions="먼저 툴로 확인해."
이 두 조건이 있어야 Tool Calling이 발생한다.
LLM은 실행하지 않는다. function_call 요청만 생성한다.
코드가 요청을 포착하여 실제 실행한다.

Step 7. 결과 피드백
실행 결과를 다시 LLM에 전달한다.
이 연결이 Agent Loop의 핵심이다.
Brain → Hands → Brain.

Step 8. 최종 출력
Tool 검수를 반영한 완성 공지가 생성된다.
파일로 저장한다 — 자동화는 물리적 결과로 남아야 한다.

■ 보험 도메인 연결
이 구조는 보험 Agent에도 동일하게 적용된다.
- "학회 공지 작성기"의 check_required_fields → 보험에서는 ontology_lookup, hazard_check
- messages의 system 프롬프트 → 보험 도메인 맥락으로 교체
- 구조는 같고, 맥락만 다르다.
Day 4에서 이 맥락 교체가 왜 중요한지를 다룬다.`;
        break;

      case 4: // 오늘의 진짜 의미 → LLM 통일
        newDescription = `LLM은 텍스트 생성기가 아니다.
API로 연결되고,
Tool로 행동하며,
Loop로 구조화되는
설계된 시스템이다.

오늘 우리는 LLM을 쓰는 사람이 아니라,
LLM을 설계하는 사람이 되기 시작했다.

(단, LLM은 비유적 "Brain"이지 실제 사고가 아니다.
적절한 맥락 위에서 판단처럼 보이는 출력을 만들 뿐이다.
이 한계를 이해하는 것이 좋은 Agent 설계의 출발점이다.)`;
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

  console.log("\nDay 3 update complete!");
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
