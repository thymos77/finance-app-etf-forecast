import { describe, expect, it } from 'vitest'
import {
  formatKrw,
  formatKrwShort,
  formatNumber,
  formatPercent,
} from './format'

describe('format', () => {
  it('formatNumber: 천 단위 구분 + 원 단위 반올림', () => {
    expect(formatNumber(1234567.6)).toBe('1,234,568')
    expect(formatNumber(0)).toBe('0')
  })

  it('formatKrw: 원 접미사, 음수는 마이너스', () => {
    expect(formatKrw(2384650.2)).toBe('2,384,650원')
    expect(formatKrw(-1500)).toBe('-1,500원')
  })

  it('formatPercent: 소수점 두 자리', () => {
    expect(formatPercent(8.3864)).toBe('8.39%')
    expect(formatPercent(12)).toBe('12.00%')
    expect(formatPercent(-3.456)).toBe('-3.46%')
  })

  it('반올림하면 0인 음수는 부호 없이 표시한다', () => {
    expect(formatNumber(-0.4)).toBe('0')
    expect(formatKrw(-0.4)).toBe('0원')
    expect(formatPercent(-0.001)).toBe('0.00%')
    expect(formatPercent(-0.006)).toBe('-0.01%')
  })

  it('formatKrwShort: 만/억 축약', () => {
    expect(formatKrwShort(0)).toBe('0원')
    expect(formatKrwShort(5000)).toBe('5,000원')
    expect(formatKrwShort(10_000)).toBe('1만')
    expect(formatKrwShort(1_234_567)).toBe('123.5만')
    expect(formatKrwShort(100_000_000)).toBe('1억')
    expect(formatKrwShort(150_000_000)).toBe('1.5억')
    expect(formatKrwShort(-20_000)).toBe('-2만')
  })
})
