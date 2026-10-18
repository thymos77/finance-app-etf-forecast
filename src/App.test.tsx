import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import App from './App'
import { createEtfRepository } from './data/etfRepository'

const repository = createEtfRepository([
  {
    ticker: '000001',
    name: '테스트 ETF',
    threeYearCagr: 0.12,
    asOf: '2026-09-30',
  },
])

async function fillAndCalculate() {
  const user = userEvent.setup()
  render(<App repository={repository} />)
  await user.type(screen.getByRole('combobox'), '테스트')
  await user.click(screen.getByRole('option'))
  await user.type(screen.getByLabelText('투자 기간(개월)'), '12')
  await user.type(screen.getByLabelText('월 투자 금액'), '100000')
  const initial = screen.getByLabelText('초기 투자 자본')
  await user.clear(initial)
  await user.type(initial, '1000000')
  await user.click(screen.getByRole('button', { name: '계산하기' }))
  return user
}

describe('App', () => {
  it('종목 선택 → 입력 → 계산 결과 표시', async () => {
    await fillAndCalculate()
    expect(screen.getByText('2,384,650원')).toBeInTheDocument()
    expect(screen.getByText('2,200,000원')).toBeInTheDocument()
    expect(screen.getByText('8.39%')).toBeInTheDocument()
  })

  it('종목 선택 전에는 계산할 수 없다', () => {
    render(<App repository={repository} />)
    expect(screen.getByRole('button', { name: '계산하기' })).toBeDisabled()
    expect(screen.queryByLabelText('계산 결과')).not.toBeInTheDocument()
  })

  it('값을 바꿔 재계산하면 결과만 갱신되고 다른 입력은 유지된다', async () => {
    const user = await fillAndCalculate()
    const months = screen.getByLabelText('투자 기간(개월)')
    await user.clear(months)
    await user.type(months, '24')
    await user.click(screen.getByRole('button', { name: '계산하기' }))
    expect(screen.queryByText('2,384,650원')).not.toBeInTheDocument()
    expect(screen.getByText('3,400,000원')).toBeInTheDocument()
    expect(months).toHaveValue('24')
    expect(screen.getByLabelText('월 투자 금액')).toHaveValue('100,000')
    expect(screen.getByLabelText('초기 투자 자본')).toHaveValue('1,000,000')
  })
})
