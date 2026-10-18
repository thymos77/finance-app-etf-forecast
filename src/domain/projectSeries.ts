import { futureValue, monthlyRate, type ProjectionInput } from './calculate'

export interface SeriesPoint {
  month: number
  principal: number
  value: number
}

/** 0개월부터 `months`개월까지 매월 말 기준 원금과 평가금액 (months + 1개 점). */
export function projectSeries({
  initial,
  monthly,
  months,
  annualRate,
}: ProjectionInput): SeriesPoint[] {
  const r = monthlyRate(annualRate)
  return Array.from({ length: months + 1 }, (_, month) => ({
    month,
    principal: initial + monthly * month,
    value: futureValue(initial, monthly, month, r),
  }))
}
