export interface Conditions {
  ticker: string
  months: number
  monthly: number
  initial: number
  /** 직접 입력한 연 수익률(%). 없으면 종목 수익률을 쓴다. */
  customRate?: number
}

export function encode(c: Conditions): string {
  const rate = c.customRate === undefined ? '' : `&r=${c.customRate}`
  return `?t=${c.ticker}&m=${c.months}&p=${c.monthly}&i=${c.initial}${rate}`
}

function readNumber(params: URLSearchParams, key: string): number | null {
  const raw = params.get(key)
  if (raw === null || raw.trim() === '') return null
  const value = Number(raw)
  return Number.isFinite(value) ? value : null
}

/** 필수 값이 없거나 잘못되면 null. 잘못된 r은 무시한다. */
export function decode(search: string): Conditions | null {
  const params = new URLSearchParams(search)
  const ticker = params.get('t')
  const months = readNumber(params, 'm')
  const monthly = readNumber(params, 'p')
  const initial = readNumber(params, 'i')
  if (!ticker || !/^\d{6}$/.test(ticker)) return null
  if (months === null || monthly === null || initial === null) return null
  const customRate = readNumber(params, 'r')
  return {
    ticker,
    months,
    monthly,
    initial,
    ...(customRate === null ? {} : { customRate }),
  }
}
