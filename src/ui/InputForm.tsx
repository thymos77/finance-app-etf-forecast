import { useId, useState, type FormEvent } from 'react'
import { formatNumber } from '../domain/format'
import {
  MAX_AMOUNT,
  MAX_MONTHS,
  MAX_RATE,
  MIN_RATE,
  validate,
  type FormValues,
  type ValidateInput,
  type ValidationCode,
} from '../domain/validate'

export type FormSubmission = ValidateInput

interface InputFormProps {
  etfSelected: boolean
  /** 수익률 출처 라벨에 쓰는 종목명 */
  etfName?: string
  onSubmit: (values: FormSubmission) => void
  /** 처음 채워 둘 값 (저장 조건·공유 링크 복원용) */
  initial?: FormSubmission
}

type Field = keyof FormValues

const MONTH_CHIPS = [12, 36, 60, 120].map((m) => ({
  label: `${m}개월`,
  text: String(m),
}))
const AMOUNT_CHIPS = [10, 30, 50, 100].map((v) => ({
  label: `${v}만원`,
  text: String(v * 10_000),
}))

const OUT_OF_RANGE_MESSAGE: Record<Field, string> = {
  months: `투자 기간은 최대 ${MAX_MONTHS}개월까지 입력할 수 있습니다`,
  monthly: `금액은 최대 ${formatNumber(MAX_AMOUNT)}원까지 입력할 수 있습니다`,
  initial: `금액은 최대 ${formatNumber(MAX_AMOUNT)}원까지 입력할 수 있습니다`,
}

const RATE_RANGE_MESSAGE = `수익률은 ${MIN_RATE}%에서 ${MAX_RATE}% 사이여야 합니다`

const MESSAGES: Record<Exclude<ValidationCode, 'OUT_OF_RANGE'>, string> = {
  MONTHS_MIN: '투자 기간은 1개월 이상의 정수여야 합니다',
  MONTHLY_POSITIVE: '월 투자 금액은 0보다 커야 합니다',
  INITIAL_NONNEGATIVE: '초기 투자 자본은 0 이상이어야 합니다',
  NOT_A_NUMBER: '숫자를 입력해 주세요',
  RATE_OUT_OF_RANGE: RATE_RANGE_MESSAGE,
}

const errorMessage = (field: keyof ValidateInput, code: ValidationCode) =>
  code === 'OUT_OF_RANGE'
    ? OUT_OF_RANGE_MESSAGE[field as Field]
    : MESSAGES[code]

const toNumber = (text: string) => (text === '' ? NaN : Number(text))

interface NumberFieldProps {
  label: string
  unit: string
  text: string
  /** 입력 문자열을 표시용으로 바꾼다 (예: 천 단위 구분). */
  display?: (text: string) => string
  /** 입력 문자열에서 허용되지 않는 문자를 걷어낸다. */
  sanitize: (raw: string) => string
  presets?: { label: string; text: string }[]
  error?: string
  onChange: (text: string) => void
}

function NumberField({
  label,
  unit,
  text,
  display = (value) => value,
  sanitize,
  presets = [],
  error,
  onChange,
}: NumberFieldProps) {
  const id = useId()
  return (
    <div className="field" role="group" aria-label={`${label} 입력`}>
      <label htmlFor={id}>{label}</label>
      <div className="input-row">
        <input
          id={id}
          type="text"
          inputMode="decimal"
          value={display(text)}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          onChange={(event) => onChange(sanitize(event.target.value))}
        />
        <span className="unit">{unit}</span>
      </div>
      {presets.length > 0 && (
        <div className="chips">
          {presets.map((preset) => (
            <button
              key={preset.text}
              type="button"
              className="chip"
              onClick={() => onChange(preset.text)}
            >
              {preset.label}
            </button>
          ))}
        </div>
      )}
      {error && (
        <p id={`${id}-error`} className="error" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}

const digitsOnly = (raw: string) =>
  raw.replace(/\D/g, '').replace(/^0+(?=\d)/, '')
const withSeparators = (text: string) =>
  text === '' ? '' : formatNumber(Number(text))

export default function InputForm({
  etfSelected,
  etfName,
  onSubmit,
  initial,
}: InputFormProps) {
  const [texts, setTexts] = useState<Record<Field, string>>({
    months: initial ? String(initial.months) : '',
    monthly: initial ? String(initial.monthly) : '',
    initial: initial ? String(initial.initial) : '0',
  })
  const [customOn, setCustomOn] = useState(initial?.customRate !== undefined)
  const [rateText, setRateText] = useState(
    initial?.customRate === undefined ? '' : String(initial.customRate),
  )

  const values: FormValues = {
    months: toNumber(texts.months),
    monthly: toNumber(texts.monthly),
    initial: toNumber(texts.initial),
  }
  const customRate = customOn ? toNumber(rateText) : undefined
  const errors = validate({ ...values, customRate })
  const hasError = Object.keys(errors).length > 0
  const messageFor = (field: keyof ValidateInput, text: string) => {
    const code = errors[field]
    return code && text !== '' ? errorMessage(field, code) : undefined
  }
  const setText = (field: Field) => (text: string) =>
    setTexts((prev) => ({ ...prev, [field]: text }))

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    if (!hasError && etfSelected) {
      onSubmit(customRate === undefined ? values : { ...values, customRate })
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="field">
        <p className="rate-source">
          수익률 출처: {customOn ? '사용자 지정' : (etfName ?? '종목 미선택')}
        </p>
        <label className="toggle">
          <input
            type="checkbox"
            checked={customOn}
            onChange={(event) => setCustomOn(event.target.checked)}
          />
          수익률 직접 입력
        </label>
        {customOn && (
          <NumberField
            label="연 수익률(%)"
            unit="%"
            text={rateText}
            sanitize={(raw) => raw.replace(/[^\d.-]/g, '')}
            error={messageFor('customRate', rateText)}
            onChange={setRateText}
          />
        )}
      </div>
      <NumberField
        label="투자 기간(개월)"
        unit="개월"
        text={texts.months}
        sanitize={(raw) => raw.replace(/[^\d.]/g, '')}
        presets={MONTH_CHIPS}
        error={messageFor('months', texts.months)}
        onChange={setText('months')}
      />
      <NumberField
        label="월 투자 금액"
        unit="원"
        text={texts.monthly}
        display={withSeparators}
        sanitize={digitsOnly}
        presets={AMOUNT_CHIPS}
        error={messageFor('monthly', texts.monthly)}
        onChange={setText('monthly')}
      />
      <NumberField
        label="초기 투자 자본"
        unit="원"
        text={texts.initial}
        display={withSeparators}
        sanitize={digitsOnly}
        presets={AMOUNT_CHIPS}
        error={messageFor('initial', texts.initial)}
        onChange={setText('initial')}
      />
      <button
        type="submit"
        className="primary"
        disabled={hasError || !etfSelected}
      >
        계산하기
      </button>
      {!etfSelected && <p className="muted">먼저 종목을 선택해 주세요.</p>}
    </form>
  )
}
