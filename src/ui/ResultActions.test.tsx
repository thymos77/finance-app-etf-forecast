import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { toPng } from 'html-to-image'
import { afterEach, describe, expect, it, vi } from 'vitest'
import ResultActions from './ResultActions'

vi.mock('html-to-image', () => ({
  toPng: vi.fn(async () => 'data:image/png;base64,AAAA'),
}))

afterEach(() => vi.restoreAllMocks())

describe('ResultActions', () => {
  it('이미지 저장: 카드 요소로 toPng를 호출하고 etf-result.png 다운로드를 클릭한다', async () => {
    const card = document.createElement('section')
    const click = vi
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(() => {})
    const user = userEvent.setup()
    render(
      <ResultActions
        cardRef={{ current: card }}
        shareUrl="x"
        onSave={vi.fn()}
      />,
    )
    await user.click(screen.getByRole('button', { name: '이미지 저장' }))
    await waitFor(() => expect(click).toHaveBeenCalledTimes(1))
    expect(vi.mocked(toPng).mock.calls[0][0]).toBe(card)
    const anchor = click.mock.contexts[0] as HTMLAnchorElement
    expect(anchor.download).toBe('etf-result.png')
    expect(anchor.href).toBe('data:image/png;base64,AAAA')
  })

  it('이미지 생성 실패 시 메시지를 보여준다', async () => {
    vi.mocked(toPng).mockRejectedValueOnce(new Error('fail'))
    const user = userEvent.setup()
    render(
      <ResultActions
        cardRef={{ current: document.createElement('section') }}
        shareUrl="x"
        onSave={vi.fn()}
      />,
    )
    await user.click(screen.getByRole('button', { name: '이미지 저장' }))
    expect(
      await screen.findByText('이미지를 저장하지 못했습니다'),
    ).toBeInTheDocument()
  })

  it('링크 복사: 클립보드에 쓰고 "복사됨"을 표시한다', async () => {
    const user = userEvent.setup()
    const writeText = vi.spyOn(navigator.clipboard, 'writeText')
    render(
      <ResultActions
        cardRef={{ current: null }}
        shareUrl="http://localhost/?t=069500"
        onSave={vi.fn()}
      />,
    )
    await user.click(screen.getByRole('button', { name: '링크 복사' }))
    expect(writeText).toHaveBeenCalledWith('http://localhost/?t=069500')
    expect(await screen.findByText('복사됨')).toBeInTheDocument()
  })

  it('클립보드 실패 시 안내 메시지', async () => {
    const user = userEvent.setup()
    vi.spyOn(navigator.clipboard, 'writeText').mockRejectedValue(
      new Error('no'),
    )
    render(
      <ResultActions
        cardRef={{ current: null }}
        shareUrl="x"
        onSave={vi.fn()}
      />,
    )
    await user.click(screen.getByRole('button', { name: '링크 복사' }))
    expect(await screen.findByText('복사하지 못했습니다')).toBeInTheDocument()
  })

  it('조건 저장 버튼은 onSave를 호출한다', async () => {
    const onSave = vi.fn()
    const user = userEvent.setup()
    render(
      <ResultActions
        cardRef={{ current: null }}
        shareUrl="x"
        onSave={onSave}
      />,
    )
    await user.click(screen.getByRole('button', { name: '조건 저장' }))
    expect(onSave).toHaveBeenCalledTimes(1)
  })

  it('카드 요소가 없으면 이미지를 만들지 않는다', async () => {
    vi.mocked(toPng).mockClear()
    const user = userEvent.setup()
    render(
      <ResultActions
        cardRef={{ current: null }}
        shareUrl="x"
        onSave={vi.fn()}
      />,
    )
    await user.click(screen.getByRole('button', { name: '이미지 저장' }))
    expect(toPng).not.toHaveBeenCalled()
  })
})
