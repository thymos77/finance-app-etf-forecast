import { describe, expect, it } from 'vitest'
import { createSavedConditionsStore } from './savedConditions'

class MemoryStorage implements Pick<Storage, 'getItem' | 'setItem'> {
  data = new Map<string, string>()
  getItem(key: string) {
    return this.data.get(key) ?? null
  }
  setItem(key: string, value: string) {
    this.data.set(key, value)
  }
}

const asStorage = (s: MemoryStorage) => s as unknown as Storage
const cond = (months: number) => ({
  ticker: '069500',
  months,
  monthly: 100_000,
  initial: 0,
})

describe('savedConditions', () => {
  it('새 인스턴스에서도 같은 저장소의 목록을 읽는다', () => {
    const storage = asStorage(new MemoryStorage())
    createSavedConditionsStore(storage).save({ ...cond(12), customRate: 5 })
    const list = createSavedConditionsStore(storage).list()
    expect(list).toHaveLength(1)
    expect(list[0]).toMatchObject({
      ticker: '069500',
      months: 12,
      customRate: 5,
    })
    expect(typeof list[0].id).toBe('string')
    expect(typeof list[0].savedAt).toBe('number')
  })

  it('최신순이고 11번째를 저장하면 가장 오래된 것을 버린다', () => {
    const store = createSavedConditionsStore(asStorage(new MemoryStorage()))
    for (let m = 1; m <= 11; m++) store.save(cond(m))
    const list = store.list()
    expect(list).toHaveLength(10)
    expect(list[0].months).toBe(11)
    expect(list[9].months).toBe(2)
  })

  it('remove는 해당 항목만 지운다', () => {
    const store = createSavedConditionsStore(asStorage(new MemoryStorage()))
    store.save(cond(1))
    const [first] = store.save(cond(2))
    expect(store.remove(first.id).map((e) => e.months)).toEqual([1])
    expect(store.list()).toHaveLength(1)
  })

  it('예외를 던지는 저장소는 빈 목록을 돌려주고 던지지 않는다', () => {
    const broken = {
      getItem() {
        throw new Error('denied')
      },
      setItem() {
        throw new Error('denied')
      },
    } as unknown as Storage
    const store = createSavedConditionsStore(broken)
    expect(store.list()).toEqual([])
    expect(() => store.save(cond(1))).not.toThrow()
    expect(() => store.remove('x')).not.toThrow()
  })

  it('손상된 데이터는 무시한다', () => {
    const memory = new MemoryStorage()
    const store = createSavedConditionsStore(asStorage(memory))
    memory.setItem('etf-dca:saved-conditions', 'not json')
    expect(store.list()).toEqual([])
    memory.setItem('etf-dca:saved-conditions', '{"a":1}')
    expect(store.list()).toEqual([])
    memory.setItem('etf-dca:saved-conditions', '[1, null, {"id":"a"}]')
    expect(store.list()).toEqual([])
  })

  it('customRate가 숫자가 아닌 항목은 무시한다', () => {
    const memory = new MemoryStorage()
    const store = createSavedConditionsStore(asStorage(memory))
    const entry = {
      id: 'a',
      savedAt: 1,
      ticker: '069500',
      months: 1,
      monthly: 1,
      initial: 0,
    }
    memory.setItem(
      'etf-dca:saved-conditions',
      JSON.stringify([
        { ...entry, id: 'ok', customRate: 5 },
        { ...entry, id: 'none' },
        { ...entry, id: 'str', customRate: '5' },
        { ...entry, id: 'null', customRate: null },
      ]),
    )
    expect(store.list().map((e) => e.id)).toEqual(['ok', 'none'])
  })

  it('기본 저장소는 window.localStorage', () => {
    window.localStorage.clear()
    createSavedConditionsStore().save(cond(3))
    expect(createSavedConditionsStore().list()).toHaveLength(1)
    window.localStorage.clear()
  })
})
