# Trader Frontend

`trader-frontend`는 `codex-trader` 백엔드 API를 사용하는 운영용 프론트엔드입니다.

## 스택

- React
- Vite
- TypeScript
- pnpm
- React Router
- Recharts

## 저장소

- 프론트 저장소: `C:\project\trader\trader-frontend`
- 원격 저장소: [codex-trader-ui](https://github.com/sekwan5/codex-trader-ui.git)

## 실행

백엔드가 먼저 떠 있어야 합니다.

### 1. 백엔드 실행

```powershell
cd C:\project\trader\codex-trader
python run_backend.py
```

### 2. 프론트 실행

`pnpm`이 설치돼 있으면:

```powershell
cd C:\project\trader\trader-frontend
pnpm install
pnpm dev
```

`pnpm`이 설치돼 있지 않으면:

```powershell
cd C:\project\trader\trader-frontend
corepack pnpm install
corepack pnpm dev
```

## 빌드

```powershell
cd C:\project\trader\trader-frontend
pnpm build
```

또는

```powershell
corepack pnpm build
```

## 현재 페이지

- 대시보드
- 거래 기록
- 런타임
- 설정

## 현재 기능

- 자동 새로고침 켜기/끄기
- 갱신 주기 선택
- 런타임 시작/중지
- 설정 저장
- 설정 저장 후 즉시 적용
- 오프라인 상태 배너 표시
- 네트워크 상태 표시

## 백엔드 의존 API

- `/api/health`
- `/api/dashboard/summary`
- `/api/dashboard/positions`
- `/api/dashboard/trades`
- `/api/dashboard/cycles`
- `/api/dashboard/equity`
- `/api/runtime/status`
- `/api/runtime/start`
- `/api/runtime/stop`
- `/api/runtime/settings`
