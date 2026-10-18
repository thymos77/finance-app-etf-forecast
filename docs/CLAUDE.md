# ETF 적립식 투자 계산기 — 작업 규칙

> **데이터 주의:** `src/data/etfs.json`의 3년 수익률(`threeYearCagr`)은 **예시용 샘플 데이터**입니다. 실제 수익률이 아니며, UI에도 기준일(`asOf`)과 "샘플 데이터" 라벨을 표시합니다. 실제 데이터 소스로 교체할 때는 `src/data/etfRepository.ts`(어댑터)만 수정합니다.

## 명령

| 용도 | 명령 |
|---|---|
| 개발 서버 | `npm run dev` |
| 빌드 (타입체크 포함) | `npm run build` |
| 테스트 | `npm test` |
| 커버리지 (`src/domain` 라인 100% 강제) | `npm run test:coverage` |
| 린트 | `npm run lint` |
| 포맷 | `npm run format` |

## 디렉터리 규칙

- `src/domain/` — 순수 함수만 둔다. React/DOM import 금지. (`calculate.ts`, `validate.ts`, `format.ts`, `projectSeries.ts`, `shareQuery.ts`). 라인 커버리지 100% 유지.
- `src/data/` — ETF 데이터 어댑터 (`etfs.json`, `etfRepository.ts`)와 저장 조건 (`savedConditions.ts`, 주입 가능한 `Storage`, 모든 접근 try/catch, 최대 10개). UI는 `EtfRepository` 인터페이스로만 접근하며, `App`의 `repository`, `savedStore` prop으로 주입할 수 있다.
- `src/ui/` — React 컴포넌트와 RTL 테스트. 계산·검증 로직은 `domain/`을 호출만 한다.

## 계산 규칙 (docs/PLAN.md §2~3)

- A4: 월 수익률 `r = (1 + R)^(1/12) − 1` (기하 환산). `R/12` 사용 금지.
- A5: 납입은 매월 말 (기말 연금). `FV = P0(1+r)^n + M((1+r)^n − 1)/r`, `r === 0`이면 `P0 + M·n`.
- A6: 계산 도중 반올림하지 않는다. 반올림은 표시(`format.ts`)에서만 한다.
- `annualRate`는 소수(0.12), `profitRate`는 퍼센트(8.39).
- 입력 상한: 기간 ≤ 600개월, 금액 ≤ 1,000억 원.

## 코드 규칙

- UI 문구는 한국어. TODO 주석, `test.skip`, `.only` 금지.

## P1 기능 메모

- 수익률 직접 입력: 범위 -99~100(%), 코드 `RATE_OUT_OF_RANGE` (`validate.ts`). 비교 표에서는 대표 종목에만 적용된다.
- 공유 링크: `?t=&m=&p=&i=[&r=]` (`shareQuery.ts`). 앱 시작 시 `window.location.search`를 읽어 유효하면 바로 결과를 보여준다.
- 차트는 Recharts. jsdom 테스트는 `src/setupTests.ts`의 `ResizeObserver` 스텁(320x260)에 의존한다.
- 이미지 저장은 `html-to-image`의 `toPng`로 결과 카드(`ResultCard`의 ref)를 `etf-result.png`로 내려받는다.
