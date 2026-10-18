import etfData from './etfs.json'

export interface Etf {
  ticker: string
  name: string
  /** 최근 3년 연환산 수익률(소수). 예: 0.1234 */
  threeYearCagr: number
  asOf: string
}

export interface EtfRepository {
  search(query: string): Etf[]
  /** 티커(6자리)로 정확히 하나를 찾는다. */
  get(ticker: string): Etf | undefined
}

export const MAX_RESULTS = 10

const normalize = (text: string) => text.replace(/\s+/g, '').toLowerCase()

export function createEtfRepository(etfs: Etf[]): EtfRepository {
  return {
    search(query) {
      const q = normalize(query)
      if (!q) return []
      return etfs
        .filter(
          (etf) => normalize(etf.name).includes(q) || etf.ticker.startsWith(q),
        )
        .slice(0, MAX_RESULTS)
    },
    get: (ticker) => etfs.find((etf) => etf.ticker === ticker),
  }
}

export const etfRepository = createEtfRepository(etfData)
