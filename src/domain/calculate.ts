export interface ProjectionInput {
  initial: number
  monthly: number
  months: number
  /** 연 수익률(소수). 예: 12% → 0.12 */
  annualRate: number
}

export interface Projection {
  principal: number
  finalAmount: number
  profit: number
  /** 퍼센트 단위. 예: 8.39 */
  profitRate: number
}

/** 연 수익률(소수)을 월 수익률로 기하 환산한다. */
export const monthlyRate = (annualRate: number) =>
  (1 + annualRate) ** (1 / 12) - 1

/** 매월 말 납입 기준 `months`개월 후 평가금액. */
export function futureValue(
  initial: number,
  monthly: number,
  months: number,
  r: number,
): number {
  if (r === 0) return initial + monthly * months
  const growth = (1 + r) ** months
  return initial * growth + (monthly * (growth - 1)) / r
}

export function calculateProjection({
  initial,
  monthly,
  months,
  annualRate,
}: ProjectionInput): Projection {
  const finalAmount = futureValue(
    initial,
    monthly,
    months,
    monthlyRate(annualRate),
  )
  const principal = initial + monthly * months
  const profit = finalAmount - principal
  return {
    principal,
    finalAmount,
    profit,
    profitRate: (profit / principal) * 100,
  }
}
