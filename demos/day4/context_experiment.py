"""
🔬 Block 7 실습: Context 4요소 단계적 on/off 실험
4단계로 요소를 하나씩 켜면서 결과 변화를 관찰한다.
"""

import json
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

client = OpenAI()

# ──────────────────────────────────────────
# 도메인 데이터 (모든 실험에서 동일한 원본)
# ──────────────────────────────────────────

RAW_INPUT = """보험 상품 개선을 위해 추가할 수 있는 피쳐를 제안해줘.
현재 데이터는 나이, 성별, 직업이야.
과거 클레임 이력: 총 15,000건, 평균 청구액 320만원.
고객 수: 50,000명. 평균 연령: 42세.
상품 유형: 종합보험 (사망+질병+상해).
지역 분포: 서울 35%, 경기 25%, 기타 40%.
마케팅 채널: 온라인 40%, 설계사 45%, 방카슈랑스 15%.
해약률: 연 12%. 손해율: 68%.
민원 건수: 월 평균 230건. 불완전판매 비율: 3.2%.
경쟁사 동향: A사 건강검진 연동, B사 IoT 디바이스 할인."""

DOMAIN_KNOWLEDGE = {
    "goal": "Mortality 기반 세그먼트 확장",
    "current_variables": ["age", "gender", "occupation"],
    "risk_definition": "hazard rate 조정 가능성",
    "mortality_basis": "경험생명표 기반",
    "constraint": "실제 수집 가능 데이터",
    "evaluation_metric": "계리 연결 가능성 — Cox PH 모델 공변량 편입 가능 여부",
}


def run_experiment(stage: int) -> str:
    """
    stage 1: Baseline (4요소 모두 OFF)
    stage 2: Selection만 ON
    stage 3: Selection + Compression + Framing ON
    stage 4: 4요소 모두 ON (Iteration 포함)
    """

    if stage == 1:
        # ── Baseline: Raw input 그대로 ──
        messages = [
            {"role": "user", "content": RAW_INPUT}
        ]
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=messages,
            temperature=0.5,
        )
        return response.choices[0].message.content

    elif stage == 2:
        # ── Selection ON: 관련 데이터만 선택 ──
        selected_input = f"""보험 상품의 리스크 세그먼트 개선을 위한 새 변수를 제안해줘.

현재 사용 변수: 나이, 성별, 직업 (3개)
고객 수: 50,000명
상품 유형: 종합보험 (사망+질병+상해)
손해율: 68%

※ 마케팅 채널, 민원 건수, 경쟁사 정보는 의도적으로 제외함
   (리스크 세그먼트와 직접 관련 없는 정보)"""

        messages = [
            {"role": "user", "content": selected_input}
        ]
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=messages,
            temperature=0.5,
        )
        return response.choices[0].message.content

    elif stage == 3:
        # ── Selection + Compression + Framing ON ──
        compressed_context = json.dumps({
            "goal": DOMAIN_KNOWLEDGE["goal"],
            "current_variables": DOMAIN_KNOWLEDGE["current_variables"],
            "risk_definition": DOMAIN_KNOWLEDGE["risk_definition"],
            "evaluation_metric": DOMAIN_KNOWLEDGE["evaluation_metric"],
            "constraint": DOMAIN_KNOWLEDGE["constraint"],
        }, ensure_ascii=False, indent=2)

        # Framing: 해석 관점 명시
        system_prompt = """너는 보험 계리 분석 전문가다.
제안하는 모든 변수는 반드시 hazard rate h(t|X)와의 관계를 명시해야 한다.
"그럴듯한" 제안이 아니라 "계리적으로 연결 가능한" 제안만 한다.
각 변수에 대해: (1) 변수명 (2) hazard rate 영향 방향 (3) 계리 연결 경로를 포함한다."""

        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": f"맥락:\n{compressed_context}\n\n새 변수를 제안해줘."},
        ]
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=messages,
            temperature=0.3,
        )
        return response.choices[0].message.content

    elif stage == 4:
        # ── 4요소 모두 ON (Iteration 추가) ──
        compressed_context = json.dumps({
            "goal": DOMAIN_KNOWLEDGE["goal"],
            "current_variables": DOMAIN_KNOWLEDGE["current_variables"],
            "risk_definition": DOMAIN_KNOWLEDGE["risk_definition"],
            "evaluation_metric": DOMAIN_KNOWLEDGE["evaluation_metric"],
            "constraint": DOMAIN_KNOWLEDGE["constraint"],
        }, ensure_ascii=False, indent=2)

        system_prompt = """너는 보험 계리 분석 전문가다.
제안하는 모든 변수는 반드시 hazard rate h(t|X)와의 관계를 명시해야 한다.
"그럴듯한" 제안이 아니라 "계리적으로 연결 가능한" 제안만 한다.
각 변수에 대해: (1) 변수명 (2) hazard rate 영향 방향 (3) 계리 연결 경로를 포함한다."""

        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": f"맥락:\n{compressed_context}\n\n새 변수를 제안해줘."},
        ]

        # 1차 호출
        response1 = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=messages,
            temperature=0.3,
        )
        first_result = response1.choices[0].message.content

        # Iteration: 자기 검증
        messages.append({"role": "assistant", "content": first_result})
        messages.append({
            "role": "user",
            "content": """자기 검증:
1. 각 변수가 정말 hazard rate 조정에 유의미한가?
2. Cox PH 모델에 편입 가능한 경로가 명확한가?
3. 한국 보험시장에서 실제 수집 가능한가?
부족하면 수정하고 최종 제안을 정리한다."""
        })

        response2 = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=messages,
            temperature=0.3,
        )

        return f"── 1차 응답 ──\n{first_result}\n\n── Iteration 후 (자기 검증) ──\n{response2.choices[0].message.content}"

    return ""


