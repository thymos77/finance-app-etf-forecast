import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import ResultCard, { DISCLAIMER } from './ResultCard'

describe('ResultCard', () => {
  it('네 가지 값과 고지 문구를 표시한다', () => {
    render(
      <ResultCard
        result={{
          principal: 2_200_000,
          finalAmount: 2_384_650.3,
          profit: 184_650.3,
          profitRate: 8.3932,
        }}
      />,
    )
    expect(screen.getByText('총 투자 원금')).toBeInTheDocument()
    expect(screen.getByText('2,200,000원')).toBeInTheDocument()
    expect(screen.getByText('2,384,650원')).toBeInTheDocument()
    expect(screen.getByText('184,650원')).toHaveClass('positive')
    expect(screen.getByText('8.39%')).toHaveClass('positive')
    expect(
      screen.getByText(
        '과거 수익률 기반 추정이며 미래 수익을 보장하지 않습니다',
      ),
    ).toBeInTheDocument()
    expect(DISCLAIMER).toBe(
      '과거 수익률 기반 추정이며 미래 수익을 보장하지 않습니다',
    )
  })

  it('음수 수익은 마이너스 부호와 negative 클래스', () => {
    render(
      <ResultCard
        result={{
          principal: 3_600_000,
          finalAmount: 3_100_115,
          profit: -499_885,
          profitRate: -13.89,
        }}
      />,
    )
    expect(screen.getByText('-499,885원')).toHaveClass('negative')
    expect(screen.getByText('-13.89%')).toHaveClass('negative')
  })

  it('반올림하면 0인 음수는 부호와 negative 클래스를 쓰지 않는다', () => {
    render(
      <ResultCard
        result={{
          principal: 1000,
          finalAmount: 999.6,
          profit: -0.4,
          profitRate: -0.004,
        }}
      />,
    )
    expect(screen.getByText('0원')).toHaveClass('positive')
    expect(screen.getByText('0.00%')).toHaveClass('positive')
  })

  it('조건 요약을 표시한다', () => {
    render(
      <ResultCard
        summary="KODEX 200 · 12개월"
        result={{ principal: 1, finalAmount: 1, profit: 0, profitRate: 0 }}
      />,
    )
    expect(screen.getByText('KODEX 200 · 12개월')).toBeInTheDocument()
  })
})
