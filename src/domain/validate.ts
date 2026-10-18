export type ValidationCode =
  | 'MONTHS_MIN'
  | 'MONTHLY_POSITIVE'
  | 'INITIAL_NONNEGATIVE'
  | 'NOT_A_NUMBER'
  | 'OUT_OF_RANGE'
  | 'RATE_OUT_OF_RANGE'

export interface FormValues {
  months: number
  monthly: number
  initial: number
}

export interface ValidateInput extends FormValues {
  /** 직접 입력한 연 수익률(%). 직접 입력을 쓰지 않으면 생략한다. */
  customRate?: number
}

export type ValidationErrors = Partial<
  Record<keyof ValidateInput, ValidationCode>
>

export const MAX_MONTHS = 600
export const MIN_RATE = -99
export const MAX_RATE = 100
export const MAX_AMOUNT = 100_000_000_000

export function validate({
  months,
  monthly,
  initial,
  customRate,
}: ValidateInput): ValidationErrors {
  const errors: ValidationErrors = {}

  if (Number.isNaN(months)) errors.months = 'NOT_A_NUMBER'
  else if (!Number.isInteger(months) || months < 1) errors.months = 'MONTHS_MIN'
  else if (months > MAX_MONTHS) errors.months = 'OUT_OF_RANGE'

  if (Number.isNaN(monthly)) errors.monthly = 'NOT_A_NUMBER'
  else if (monthly <= 0) errors.monthly = 'MONTHLY_POSITIVE'
  else if (monthly > MAX_AMOUNT) errors.monthly = 'OUT_OF_RANGE'

  if (Number.isNaN(initial)) errors.initial = 'NOT_A_NUMBER'
  else if (initial < 0) errors.initial = 'INITIAL_NONNEGATIVE'
  else if (initial > MAX_AMOUNT) errors.initial = 'OUT_OF_RANGE'

  if (customRate !== undefined) {
    if (Number.isNaN(customRate)) errors.customRate = 'NOT_A_NUMBER'
    else if (customRate < MIN_RATE || customRate > MAX_RATE)
      errors.customRate = 'RATE_OUT_OF_RANGE'
  }

  return errors
}
