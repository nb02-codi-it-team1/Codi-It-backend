/**
 * 날짜의 시/분/초/밀리초 모두 0으로 설정
 * 하루의 시작(자정)을 반환
 */
const resetTime = (date: Date): Date => {
  date.setHours(0, 0, 0, 0);
  return date;
};

// --- 현재 기간의 시작일 ---

/**
 * 오늘 날짜의 시작 시간(자정)을 반환
 */
export const getStartOfToday = (): Date => {
  return resetTime(new Date());
};

/**
 * 이번 주의 시작일(월요일 0시 0분 0초)을 반환
 */
export const getStartOfWeek = (now = new Date()): Date => {
  const day = now.getDay(); // 0(일요일) ~ 6(토요일)
  const diff = day === 0 ? 6 : day - 1; // 월요일(1)이 기준이 되도록 일요일(0)을 6으로 처리
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - diff);
  return resetTime(startOfWeek);
};

/**
 * 이번 달의 시작일(1일 0시 0분 0초)을 반환
 */
export const getStartOfMonth = (now = new Date()): Date => {
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  return resetTime(startOfMonth);
};

/**
 * 올해의 시작일(1월 1일 0시 0분 0초)을 반환
 */
export const getStartOfYear = (now = new Date()): Date => {
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  return resetTime(startOfYear);
};

// --- 다음 기간의 시작일 (종료 경계) ---

/**
 * 다음 날짜의 시작일(내일 0시 0분 0초)을 반환
 */
export const getStartOfNextDay = (now = new Date()): Date => {
  const next = new Date(now);
  next.setDate(now.getDate() + 1);
  return resetTime(next);
};

/**
 * 다음 주의 시작일(다음 주 월요일 0시 0분 0초)을 반환
 */
export const getStartOfNextWeek = (now = new Date()): Date => {
  const nextWeek = new Date(now);
  // 현재 날짜에 7일을 더한 후, 그 날짜를 기준으로 다음 주 월요일을 다시 계산함
  nextWeek.setDate(now.getDate() + 7);
  return getStartOfWeek(nextWeek);
};

/**
 * 다음 달의 시작일(다음 달 1일 0시 0분 0초)을 반환
 */
export const getStartOfNextMonth = (now = new Date()): Date => {
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  return resetTime(nextMonth);
};

/**
 * 다음 해의 시작일(다음 해 1월 1일 0시 0분 0초)을 반환
 */
export const getStartOfNextYear = (now = new Date()): Date => {
  const nextYear = new Date(now.getFullYear() + 1, 0, 1);
  return resetTime(nextYear);
};

// --- 이전 기간의 시작일 (증감률 계산)---

/**
 * 주어진 기간의 시작일(startdate)을 기준으로 '이전 기간'의 시작일을 반환.
 * @param duration 계산 기간 단위('day', 'week', 'month', 'year')
 */
export const getStartOfPreviousPeriod = (
  startDate: Date,
  duration: 'day' | 'week' | 'month' | 'year'
): Date => {
  const previousStart = new Date(startDate);

  switch (duration) {
    case 'day':
      previousStart.setDate(startDate.getDate() - 1);
      break;
    case 'week':
      previousStart.setDate(startDate.getDate() - 7);
      break;
    case 'month':
      previousStart.setMonth(startDate.getMonth() - 1);
      break;
    case 'year':
      previousStart.setFullYear(startDate.getFullYear() - 1);
      break;
  }
  return resetTime(previousStart);
};
