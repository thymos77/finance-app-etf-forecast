import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import InputForm from './InputForm'

function setup(etfSelected = true) {
  const onSubmit = vi.fn()
  render(<InputForm etfSelected={etfSelected} onSubmit={onSubmit} />)
  return {
    onSubmit,
    user: userEvent.setup(),
    months: screen.getByLabelText('투자 기간(개월)'),
    monthly: screen.getByLabelText('월 투자 금액'),
    initial: screen.getByLabelText('초기 투자 자본'),
    button: screen.getByRole('button', { name: '계산하기' }),
  }
}

describe('InputForm', () => {
  it('프리셋 칩이 필드를 채운다', async () => {
    const { user, months, monthly, initial } = setup()
    await user.click(screen.getByRole('button', { name: '36개월' }))
    expect(months).toHaveValue('36')
    const monthlyGroup = within(
      screen.getByRole('group', { name: '월 투자 금액 입력' }),
    )
    await user.click(monthlyGroup.getByRole('button', { name: '30만원' }))
    expect(monthly).toHaveValue('300,000')
    const initialGroup = within(
      screen.getByRole('group', { name: '초기 투자 자본 입력' }),
    )
    await user.click(initialGroup.getByRole('button', { name: '100만원' }))
    expect(initial).toHaveValue('1,000,000')
  })

  it('월 투자 금액 0 → 오류 + 버튼 비활성화', async () => {
    const { user, months, monthly, button } = setup()
    await user.type(months, '12')
    await user.type(monthly, '0')
    expect(
      screen.getByText('월 투자 금액은 0보다 커야 합니다'),
    ).toBeInTheDocument()
    expect(button).toBeDisabled()
  })

  it('초기 자본 0 → 오류 없음', async () => {
    const { user, months, monthly, initial, button } = setup()
    await user.clear(initial)
    await user.type(initial, '0')
    await user.type(months, '12')
    await user.type(monthly, '100000')
    expect(initial).toHaveValue('0')
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(button).toBeEnabled()
  })

  it('종목 미선택 → 버튼 비활성화', async () => {
    const { user, months, monthly, button } = setup(false)
    await user.type(months, '12')
    await user.type(monthly, '100000')
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(button).toBeDisabled()
  })

  it('금액은 천 단위 구분자로 표시하고 숫자로 전달한다', async () => {
    const { user, onSubmit, months, monthly, initial, button } = setup()
    await user.type(months, '12')
    await user.type(monthly, '1234567')
    await user.clear(initial)
    await user.type(initial, '1000000')
    expect(monthly).toHaveValue('1,234,567')
    expect(initial).toHaveValue('1,000,000')
    await user.click(button)
    expect(onSubmit).toHaveBeenCalledWith({
      months: 12,
      monthly: 1234567,
      initial: 1000000,
    })
  })

  it('기간 오류 메시지', async () => {
    const { user, months } = setup()
    await user.type(months, '1.5')
    expect(screen.getByText(/1개월 이상의 정수/)).toBeInTheDocument()
    await user.clear(months)
    await user.type(months, '601')
    expect(screen.getByText(/최대 600개월/)).toBeInTheDocument()
    await user.clear(months)
    await user.type(months, '1.2.3')
    expect(screen.getByText('숫자를 입력해 주세요')).toBeInTheDocument()
  })

  it('금액 상한 초과 오류', async () => {
    const { user, monthly } = setup()
    await user.type(monthly, '100000000001')
    expect(screen.getByText(/최대 100,000,000,000원/)).toBeInTheDocument()
  })

  it('초기 자본을 비우면 버튼 비활성화', async () => {
    const { user, months, monthly, initial, button } = setup()
    await user.type(months, '12')
    await user.type(monthly, '100000')
    await user.clear(initial)
    expect(button).toBeDisabled()
  })

  describe('수익률 직접 입력', () => {
    it('토글을 켜면 출처 라벨이 사용자 지정으로 바뀌고 값이 전달된다', async () => {
      const onSubmit = vi.fn()
      const user = userEvent.setup()
      render(<InputForm etfSelected etfName="KODEX 200" onSubmit={onSubmit} />)
      expect(screen.getByText('수익률 출처: KODEX 200')).toBeInTheDocument()
      await user.type(screen.getByLabelText('투자 기간(개월)'), '12')
      await user.type(screen.getByLabelText('월 투자 금액'), '100000')
      await user.click(
        screen.getByRole('checkbox', { name: '수익률 직접 입력' }),
      )
      expect(screen.getByText('수익률 출처: 사용자 지정')).toBeInTheDocument()
      const button = screen.getByRole('button', { name: '계산하기' })
      expect(button).toBeDisabled()
      await user.type(screen.getByLabelText('연 수익률(%)'), '-5.5')
      await user.click(button)
      expect(onSubmit).toHaveBeenCalledWith({
        months: 12,
        monthly: 100000,
        initial: 0,
        customRate: -5.5,
      })
    })

    it.each(['-100', '101'])(
      '범위를 벗어난 %s%%는 오류 + 비활성화',
      async (text) => {
        const { user, months, monthly, button } = setup()
        await user.type(months, '12')
        await user.type(monthly, '100000')
        await user.click(
          screen.getByRole('checkbox', { name: '수익률 직접 입력' }),
        )
        await user.type(screen.getByLabelText('연 수익률(%)'), text)
        expect(
          screen.getByText('수익률은 -99%에서 100% 사이여야 합니다'),
        ).toBeInTheDocument()
        expect(button).toBeDisabled()
      },
    )

    it('경계값 -99, 100은 통과한다', async () => {
      const { user, months, monthly, button } = setup()
      await user.type(months, '12')
      await user.type(monthly, '100000')
      await user.click(
        screen.getByRole('checkbox', { name: '수익률 직접 입력' }),
      )
      const rate = screen.getByLabelText('연 수익률(%)')
      await user.type(rate, '-99')
      expect(button).toBeEnabled()
      await user.clear(rate)
      await user.type(rate, '100')
      expect(button).toBeEnabled()
      await user.clear(rate)
      await user.type(rate, '-')
      expect(screen.getByText('숫자를 입력해 주세요')).toBeInTheDocument()
    })
  })
})
