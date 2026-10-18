import { describe, expect, it } from 'vitest'
import { decode, encode } from './shareQuery'

const base = {
  ticker: '069500',
  months: 12,
  monthly: 100_000,
  initial: 1_000_000,
}

describe('shareQuery', () => {
  it('r 없이 인코딩', () => {
    expect(encode(base)).toBe('?t=069500&m=12&p=100000&i=1000000')
  })

  it('직접 입력 수익률이 있으면 r 포함', () => {
    expect(encode({ ...base, customRate: 12 })).toBe(
      '?t=069500&m=12&p=100000&i=1000000&r=12',
    )
  })

  it('왕복 변환', () => {
    expect(decode(encode(base))).toEqual(base)
    const withRate = { ...base, customRate: -3.5 }
    expect(decode(encode(withRate))).toEqual(withRate)
    expect(decode(encode(base).slice(1))).toEqual(base)
  })

  it('필수 값이 없거나 잘못되면 null', () => {
    expect(decode('')).toBeNull()
    expect(decode('?t=069500&m=12&p=100000')).toBeNull()
    expect(decode('?t=abc&m=12&p=1&i=0')).toBeNull()
    expect(decode('?t=069500&m=x&p=1&i=0')).toBeNull()
    expect(decode('?t=069500&m=&p=1&i=0')).toBeNull()
    expect(decode('?m=12&p=1&i=0')).toBeNull()
  })

  it('잘못된 r은 무시한다', () => {
    expect(decode('?t=069500&m=12&p=1&i=0&r=abc')).toEqual({
      ticker: '069500',
      months: 12,
      monthly: 1,
      initial: 0,
    })
  })
})
