import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { formatKrw, formatKrwShort } from '../domain/format'
import type { SeriesPoint } from '../domain/projectSeries'

export default function GrowthChart({ series }: { series: SeriesPoint[] }) {
  return (
    <section className="chart" aria-label="성장 그래프">
      <ResponsiveContainer
        width="100%"
        height={260}
        initialDimension={{ width: 320, height: 260 }}
      >
        <LineChart
          data={series}
          margin={{ top: 8, right: 8, bottom: 0, left: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" unit="개월" minTickGap={24} />
          <YAxis width={72} tickFormatter={formatKrwShort} />
          <Tooltip
            formatter={(value) => formatKrw(Number(value))}
            labelFormatter={(month) => `${month}개월`}
          />
          <Legend />
          <Line
            dataKey="principal"
            name="투자 원금"
            stroke="#667085"
            dot={false}
            isAnimationActive={false}
          />
          <Line
            dataKey="value"
            name="예상 금액"
            stroke="#2563eb"
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </section>
  )
}
