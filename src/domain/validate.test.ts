import { describe, expect, it } from 'vitest'
import { validate, type ValidateInput } from './validate'

const valid: ValidateInput = { months: 12, monthly: 100_000, initial: 0 }
const check = (patch: Partial<ValidateInput>) =>
  validate({ ...valid, ...patch })

describe('validate', () => {
  it('유효한 입력(초기 자본 0 포함)은 오류가 없다', () => {
    expect(validate(valid)).toEqual({})
  })

  it('months', () => {
    expect(check({ months: 0 }).months).toBe('MONTHS_MIN')
    expect(check({ months: -3 }).months).toBe('MONTHS_MIN')
    expect(check({ months: 1.5 }).months).toBe('MONTHS_MIN')
    expect(check({ months: 1 })).toEqual({})
    expect(check({ months: 600 })).toEqual({})
    expect(check({ months: 601 }).months).toBe('OUT_OF_RANGE')
    expect(check({ months: NaN }).months).toBe('NOT_A_NUMBER')
  })

  it('monthly', () => {
    expect(check({ monthly: 0 }).monthly).toBe('MONTHLY_POSITIVE')
    expect(check({ monthly: -1 }).monthly).toBe('MONTHLY_POSITIVE')
    expect(check({ monthly: 100_000_000_000 })).toEqual({})
    expect(check({ monthly: 100_000_000_001 }).monthly).toBe('OUT_OF_RANGE')
    expect(check({ monthly: NaN }).monthly).toBe('NOT_A_NUMBER')
  })

  it('initial', () => {
    expect(check({ initial: -1 }).initial).toBe('INITIAL_NONNEGATIVE')
    expect(check({ initial: 100_000_000_000 })).toEqual({})
    expect(check({ initial: 100_000_000_001 }).initial).toBe('OUT_OF_RANGE')
    expect(check({ initial: NaN }).initial).toBe('NOT_A_NUMBER')
  })

  it('customRate: -99~100 범위, 생략하면 검사하지 않는다', () => {
    expect(check({ customRate: undefined })).toEqual({})
    expect(check({ customRate: -99 })).toEqual({})
    expect(check({ customRate: 100 })).toEqual({})
    expect(check({ customRate: 0 })).toEqual({})
    expect(check({ customRate: -99.1 }).customRate).toBe('RATE_OUT_OF_RANGE')
    expect(check({ customRate: 100.1 }).customRate).toBe('RATE_OUT_OF_RANGE')
    expect(check({ customRate: NaN }).customRate).toBe('NOT_A_NUMBER')
  })
})
