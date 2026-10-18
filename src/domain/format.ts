export function formatNumber(value: number): string {
  const rounded = Math.round(value)
  // -0.4 같은 값이 "-0"으로 표시되지 않도록 음의 0을 0으로 바꾼다.
  return (rounded === 0 ? 0 : rounded).toLocaleString('ko-KR')
}

export function formatKrw(value: number): string {
  return `${formatNumber(value)}원`
}

/** 퍼센트 단위 값(8.39)을 "8.39%"로 표시한다. */
export function formatPercent(percent: number): string {
  const text = percent.toFixed(2)
  return `${Number(text) === 0 ? '0.00' : text}%`
}

const compact = (value: number) =>
  value.toLocaleString('ko-KR', { maximumFractionDigits: 1 })

/** 차트 축용 축약 표기: 1.5억, 120만, 5,000원 */
export function formatKrwShort(value: number): string {
  const abs = Math.abs(value)
  if (abs >= 100_000_000) return `${compact(value / 100_000_000)}억`
  if (abs >= 10_000) return `${compact(value / 10_000)}만`
  return formatKrw(value)
}
