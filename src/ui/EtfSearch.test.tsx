import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { createEtfRepository, type Etf } from '../data/etfRepository'
import EtfSearch from './EtfSearch'

const etfs: Etf[] = [
  {
    ticker: '069500',
    name: 'KODEX 200',
    threeYearCagr: 0.1234,
    asOf: '2026-09-30',
  },
  {
    ticker: '229200',
    name: 'KODEX 코스닥150',
    threeYearCagr: 0.02,
    asOf: '2026-09-30',
  },
]
const repository = createEtfRepository(etfs)

function setup() {
  const onSelect = vi.fn()
  render(<EtfSearch repository={repository} onSelect={onSelect} />)
  return {
    onSelect,
    input: screen.getByRole('combobox'),
    user: userEvent.setup(),
  }
}

describe('EtfSearch', () => {
  it('입력하면 결과 목록을 보여준다', async () => {
    const { user, input } = setup()
    await user.type(input, 'kodex')
    expect(screen.getAllByRole('option')).toHaveLength(2)
  })

  it('클릭으로 선택하고 수익률과 기준일을 표시한다', async () => {
    const { user, input, onSelect } = setup()
    await user.type(input, 'kodex 200')
    await user.click(screen.getByRole('option', { name: /KODEX 200/ }))
    expect(onSelect).toHaveBeenCalledWith(etfs[0])
    expect(screen.getByText('12.34%')).toBeInTheDocument()
    expect(screen.getByText(/2026-09-30/)).toBeInTheDocument()
    expect(screen.getByText(/샘플 데이터/)).toBeInTheDocument()
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })

  it('ArrowDown/ArrowUp + Enter로 선택한다', async () => {
    const { user, input, onSelect } = setup()
    await user.type(input, 'kodex')
    await user.keyboard('{ArrowDown}{ArrowDown}{ArrowUp}{Enter}')
    expect(onSelect).toHaveBeenCalledTimes(1)
    expect(onSelect).toHaveBeenCalledWith(etfs[0])
    await user.clear(input)
    await user.type(input, '2292')
    await user.keyboard('{ArrowDown}{Enter}')
    expect(onSelect).toHaveBeenLastCalledWith(etfs[1])
  })

  it('항목을 고르지 않고 Enter를 누르면 선택하지 않는다', async () => {
    const { user, input, onSelect } = setup()
    await user.type(input, 'kodex{Enter}')
    expect(onSelect).not.toHaveBeenCalled()
  })

  it('결과가 없으면 "검색 결과 없음"', async () => {
    const { user, input } = setup()
    await user.type(input, 'zzz')
    expect(screen.getByText('검색 결과 없음')).toBeInTheDocument()
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })

  it('Escape로 목록을 닫는다', async () => {
    const { user, input } = setup()
    await user.type(input, 'kodex{Escape}')
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })
})
