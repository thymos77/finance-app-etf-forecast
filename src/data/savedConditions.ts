import type { Conditions } from '../domain/shareQuery'

export interface SavedCondition extends Conditions {
  id: string
  savedAt: number
}

export interface SavedConditionsStore {
  list(): SavedCondition[]
  /** 새 항목을 맨 앞에 저장하고 갱신된 목록을 돌려준다. */
  save(conditions: Conditions): SavedCondition[]
  remove(id: string): SavedCondition[]
}

export const STORAGE_KEY = 'etf-dca:saved-conditions'
export const MAX_SAVED = 10

const isEntry = (value: unknown): value is SavedCondition => {
  const v = value as Partial<SavedCondition> | null
  return (
    typeof v === 'object' &&
    v !== null &&
    typeof v.id === 'string' &&
    typeof v.savedAt === 'number' &&
    typeof v.ticker === 'string' &&
    typeof v.months === 'number' &&
    typeof v.monthly === 'number' &&
    typeof v.initial === 'number' &&
    (v.customRate === undefined || Number.isFinite(v.customRate))
  )
}

export function createSavedConditionsStore(
  storage?: Storage,
): SavedConditionsStore {
  // window.localStorage 접근 자체가 예외를 던질 수 있으므로 try 안에서 고른다.
  const store = () => storage ?? window.localStorage

  const read = (): SavedCondition[] => {
    try {
      const raw = store().getItem(STORAGE_KEY)
      const parsed: unknown = raw ? JSON.parse(raw) : []
      return Array.isArray(parsed) ? parsed.filter(isEntry) : []
    } catch {
      return []
    }
  }

  const write = (entries: SavedCondition[]): SavedCondition[] => {
    try {
      store().setItem(STORAGE_KEY, JSON.stringify(entries))
    } catch {
      // 저장소에 쓰지 못해도 예외를 던지지 않는다. 돌려주는 목록은 저장되지 않았을 수 있다.
    }
    return entries
  }

  return {
    list: read,
    save: (conditions) => {
      const savedAt = Date.now()
      const id = `${savedAt.toString(36)}${Math.random().toString(36).slice(2, 8)}`
      return write(
        [{ ...conditions, id, savedAt }, ...read()].slice(0, MAX_SAVED),
      )
    },
    remove: (id) => write(read().filter((entry) => entry.id !== id)),
  }
}
