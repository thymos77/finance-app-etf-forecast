import { describe, expect, it } from 'vitest'
import { calculateProjection } from './calculate'

describe('calculateProjection', () => {
  it('12% 연 수익률, 초기 100만원, 월 10만원, 12개월', () => {
    const result = calculateProjection({
      initial: 1_000_000,
      monthly: 100_000,
      months: 12,
      annualRate: 0.12,
    })
    expect(Math.round(result.finalAmount)).toBe(2_384_650)
    expect(result.principal).toBe(2_200_000)
    expect(result.profit).toBeCloseTo(result.finalAmount - 2_200_000, 6)
    expect(result.profitRate.toFixed(2)).toBe('8.39')
  })

  it('음수 수익률', () => {
    const result = calculateProjection({
      initial: 0,
      monthly: 100_000,
      months: 36,
      annualRate: -0.1,
    })
    expect(Math.round(result.finalAmount)).toBe(3_100_115)
    expect(result.principal).toBe(3_600_000)
    expect(result.profit).toBeLessThan(0)
  })

  it('수익률 0%는 NaN/Infinity 없이 원금과 같다', () => {
    const result = calculateProjection({
      initial: 0,
      monthly: 100_000,
      months: 36,
      annualRate: 0,
    })
    expect(result.finalAmount).toBe(3_600_000)
    expect(result.principal).toBe(3_600_000)
    expect(result.profit).toBe(0)
    expect(Object.values(result).every(Number.isFinite)).toBe(true)
  })
})
