import { useId, useState, type KeyboardEvent } from 'react'
import { formatPercent } from '../domain/format'
import type { Etf, EtfRepository } from '../data/etfRepository'

interface EtfSearchProps {
  repository: EtfRepository
  onSelect: (etf: Etf) => void
  label?: string
  /** 처음부터 선택되어 있는 종목 (저장 조건·공유 링크 복원용) */
  initialEtf?: Etf | null
}

export default function EtfSearch({
  repository,
  onSelect,
  label = '종목 검색 (종목명 또는 티커)',
  initialEtf = null,
}: EtfSearchProps) {
  const id = useId()
  const [query, setQuery] = useState(initialEtf?.name ?? '')
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const [selected, setSelected] = useState<Etf | null>(initialEtf)

  const results = repository.search(query)
  const showList = open && query.trim() !== ''
  const optionId = (index: number) => `${id}-option-${index}`

  const select = (etf: Etf) => {
    setSelected(etf)
    setQuery(etf.name)
    setOpen(false)
    setActiveIndex(-1)
    onSelect(etf)
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setOpen(true)
      setActiveIndex((i) => Math.min(i + 1, results.length - 1))
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActiveIndex((i) => Math.max(i - 1, 0))
    } else if (event.key === 'Enter') {
      event.preventDefault()
      if (showList && results[activeIndex]) select(results[activeIndex])
    } else if (event.key === 'Escape') {
      setOpen(false)
    }
  }

  return (
    <div className="field">
      <label htmlFor={`${id}-input`}>{label}</label>
      <input
        id={`${id}-input`}
        type="text"
        role="combobox"
        autoComplete="off"
        placeholder="예: KODEX 200, 069500"
        value={query}
        aria-expanded={showList}
        aria-controls={`${id}-listbox`}
        aria-activedescendant={
          showList && activeIndex >= 0 ? optionId(activeIndex) : undefined
        }
        onChange={(event) => {
          setQuery(event.target.value)
          setOpen(true)
          setActiveIndex(-1)
        }}
        onKeyDown={handleKeyDown}
      />
      {showList &&
        (results.length > 0 ? (
          <ul id={`${id}-listbox`} role="listbox" className="listbox">
            {results.map((etf, index) => (
              <li
                key={etf.ticker}
                id={optionId(index)}
                role="option"
                aria-selected={index === activeIndex}
                className={index === activeIndex ? 'option active' : 'option'}
                onClick={() => select(etf)}
              >
                {etf.name} <span className="muted">{etf.ticker}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="muted">검색 결과 없음</p>
        ))}
      {selected && (
        <div className="selected" aria-live="polite">
          <p>
            {selected.name} 3년 평균 수익률{' '}
            <strong>{formatPercent(selected.threeYearCagr * 100)}</strong>
          </p>
          <p className="muted">기준일 {selected.asOf} · 샘플 데이터</p>
        </div>
      )}
    </div>
  )
}
