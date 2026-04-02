# Trader Frontend

`trader-frontend`는 `codex-trader` 백엔드 API를 바라보는 운영용 프론트엔드입니다.

## 스택

- React
- Vite
- TypeScript
- pnpm
- React Router
- Recharts

## 실행

백엔드가 먼저 떠 있어야 합니다.

### 1. 백엔드 실행

```powershell
cd C:\project\trader\codex-trader
python -m cli_trader.dashboard_server --host 127.0.0.1 --port 8765
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
- 거래 기록
- 런타임
- 설정

## 현재 특징

- 자동 새로고침 켜기/끄기
- 갱신 주기 선택
- 런타임 시작/중지
- 설정 저장
- 설정 저장 후 즉시 적용
- 오프라인 상태 배너 표시

## 주의

- 현재 이 폴더는 별도 Git 저장소가 아닙니다.
- Git 커밋은 기본적으로 `C:\project\trader\codex-trader` 저장소에서만 가능합니다.
- 프론트도 버전 관리하려면
  - 별도 Git 저장소로 초기화하거나
  - `codex-trader` 내부로 옮겨 같은 저장소에서 관리해야 합니다.
