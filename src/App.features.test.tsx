import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App'
import { createEtfRepository, type Etf } from './data/etfRepository'
import { createSavedConditionsStore } from './data/savedConditions'
import { calculateProjection } from './domain/calculate'
import { formatKrw } from './domain/format'

const etf = (ticker: string, name: string, threeYearCagr: number): Etf => ({
  ticker,
  name,
  threeYearCagr,
  asOf: '2026-09-30',
})
const A = etf('000001', '알파 ETF', 0.12)
const B = etf('000002', '베타 ETF', 0.08)
const C = etf('000003', '감마 ETF', -0.05)
const D = etf('000004', '델타 ETF', 0.03)
const repository = createEtfRepository([A, B, C, D])

const renderApp = () =>
  render(
    <App
      repository={repository}
      savedStore={createSavedConditionsStore(window.localStorage)}
    />,
  )

async function pick(
  user: ReturnType<typeof userEvent.setup>,
  label: string,
  name: string,
) {
  await user.type(screen.getByLabelText(label), name)
  await user.click(screen.getByRole('option'))
}

async function calculate(
  user: ReturnType<typeof userEvent.setup>,
  months = '12',
) {
  await pick(user, '종목 검색 (종목명 또는 티커)', '알파')
  await user.type(screen.getByLabelText('투자 기간(개월)'), months)
  await user.type(screen.getByLabelText('월 투자 금액'), '100000')
  const initial = screen.getByLabelText('초기 투자 자본')
  await user.clear(initial)
  await user.type(initial, '1000000')
  await user.click(screen.getByRole('button', { name: '계산하기' }))
}

beforeEach(() => window.localStorage.clear())
afterEach(() => window.history.pushState({}, '', '/'))

describe('수익률 직접 입력 (US-006)', () => {
  it('켜면 직접 입력한 수익률(5%)로 계산한다', async () => {
    const user = userEvent.setup()
    renderApp()
    await calculate(user)
    expect(screen.getByText('2,384,650원')).toBeInTheDocument()
    await user.click(screen.getByRole('checkbox', { name: '수익률 직접 입력' }))
    await user.type(screen.getByLabelText('연 수익률(%)'), '5')
    await user.click(screen.getByRole('button', { name: '계산하기' }))
    const expected = calculateProjection({
      initial: 1_000_000,
      monthly: 100_000,
      months: 12,
      annualRate: 0.05,
    })
    expect(screen.getByText('수익률 출처: 사용자 지정')).toBeInTheDocument()
    expect(
      screen.getByText(formatKrw(expected.finalAmount)),
    ).toBeInTheDocument()
    expect(screen.queryByText('2,384,650원')).not.toBeInTheDocument()
  })
})

describe('조건 저장/불러오기 (US-008)', () => {
  it('저장한 항목을 누르면 폼과 종목 선택이 복원된다', async () => {
    const user = userEvent.setup()
    const { unmount } = renderApp()
    await calculate(user)
    await user.click(screen.getByRole('button', { name: '조건 저장' }))
    expect(
      screen.getByRole('button', { name: /알파 ETF · 12개월/ }),
    ).toBeInTheDocument()
    unmount()

    renderApp() // 새로 열어도 저장 목록이 남아 있다
    await user.click(screen.getByRole('button', { name: /알파 ETF · 12개월/ }))
    expect(screen.getByLabelText('종목 검색 (종목명 또는 티커)')).toHaveValue(
      '알파 ETF',
    )
    expect(screen.getByText('수익률 출처: 알파 ETF')).toBeInTheDocument()
    expect(screen.getByLabelText('투자 기간(개월)')).toHaveValue('12')
    expect(screen.getByLabelText('월 투자 금액')).toHaveValue('100,000')
    expect(screen.getByLabelText('초기 투자 자본')).toHaveValue('1,000,000')
    expect(screen.getByRole('button', { name: '계산하기' })).toBeEnabled()
  })

  it('삭제 버튼으로 항목을 지운다', async () => {
    const user = userEvent.setup()
    renderApp()
    await calculate(user)
    await user.click(screen.getByRole('button', { name: '조건 저장' }))
    await user.click(screen.getByRole('button', { name: '저장된 조건 삭제' }))
    expect(
      screen.queryByRole('region', { name: '저장된 조건' }),
    ).not.toBeInTheDocument()
  })

  it('목록에 없는 종목의 저장 조건은 무시한다', async () => {
    const store = createSavedConditionsStore(window.localStorage)
    store.save({ ticker: '999999', months: 12, monthly: 1, initial: 0 })
    const user = userEvent.setup()
    render(<App repository={repository} savedStore={store} />)
    await user.click(screen.getByRole('button', { name: /999999/ }))
    expect(screen.getByLabelText('투자 기간(개월)')).toHaveValue('')
  })
})

