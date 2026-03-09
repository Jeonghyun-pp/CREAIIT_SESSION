"""
✅ 좋은 Agent — Context 4요소가 설계된 Agent
동일 입력에 대해 bad_agent.py와 비교하기 위한 코드
"""

import json
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

client = OpenAI()

# ──────────────────────────────────────────
# Context Builder — Agent의 핵심
# ──────────────────────────────────────────

DOMAIN_CONTEXT = {
    "goal": "Mortality 기반 세그먼트 확장: 기존 3변수(나이/성별/직업) 외에 hazard rate 조정에 유의미한 새 변수를 발견한다.",
    "current_variables": ["age", "gender", "occupation"],
    "risk_definition": "hazard rate — 현재 생존한 피보험자가 다음 단위 시간에 사망/사고를 겪을 순간 확률",
    "mortality_basis": "경험생명표 기반, 5세 단위 연령 그룹",
    "constraint": "실제 수집 가능한 데이터만 제안할 것. 유전자 검사 등 윤리적/규제적 제약이 있는 데이터는 명시적으로 표시할 것.",
    "evaluation_metric": "계리 연결 가능성 — 제안된 변수가 hazard rate 함수 h(t|X)의 공변량으로 통계적으로 유의미하게 편입 가능한가?",
    "output_format": "각 변수에 대해: (1) 변수명, (2) 수집 방법, (3) hazard rate 영향 방향(증가/감소), (4) 계리 연결 경로를 포함할 것",
}


def build_context(user_input: str) -> list[dict]:
    """Context 4요소를 적용하여 메시지를 구성한다."""

    # Selection: 필요한 도메인 맥락만 선택
    selected_context = {
        "goal": DOMAIN_CONTEXT["goal"],
        "current_variables": DOMAIN_CONTEXT["current_variables"],
        "risk_definition": DOMAIN_CONTEXT["risk_definition"],
        "mortality_basis": DOMAIN_CONTEXT["mortality_basis"],
        "constraint": DOMAIN_CONTEXT["constraint"],
        "evaluation_metric": DOMAIN_CONTEXT["evaluation_metric"],
        "output_format": DOMAIN_CONTEXT["output_format"],
    }

    # Compression: 구조화된 형태로 압축
    context_text = json.dumps(selected_context, ensure_ascii=False, indent=2)

    # Framing: 해석 관점 명시
    system_prompt = """너는 보험 계리 분석 전문가다.
새로운 변수를 제안할 때 반드시 다음 관점에서 판단한다:
1. 해당 변수가 hazard rate h(t|X)에 통계적으로 유의미한 영향을 미치는가?
2. Cox Proportional Hazards Model의 공변량으로 편입 가능한가?
3. 실제 보험사에서 수집 가능한 데이터인가?
4. 규제(금감원, 개인정보보호법)를 준수하는가?

"그럴듯한" 제안이 아니라 "계리적으로 연결 가능한" 제안만 한다.
반드시 지정된 출력 형식을 따른다."""

    return [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": f"도메인 맥락:\n{context_text}\n\n요청: {user_input}"},
    ]


def run_good_agent():
    """Context 4요소가 설계된 좋은 Agent"""

    user_input = "보험 상품 개선을 위해 추가할 수 있는 피쳐를 제안해줘. 현재 데이터는 나이, 성별, 직업이야."

    # Step 1: Context Builder로 맥락 조립
    messages = build_context(user_input)

    # Step 2: LLM 호출 (1차)
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=messages,
        temperature=0.3,  # 낮은 temperature로 일관성 확보
    )

    first_result = response.choices[0].message.content

    # Step 3: Iteration — 1차 결과를 자기 검증
    messages.append({"role": "assistant", "content": first_result})
    messages.append({
        "role": "user",
        "content": """위 제안을 자기 검증한다:
1. 각 변수가 정말 hazard rate 조정에 유의미한가?
2. 계리 모델(Cox PH)에 편입 가능한 경로가 명확한가?
3. 수집 가능성이 현실적인가?
부족한 부분이 있으면 수정하고, 최종 제안을 다시 정리한다."""
    })

    response2 = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=messages,
        temperature=0.3,
    )

    return first_result, response2.choices[0].message.content


if __name__ == "__main__":
    print("=" * 60)
    print("✅ 좋은 Agent 실행 결과")
    print("=" * 60)
    print()

    first, final = run_good_agent()

    print("── 1차 응답 (Context 적용) ──")
    print(first)
    print()
    print("── 2차 응답 (Iteration: 자기 검증 후) ──")
    print(final)

    print()
    print("=" * 60)
    print("핵심 차이:")
    print("  - 목표 명확 (Mortality 기반 세그먼트 확장)")
    print("  - 해석 기준 (hazard rate 조정 가능성)")
    print("  - 평가 지표 (계리 연결 가능성)")
    print("  - 자기 검증 (Iteration)")
    print("=" * 60)
