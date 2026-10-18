import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { projectSeries } from '../domain/projectSeries'
import GrowthChart from './GrowthChart'

describe('GrowthChart', () => {
  it('두 시리즈의 범례를 표시한다', () => {
    const series = projectSeries({
      initial: 1_000_000,
      monthly: 100_000,
      months: 12,
      annualRate: 0.12,
    })
    render(<GrowthChart series={series} />)
    expect(screen.getByText('투자 원금')).toBeInTheDocument()
    expect(screen.getByText('예상 금액')).toBeInTheDocument()
    // 두 데이터 키 각각이 선으로 그려진다.
    expect(document.querySelectorAll('.recharts-line')).toHaveLength(2)
    expect(series[12].value).toBeGreaterThan(series[12].principal)
  })
})
