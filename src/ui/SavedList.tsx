import type { EtfRepository } from '../data/etfRepository'
import type { SavedCondition } from '../data/savedConditions'
import { formatKrw } from '../domain/format'

interface SavedListProps {
  entries: SavedCondition[]
  repository: EtfRepository
  onLoad: (entry: SavedCondition) => void
  onRemove: (id: string) => void
}

export default function SavedList({
  entries,
  repository,
  onLoad,
  onRemove,
}: SavedListProps) {
  if (entries.length === 0) return null
  return (
    <section className="saved" aria-label="저장된 조건">
      <h2>저장된 조건</h2>
      <ul>
        {entries.map((entry) => (
          <li key={entry.id}>
            <button
              type="button"
              className="chip"
              onClick={() => onLoad(entry)}
            >
              {repository.get(entry.ticker)?.name ?? entry.ticker} ·{' '}
              {entry.months}개월 · 월 {formatKrw(entry.monthly)}
            </button>
            <button
              type="button"
              className="link"
              aria-label="저장된 조건 삭제"
              onClick={() => onRemove(entry.id)}
            >
              삭제
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}
