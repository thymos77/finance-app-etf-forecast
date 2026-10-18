import { useState, type RefObject } from 'react'
import { toPng } from 'html-to-image'

interface ResultActionsProps {
  cardRef: RefObject<HTMLElement | null>
  /** 복사할 공유 링크 */
  shareUrl: string
  onSave: () => void
}

export default function ResultActions({
  cardRef,
  shareUrl,
  onSave,
}: ResultActionsProps) {
  const [message, setMessage] = useState('')

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setMessage('복사됨')
    } catch {
      setMessage('복사하지 못했습니다')
    }
  }

  const saveImage = async () => {
    if (!cardRef.current) return
    try {
      const link = document.createElement('a')
      link.download = 'etf-result.png'
      link.href = await toPng(cardRef.current, { backgroundColor: '#ffffff' })
      link.click()
    } catch {
      setMessage('이미지를 저장하지 못했습니다')
    }
  }

  return (
    <div className="actions">
      <button type="button" className="chip" onClick={onSave}>
        조건 저장
      </button>
      <button type="button" className="chip" onClick={copyLink}>
        링크 복사
      </button>
      <button type="button" className="chip" onClick={saveImage}>
        이미지 저장
      </button>
      <span role="status" className="muted">
        {message}
      </span>
    </div>
  )
}