describe('링크 공유 (US-009)', () => {
  it('URL 쿼리가 유효하면 입력을 채우고 결과를 바로 보여준다', () => {
    window.history.pushState({}, '', '/?t=000001&m=12&p=100000&i=1000000')
    renderApp()
    expect(screen.getByText('2,384,650원')).toBeInTheDocument()
    expect(screen.getByLabelText('투자 기간(개월)')).toHaveValue('12')
    expect(screen.getByLabelText('종목 검색 (종목명 또는 티커)')).toHaveValue(
      '알파 ETF',
    )
  })

  it('r 파라미터는 직접 입력 수익률로 적용된다', () => {
    window.history.pushState({}, '', '/?t=000001&m=12&p=100000&i=1000000&r=0')
    renderApp()
    expect(screen.getByText('수익률 출처: 사용자 지정')).toBeInTheDocument()
    expect(screen.queryByText('2,384,650원')).not.toBeInTheDocument()
  })

  it.each(['r=500', 'r=abc'])(
    '잘못된 %s는 버리고 종목 수익률로 계산한다',
    (r) => {
      window.history.pushState(
        {},
        '',
        `/?t=000001&m=12&p=100000&i=1000000&${r}`,
      )
      renderApp()
      expect(screen.getByText('2,384,650원')).toBeInTheDocument()
      expect(screen.getByText('수익률 출처: 알파 ETF')).toBeInTheDocument()
    },
  )

  it.each([
    '/?t=000001&m=0&p=100000&i=0',
    '/?t=777777&m=12&p=100000&i=0',
    '/?t=000001&m=12',
  ])('유효하지 않은 쿼리(%s)는 무시한다', (url) => {
    window.history.pushState({}, '', url)
    renderApp()
    expect(screen.queryByLabelText('계산 결과')).not.toBeInTheDocument()
    expect(screen.getByLabelText('투자 기간(개월)')).toHaveValue('')
  })

  it('링크 복사는 origin+pathname+query를 클립보드에 쓴다', async () => {
    const user = userEvent.setup()
    const writeText = vi.spyOn(navigator.clipboard, 'writeText')
    renderApp()
    await calculate(user)
    await user.click(screen.getByRole('button', { name: '링크 복사' }))
    expect(writeText).toHaveBeenCalledWith(
      `${window.location.origin}/?t=000001&m=12&p=100000&i=1000000`,
    )
    expect(await screen.findByText('복사됨')).toBeInTheDocument()
  })
})

describe('성장 그래프 (US-007)', () => {
  it('결과 아래에 그래프를 표시한다', async () => {
    const user = userEvent.setup()
    renderApp()
    expect(
      screen.queryByRole('region', { name: '성장 그래프' }),
    ).not.toBeInTheDocument()
    await calculate(user)
    expect(
      screen.getByRole('region', { name: '성장 그래프' }),
    ).toBeInTheDocument()
  })
})

