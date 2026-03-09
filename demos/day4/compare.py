"""
🔀 나쁜 Agent vs 좋은 Agent — 나란히 비교 실행
세션 중 라이브 데모용 스크립트
"""

from bad_agent import run_bad_agent
from good_agent import run_good_agent


def print_section(title: str, content: str, width: int = 70):
    print()
    print(f"┌{'─' * (width - 2)}┐")
    print(f"│ {title:<{width - 4}} │")
    print(f"├{'─' * (width - 2)}┤")
    for line in content.split("\n"):
        # 긴 줄은 자르기
        while len(line) > width - 4:
            print(f"│ {line[:width - 4]} │")
            line = line[width - 4:]
        print(f"│ {line:<{width - 4}} │")
    print(f"└{'─' * (width - 2)}┘")


def main():
    print()
    print("=" * 70)
    print("  4일차 라이브 데모: 동일 입력, 다른 맥락 — 결과 비교")
    print("  입력: '보험 상품 개선을 위해 추가할 수 있는 피쳐를 제안해줘'")
    print("  LLM: 동일 (gpt-4o-mini)")
    print("=" * 70)

    # ── 나쁜 Agent 실행 ──
    print("\n⏳ 나쁜 Agent 실행 중...")
    bad_result = run_bad_agent()

    # ── 좋은 Agent 실행 ──
    print("⏳ 좋은 Agent 실행 중...")
    good_first, good_final = run_good_agent()

    # ── 결과 비교 ──
    print_section("❌ 나쁜 Agent — 맥락 없음", bad_result)
    print_section("✅ 좋은 Agent — 1차 (Context 4요소 적용)", good_first)
    print_section("✅ 좋은 Agent — 2차 (Iteration: 자기 검증)", good_final)

    # ── 비교 분석 ──
    print()
    print("=" * 70)
    print("  비교 분석 — 토론 가이드")
    print("=" * 70)
    print("""
  1. 도메인 적합성
     - 나쁜 Agent: 일반적 제안 (건강, 소득, 라이프스타일...)
     - 좋은 Agent: 계리 연결 가능한 구체적 변수

  2. 실무 사용 가능성
     - 나쁜 Agent의 출력을 계리사에게 보여줄 수 있는가?
     - 좋은 Agent의 출력은 어떤가?

  3. 핵심 질문
     - LLM이 달라졌는가? → 아니다. 동일한 gpt-4o-mini.
     - 무엇이 달라졌는가? → 맥락.
     - 나쁜 Agent를 "프롬프트만 고쳐서" 개선할 수 있는가?
       → 구조(Context Builder)를 바꿔야 한다.

  4. Context 4요소 확인
     ┌─────────────┬──────────┬──────────┐
     │ 요소         │ 나쁜     │ 좋은     │
     ├─────────────┼──────────┼──────────┤
     │ Selection   │ ❌ 없음  │ ✅ 적용  │
     │ Compression │ ❌ 없음  │ ✅ 적용  │
     │ Framing     │ ❌ 없음  │ ✅ 적용  │
     │ Iteration   │ ❌ 없음  │ ✅ 적용  │
     └─────────────┴──────────┴──────────┘
""")
    print("=" * 70)
    print("  Agent의 품질 = 맥락 설계의 품질")
    print("=" * 70)


if __name__ == "__main__":
    main()
