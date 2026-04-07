# Trader Frontend

`trader-frontend`는 `codex-trader` 백엔드의 API와 SSE 스트림을 사용하는 운영 프론트엔드입니다.

## 스택

- React
- Vite
- TypeScript
- pnpm
- React Router
- Recharts

## 저장소

- 프론트: `C:\project\trader\trader-frontend`
- 백엔드: `C:\project\trader\codex-trader`

## 실행

### 1. 백엔드 먼저 실행

```powershell
cd C:\project\trader\codex-trader
python run_backend.py
```

### 2. 프론트 실행

```powershell
cd C:\project\trader\trader-frontend
corepack pnpm install
corepack pnpm dev
```

## 빌드

```powershell
cd C:\project\trader\trader-frontend
corepack pnpm build
```

## 현재 페이지

- 대시보드
- 주시 종목
- 주문 상태
- 일일 손익
- 런타임
- 설정

## 현재 기능

- 계정 모드 표시
  - 모의투자 / 실계좌
- 런타임 상태 표시
  - 대기 중 / 진행 중 / 오류
- 자동 새로고침 on/off
- SSE 기반 실시간 동기화 + 폴링 fallback
- 웹소켓 상태 표시
- 주시 종목 + 활성 진입 플랜 통합 화면
- 주문 상태 / 진입 보류 사유 / 사유별 집계
- 일일 손익 조회
- 런타임 시작/중지 토글
- 시작 전 점검 결과 표시
- 설정 저장 / 저장 후 즉시 적용

## 설정 화면에서 관리하는 항목

- 계정 모드
- 판단 방식
- 루프 프로필
- 미체결 주문 처리 정책
- 미체결 자동 취소 대기 시간
- 일일 손실 한도 사용 여부
- 일일 손실 한도(%)
- 반복 간격
- 반복 횟수
- 장 종료 시각
- 시세 갱신 방식
- 스캔 시장
- 후보 수
- 워치리스트 크기
- 뉴스 소스
- 종목당 반영 기사 수

## 대시보드에서 보는 정보

- 총 평가자산
- 보유 현금
- 보유 종목
- 오늘 매수 / 오늘 매도
- 자산 흐름 차트
- 주시 종목 미리보기
- 활성 진입 플랜 미리보기
- 보유 종목
- 웹소켓 상태

## 백엔드 연동 API

- `/api/health`
- `/api/dashboard/summary`
- `/api/dashboard/positions`
- `/api/dashboard/orders`
- `/api/dashboard/daily-performance`
- `/api/dashboard/watchlist`
- `/api/dashboard/entry-plans`
- `/api/dashboard/skip-reasons`
- `/api/dashboard/websocket-status`
- `/api/stream/dashboard`
- `/api/runtime/status`
- `/api/runtime/start`
- `/api/runtime/stop`
- `/api/runtime/settings`

## 주요 파일

- `C:\project\trader\trader-frontend\src\app\App.tsx`
- `C:\project\trader\trader-frontend\src\app\AppLayout.tsx`
- `C:\project\trader\trader-frontend\src\app\TradingWorkspaceContext.tsx`
- `C:\project\trader\trader-frontend\src\pages\DashboardPage.tsx`
- `C:\project\trader\trader-frontend\src\pages\WatchlistPage.tsx`
- `C:\project\trader\trader-frontend\src\pages\OrdersPage.tsx`
- `C:\project\trader\trader-frontend\src\pages\PerformancePage.tsx`
- `C:\project\trader\trader-frontend\src\pages\RuntimePage.tsx`
- `C:\project\trader\trader-frontend\src\pages\SettingsPage.tsx`
- `C:\project\trader\trader-frontend\src\api.ts`
- `C:\project\trader\trader-frontend\src\types.ts`
- `C:\project\trader\trader-frontend\src\utils\formatters.ts`
- `C:\project\trader\trader-frontend\src\styles\base.css`
- `C:\project\trader\trader-frontend\src\styles\layout.css`
- `C:\project\trader\trader-frontend\src\styles\common.css`
- `C:\project\trader\trader-frontend\src\styles\pages.css`
- `C:\project\trader\trader-frontend\src\styles\responsive.css`

## 확인 방법

```powershell
cd C:\project\trader\trader-frontend
corepack pnpm build
```
