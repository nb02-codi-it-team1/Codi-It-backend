/**
 * 판매 금액 또는 건수의 증감률 계산
 * @param current 현재 기간의 값(금액 또는 건수)
 * @param previous 이전 기간의 값(금액 또는 건수)
 * @returns {number} 백분율로 반환
 */
export const calculateChangeRate = (current: number, previous: number): number => {
  // 이전 값이 0인 경우
  if (previous === 0) {
    // 현재 값이 0보다 크다면 100% 증가, 현재 값도 0이라면 증감률 0%
    return current > 0 ? 100 : 0;
  }

  // 증감률 공식: (현재값- 이전 값) / 이전 값 * 100
  const rate = ((current - previous) / previous) * 100;

  // 소수점 셋째 자리에서 반올림, 둘째 자리까지 표시
  return Math.round(rate * 100) / 100;
};
