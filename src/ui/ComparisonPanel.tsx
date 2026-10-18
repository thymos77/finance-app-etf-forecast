import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { Etf } from '../data/etfRepository'
import { calculateProjection } from '../domain/calculate'
import { formatKrw, formatKrwShort, formatPercent } from '../domain/format'
import type { FormValues } from '../domain/validate'

export interface ComparisonRow {
  etf: Etf
  /** 연 수익률(소수) */
  annualRate: number
  custom: boolean
}

interface ComparisonPanelProps {
  rows: ComparisonRow[]
  values: FormValues
}

export default function ComparisonPanel({
  rows,
  values,
}: ComparisonPanelProps) {
  const computed = rows.map((row) => ({
    ...row,
    result: calculateProjection({ ...values, annualRate: row.annualRate }),
  }))
  const data = computed.map(({ etf, result }) => ({
    ticker: etf.ticker,
    finalAmount: result.finalAmount,
  }))

  return (
    <section className="comparison" aria-label="종목 비교">
      <h2>종목 비교</h2>
      <table>
        <thead>
          <tr>
            <th scope="col">종목</th>
            <th scope="col">수익률</th>
            <th scope="col">최종 예상 금액</th>
            <th scope="col">수익금</th>
          </tr>
        </thead>
        <tbody>
          {computed.map(({ etf, annualRate, custom, result }) => (
            <tr key={etf.ticker}>
              <th scope="row">{etf.name}</th>
              <td>
                {formatPercent(annualRate * 100)}
                {custom && ' (사용자 지정)'}
              </td>
              <td>{formatKrw(result.finalAmount)}</td>
              <td>{formatKrw(result.profit)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="chart">
        <ResponsiveContainer
          width="100%"
          height={220}
          initialDimension={{ width: 320, height: 220 }}
        >
          <BarChart
            data={data}
            margin={{ top: 8, right: 8, bottom: 0, left: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="ticker" />
            <YAxis width={72} tickFormatter={formatKrwShort} />
            <Tooltip formatter={(value) => formatKrw(Number(value))} />
            <Legend />
            <Bar
              dataKey="finalAmount"
              name="최종 금액 비교"
              fill="#2563eb"
              isAnimationActive={false}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  )
}
