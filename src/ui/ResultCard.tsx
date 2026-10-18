import type { Ref } from 'react'
import type { Projection } from '../domain/calculate'
import { formatKrw, formatPercent } from '../domain/format'

export const DISCLAIMER =
  '과거 수익률 기반 추정이며 미래 수익을 보장하지 않습니다'

export default function ResultCard({
  result,
  summary,
  ref,
}: {
  result: Projection
  /** 결과가 어떤 조건의 것인지 보여 주는 한 줄 설명 */
  summary?: string
  ref?: Ref<HTMLElement>
}) {
  // 표시상 0인 값은 음수로 취급하지 않는다.
  const amountTone = Math.round(result.profit) < 0 ? 'negative' : 'positive'
  const rateTone =
    Number(result.profitRate.toFixed(2)) < 0 ? 'negative' : 'positive'
  return (
    <section
      ref={ref}
      className="result"
      aria-label="계산 결과"
      aria-live="polite"
    >
      {summary && <p className="muted summary">{summary}</p>}
      <dl>
        <div>
          <dt>총 투자 원금</dt>
          <dd>{formatKrw(result.principal)}</dd>
        </div>
        <div>
          <dt>최종 예상 금액</dt>
          <dd className="strong">{formatKrw(result.finalAmount)}</dd>
        </div>
        <div>
          <dt>예상 수익금</dt>
          <dd className={amountTone}>{formatKrw(result.profit)}</dd>
        </div>
        <div>
          <dt>수익률</dt>
          <dd className={rateTone}>{formatPercent(result.profitRate)}</dd>
        </div>
      </dl>
      <p className="muted">{DISCLAIMER}</p>
    </section>
  )
}