describe('다중 종목 비교 (US-010)', () => {
  it('종목이 선택되기 전에는 추가할 수 없다', () => {
    renderApp()
    expect(
      screen.getByRole('button', { name: '비교 종목 추가' }),
    ).toBeDisabled()
  })

  it('표의 최종 금액은 단일 계산 결과와 같고 최대 3종목까지만 추가된다', async () => {
    const user = userEvent.setup()
    renderApp()
    await calculate(user)
    expect(screen.queryByRole('table')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '비교 종목 추가' }))
    await pick(user, '비교 종목 검색', '베타')
    await user.click(screen.getByRole('button', { name: '비교 종목 추가' }))
    await pick(user, '비교 종목 검색', '감마')

    expect(
      screen.getByRole('button', { name: '비교 종목 추가' }),
    ).toBeDisabled()
    expect(
      screen.getByText('최대 3종목까지 비교할 수 있습니다'),
    ).toBeInTheDocument()

    const table = screen.getByRole('table')
    for (const e of [A, B, C]) {
      const single = calculateProjection({
        initial: 1_000_000,
        monthly: 100_000,
        months: 12,
        annualRate: e.threeYearCagr,
      })
      const row = within(table).getByRole('row', { name: new RegExp(e.name) })
      expect(
        within(row).getByText(formatKrw(single.finalAmount)),
      ).toBeInTheDocument()
      expect(
        within(row).getByText(formatKrw(single.profit)),
      ).toBeInTheDocument()
    }
    expect(screen.getByText('최종 금액 비교')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '감마 ETF 비교 제거' }))
    expect(screen.getByRole('button', { name: '비교 종목 추가' })).toBeEnabled()
    expect(within(table).queryByText('감마 ETF')).not.toBeInTheDocument()
  })

  it('대표 종목과 같은 종목은 비교에 추가되지 않는다', async () => {
    const user = userEvent.setup()
    renderApp()
    await calculate(user)
    await user.click(screen.getByRole('button', { name: '비교 종목 추가' }))
    await pick(user, '비교 종목 검색', '알파')
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('비교 종목 검색')).not.toBeInTheDocument()
  })

  it('대표 종목을 비교 종목으로 바꾸면 비교 목록에서 빠진다', async () => {
    const user = userEvent.setup()
    renderApp()
    await calculate(user)
    await user.click(screen.getByRole('button', { name: '비교 종목 추가' }))
    await pick(user, '비교 종목 검색', '델타')
    const primary = screen.getByLabelText('종목 검색 (종목명 또는 티커)')
    await user.clear(primary)
    await user.type(primary, '델타')
    await user.click(screen.getByRole('option'))
    expect(
      screen.queryByRole('button', { name: '델타 ETF 비교 제거' }),
    ).not.toBeInTheDocument()
  })
})

describe('상태 흐름 회귀', () => {
  it('B1: 대표 종목을 바꾼 뒤 이전 대표 종목을 비교에 추가해도 중복 없이 표시된다', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    const user = userEvent.setup()
    renderApp()
    await calculate(user) // 알파
    const primary = screen.getByLabelText('종목 검색 (종목명 또는 티커)')
    await user.clear(primary)
    await user.type(primary, '베타')
    await user.click(screen.getByRole('option'))
    // 종목이 바뀌면 이전 결과는 무효화된다
    expect(screen.queryByLabelText('계산 결과')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '비교 종목 추가' }))
    await pick(user, '비교 종목 검색', '알파')
    await user.click(screen.getByRole('button', { name: '계산하기' }))

    const table = screen.getByRole('table')
    const names = within(table)
      .getAllByRole('rowheader')
      .map((h) => h.textContent)
    expect(names).toEqual(['베타 ETF', '알파 ETF'])
    expect(screen.getByLabelText('계산 결과')).toHaveTextContent('베타 ETF')
    expect(error).not.toHaveBeenCalled()
  })

  it('B2: 결과가 보이는 중 저장 항목을 불러오면 그 조건의 결과가 보이고 저장·링크도 그 조건을 쓴다', async () => {
    const store = createSavedConditionsStore(window.localStorage)
    store.save({ ticker: '000002', months: 36, monthly: 300_000, initial: 0 })
    const user = userEvent.setup()
    render(<App repository={repository} savedStore={store} />)
    await calculate(user)
    expect(screen.getByText('2,384,650원')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /베타 ETF · 36개월/ }))
    const expected = calculateProjection({
      initial: 0,
      monthly: 300_000,
      months: 36,
      annualRate: 0.08,
    })
    const card = screen.getByLabelText('계산 결과')
    expect(
      within(card).getByText(formatKrw(expected.finalAmount)),
    ).toBeInTheDocument()
    expect(card).toHaveTextContent(
      '베타 ETF · 36개월 · 월 300,000원 · 초기 0원',
    )
    expect(screen.queryByText('2,384,650원')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '조건 저장' }))
    expect(store.list()[0]).toMatchObject({
      ticker: '000002',
      months: 36,
      monthly: 300_000,
      initial: 0,
    })

    const writeText = vi.spyOn(navigator.clipboard, 'writeText')
    await user.click(screen.getByRole('button', { name: '링크 복사' }))
    expect(writeText).toHaveBeenCalledWith(
      `${window.location.origin}/?t=000002&m=36&p=300000&i=0`,
    )
  })

  it('저장 항목의 종목을 찾을 수 없으면 이전 결과를 지운다', async () => {
    const store = createSavedConditionsStore(window.localStorage)
    store.save({ ticker: '999999', months: 12, monthly: 1, initial: 0 })
    const user = userEvent.setup()
    render(<App repository={repository} savedStore={store} />)
    await calculate(user)
    await user.click(screen.getByRole('button', { name: /999999/ }))
    expect(screen.queryByLabelText('계산 결과')).not.toBeInTheDocument()
  })
})
