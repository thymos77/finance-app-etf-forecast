import { useRef, useState } from 'react'
import {
  etfRepository,
  type Etf,
  type EtfRepository,
} from './data/etfRepository'
import {
  createSavedConditionsStore,
  type SavedCondition,
  type SavedConditionsStore,
} from './data/savedConditions'
import { calculateProjection } from './domain/calculate'
import { formatKrw } from './domain/format'
import { projectSeries } from './domain/projectSeries'
import { decode, encode, type Conditions } from './domain/shareQuery'
import { validate } from './domain/validate'
import ComparisonPanel from './ui/ComparisonPanel'
import EtfSearch from './ui/EtfSearch'
import GrowthChart from './ui/GrowthChart'
import InputForm, { type FormSubmission } from './ui/InputForm'
import ResultActions from './ui/ResultActions'
import ResultCard from './ui/ResultCard'
import SavedList from './ui/SavedList'

const MAX_ETFS = 3
const defaultStore = createSavedConditionsStore()

interface Scenario extends FormSubmission {
  etf: Etf
}

const annualRateOf = ({ etf, customRate }: Scenario) =>
  customRate === undefined ? etf.threeYearCagr : customRate / 100

const toConditions = (s: Scenario): Conditions => {
  const { etf, months, monthly, initial, customRate } = s
  const base = { ticker: etf.ticker, months, monthly, initial }
  return customRate === undefined ? base : { ...base, customRate }
}

/** 조건이 유효하고 종목이 존재할 때만 시나리오로 복원한다. */
function toScenario(
  conditions: Conditions | null,
  repository: EtfRepository,
): Scenario | null {
  if (!conditions) return null
  const { ticker, ...form } = conditions
  const etf = repository.get(ticker)
  if (!etf) return null
  // 범위를 벗어난 수익률(r)은 링크 전체를 버리지 않고 종목 수익률로 되돌린다.
  const safe = validate(form).customRate
    ? { ...form, customRate: undefined }
    : form
  return Object.keys(validate(safe)).length > 0 ? null : { etf, ...safe }
}

interface AppProps {
  repository?: EtfRepository
  savedStore?: SavedConditionsStore
}

export default function App({
  repository = etfRepository,
  savedStore = defaultStore,
}: AppProps) {
  const [loaded, setLoaded] = useState(() =>
    toScenario(decode(window.location.search), repository),
  )
  const [loadKey, setLoadKey] = useState(0)
  const [etf, setEtf] = useState<Etf | null>(loaded?.etf ?? null)
  const [calc, setCalc] = useState<Scenario | null>(loaded)
  const [compare, setCompare] = useState<Etf[]>([])
  const [adding, setAdding] = useState(false)
  const [saved, setSaved] = useState(() => savedStore.list())
  const cardRef = useRef<HTMLElement>(null)

  const total = (etf ? 1 : 0) + compare.length
  const full = total >= MAX_ETFS

  const selectPrimary = (next: Etf) => {
    // 계산 결과는 선택 당시의 종목에 속하므로 종목이 바뀌면 무효화한다.
    if (next.ticker !== calc?.etf.ticker) setCalc(null)
    setEtf(next)
    setCompare((list) => list.filter((e) => e.ticker !== next.ticker))
  }

  const addCompare = (next: Etf) => {
    if (
      next.ticker !== etf?.ticker &&
      !compare.some((e) => e.ticker === next.ticker)
    ) {
      setCompare((list) => [...list, next])
    }
    setAdding(false)
  }

  const loadSaved = (entry: SavedCondition) => {
    const scenario = toScenario(entry, repository)
    if (!scenario) {
      setCalc(null)
      return
    }
    setLoaded(scenario)
    selectPrimary(scenario.etf)
    setCalc(scenario)
    setLoadKey((key) => key + 1)
  }

  const input = calc && { ...calc, annualRate: annualRateOf(calc) }
  return (
    <main className="container">
      <h1>ETF 적립식 투자 계산기</h1>
      <EtfSearch
        key={`etf-${loadKey}`}
        repository={repository}
        onSelect={selectPrimary}
        initialEtf={loaded?.etf}
      />
      <div className="field">
        <button
          type="button"
          className="chip"
          disabled={!etf || full}
          onClick={() => setAdding(true)}
        >
          비교 종목 추가
        </button>
        {full && (
          <p className="muted">최대 {MAX_ETFS}종목까지 비교할 수 있습니다</p>
        )}
        {compare.map((e) => (
          <p key={e.ticker} className="compare-item">
            {e.name}{' '}
            <button
              type="button"
              className="link"
              aria-label={`${e.name} 비교 제거`}
              onClick={() => setCompare((list) => list.filter((x) => x !== e))}
            >
              제거
            </button>
          </p>
        ))}
        {adding && !full && (
          <EtfSearch
            key={`compare-${compare.length}`}
            label="비교 종목 검색"
            repository={repository}
            onSelect={addCompare}
          />
        )}
      </div>
      <InputForm
        key={`form-${loadKey}`}
        etfSelected={etf !== null}
        etfName={etf?.name}
        initial={loaded ?? undefined}
        onSubmit={(submission) => etf && setCalc({ etf, ...submission })}
      />
      <SavedList
        entries={saved}
        repository={repository}
        onLoad={loadSaved}
        onRemove={(id) => setSaved(savedStore.remove(id))}
      />
      {input && (
        <>
          <ResultCard
            ref={cardRef}
            result={calculateProjection(input)}
            summary={`${input.etf.name} · ${input.months}개월 · 월 ${formatKrw(input.monthly)} · 초기 ${formatKrw(input.initial)}`}
          />
          <ResultActions
            cardRef={cardRef}
            shareUrl={`${window.location.origin}${window.location.pathname}${encode(toConditions(input))}`}
            onSave={() => setSaved(savedStore.save(toConditions(input)))}
          />
          <GrowthChart series={projectSeries(input)} />
          {compare.length > 0 && (
            <ComparisonPanel
              values={input}
              rows={[
                {
                  etf: input.etf,
                  annualRate: input.annualRate,
                  custom: input.customRate !== undefined,
                },
                ...compare.map((e) => ({
                  etf: e,
                  annualRate: e.threeYearCagr,
                  custom: false,
                })),
              ]}
            />
          )}
        </>
      )}
    </main>
  )
}
