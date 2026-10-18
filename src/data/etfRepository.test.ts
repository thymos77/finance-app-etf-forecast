import { describe, expect, it } from 'vitest'
import etfs from './etfs.json'
import { createEtfRepository, etfRepository, type Etf } from './etfRepository'

const make = (ticker: string, name: string): Etf => ({
  ticker,
  name,
  threeYearCagr: 0.1,
  asOf: '2026-09-30',
})

const fixture = [
  make('069500', 'KODEX 200'),
  make('360750', 'TIGER 미국S&P500'),
  ...Array.from({ length: 12 }, (_, i) =>
    make(`10000${i}`.slice(0, 6), `FOO ${i}`),
  ),
]
const repo = createEtfRepository(fixture)

describe('etfRepository.search', () => {
  it('빈 질의는 빈 배열', () => {
    expect(repo.search('')).toEqual([])
    expect(repo.search('   ')).toEqual([])
  })

  it('대소문자를 구분하지 않는다', () => {
    expect(repo.search('kodex')).toEqual(repo.search('KODEX'))
    expect(repo.search('kodex').map((e) => e.ticker)).toEqual(['069500'])
  })

  it('티커 접두 일치', () => {
    expect(repo.search('3607').map((e) => e.name)).toEqual(['TIGER 미국S&P500'])
    expect(repo.search('0750')).toEqual([])
  })

  it('공백을 무시한다', () => {
    expect(repo.search(' ko dex 2 00 ')).toEqual(repo.search('kodex200'))
    expect(repo.search('tiger미국')).toHaveLength(1)
  })

  it('get: 티커로 정확히 조회', () => {
    expect(repo.get('069500')?.name).toBe('KODEX 200')
    expect(repo.get('0695')).toBeUndefined()
  })

  it('최대 10건', () => {
    expect(repo.search('foo')).toHaveLength(10)
  })

  it('번들 데이터는 20~30개이고 스키마를 따른다', () => {
    expect(etfs.length).toBeGreaterThanOrEqual(20)
    expect(etfs.length).toBeLessThanOrEqual(30)
    expect(new Set(etfs.map((e) => e.ticker)).size).toBe(etfs.length)
    for (const etf of etfs) {
      expect(etf.ticker).toMatch(/^\d{6}$/)
      expect(etf.name).not.toBe('')
      expect(Number.isFinite(etf.threeYearCagr)).toBe(true)
      expect(etf.asOf).toBe('2026-09-30')
    }
    expect(etfRepository.search('069500')[0].name).toBe('KODEX 200')
  })
})