STAGE_LABELS = {
    1: ("Baseline — 4요소 모두 OFF", {
        "Selection": "❌", "Compression": "❌", "Framing": "❌", "Iteration": "❌"
    }),
    2: ("Selection만 ON", {
        "Selection": "✅", "Compression": "❌", "Framing": "❌", "Iteration": "❌"
    }),
    3: ("Selection + Compression + Framing ON", {
        "Selection": "✅", "Compression": "✅", "Framing": "✅", "Iteration": "❌"
    }),
    4: ("4요소 모두 ON", {
        "Selection": "✅", "Compression": "✅", "Framing": "✅", "Iteration": "✅"
    }),
}


def main():
    print()
    print("=" * 70)
    print("  Block 7 실습: Context 4요소 단계적 실험")
    print("  동일 LLM (gpt-4o-mini), 동일 주제, 맥락만 단계적 추가")
    print("=" * 70)

    results = {}

    for stage in range(1, 5):
        label, flags = STAGE_LABELS[stage]
        flag_str = " | ".join(f"{k}:{v}" for k, v in flags.items())

        print(f"\n{'─' * 70}")
        print(f"  실험 {stage}: {label}")
        print(f"  [{flag_str}]")
        print(f"{'─' * 70}")

        print(f"\n⏳ 실행 중...")
        result = run_experiment(stage)
        results[stage] = result

        print(result)

        if stage < 4:
            print(f"\n💡 관찰 포인트:")
            if stage == 1:
                print("  → 불필요한 정보(마케팅, 민원)가 결과에 영향을 미쳤는가?")
                print("  → 제안이 보험 실무에 사용 가능한 수준인가?")
            elif stage == 2:
                print("  → 불필요 정보 제거 후 관련성이 높아졌는가?")
                print("  → 하지만 해석 기준이 없어서 방향성이 모호하지 않은가?")
            elif stage == 3:
                print("  → Framing(계리 관점) 추가 후 도메인 적합성이 높아졌는가?")
                print("  → 아직 자기 수정(Iteration)이 없다면 어떤 한계가 있는가?")

            input("\n  [Enter를 눌러 다음 실험으로 →]")

    # ── 전체 비교 요약 ──
    print(f"\n{'=' * 70}")
    print("  전체 비교 요약")
    print(f"{'=' * 70}")
    print("""
  ┌──────────────────────────────────────────────────────────┐
  │ 실험 │ Selection │ Compression │ Framing │ Iteration │
  ├──────────────────────────────────────────────────────────┤
  │  1   │    ❌     │     ❌      │   ❌    │    ❌     │
  │  2   │    ✅     │     ❌      │   ❌    │    ❌     │
  │  3   │    ✅     │     ✅      │   ✅    │    ❌     │
  │  4   │    ✅     │     ✅      │   ✅    │    ✅     │
  └──────────────────────────────────────────────────────────┘

  비교 기준:
  1. 판단 일관성 — 실험 4가 가장 안정적인가?
  2. 도메인 적합성 — 어느 단계부터 계리 용어가 등장하는가?
  3. 오류 유형 — 환각이 줄어드는 시점은?
  4. 해석 안정성 — Framing 추가 후 관점이 고정되는가?

  결론:
  LLM은 동일하다. 맥락을 하나씩 추가할 때마다 결과가 달라진다.
  Agent의 품질 = 맥락 설계의 품질.
""")


if __name__ == "__main__":
    main()
