"""
❌ 나쁜 Agent — 맥락 없는 단순 프롬프트
동일 입력에 대해 good_agent.py와 비교하기 위한 코드
"""

from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

client = OpenAI()


def run_bad_agent():
    """맥락 없이 LLM에 직접 질문하는 나쁜 Agent"""

    prompt = """
보험 상품 개선을 위해 추가할 수 있는 피쳐를 제안해줘.
현재 데이터는 나이, 성별, 직업이야.
"""

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "user", "content": prompt}
        ],
        temperature=0.7,
    )

    return response.choices[0].message.content


if __name__ == "__main__":
    print("=" * 60)
    print("❌ 나쁜 Agent 실행 결과")
    print("=" * 60)
    print()

    result = run_bad_agent()
    print(result)

    print()
    print("=" * 60)
    print("문제점:")
    print("  - 목표 불명확 (어떤 보험? 어떤 개선?)")
    print("  - 리스크 정의 없음")
    print("  - 계리 연결 기준 없음")
    print("  - 평가 기준 없음")
    print("=" * 60)
