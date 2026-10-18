import { describe, expect, it } from 'vitest'
import { calculateProjection } from './calculate'
import { projectSeries } from './projectSeries'

const input = {
  initial: 1_000_000,
  monthly: 100_000,
  months: 12,
  annualRate: 0.12,
}

describe('projectSeries', () => {
  it('n+1개 점, 0번째는 초기 자본', () => {
    const series = projectSeries(input)
    expect(series).toHaveLength(13)
    expect(series[0]).toEqual({
      month: 0,
      principal: 1_000_000,
      value: 1_000_000,
    })
    expect(series[12].principal).toBe(2_200_000)
  })

  it('마지막 값은 calculateProjection의 최종 금액과 같다', () => {
    const series = projectSeries(input)
    expect(
      Math.abs(series[12].value - calculateProjection(input).finalAmount),
    ).toBeLessThan(1e-6)
  })

  it('r=0이면 값이 원금과 같다', () => {
    const series = projectSeries({ ...input, annualRate: 0 })
    for (const point of series) expect(point.value).toBe(point.principal)
  })
})
