# DoTask

할일 관리 + 크루(그룹) 생산성 공유 플랫폼. TodoMate 앱에서 영감을 받은 웹 서비스입니다.

## 기술 스택

| 레이어 | 기술 |
|---|---|
| 프론트엔드 | Next.js 14 (App Router), TypeScript, Tailwind CSS, Zustand, TanStack Query v5, Socket.io-client |
| 백엔드 | NestJS, TypeScript, Prisma ORM |
| 데이터베이스 | PostgreSQL 16 |
| 캐시 / 실시간 | Redis 7, Socket.io |
| 큐 | BullMQ + Redis |
| 파일 저장 | AWS S3 |
| 인증 | JWT (Access 15분 / Refresh 7일 HttpOnly 쿠키), Google OAuth |
| 배포 | Oracle Cloud Infrastructure, Docker, Nginx |
| 모노레포 | pnpm workspaces |

## 프로젝트 구조

```
DoTask/
├── apps/
│   ├── api/                # NestJS 백엔드
│   │   ├── src/
│   │   │   ├── auth/       # JWT, OAuth, 로컬 인증
│   │   │   ├── users/      # 유저 프로필, 아바타
│   │   │   ├── todos/      # 할일 CRUD
│   │   │   ├── todo-categories/
│   │   │   ├── calendar/   # 월간 달력 집계
│   │   │   ├── pomodoro-settings/ # 개인 포모도로 설정
│   │   │   ├── crews/      # 크루 생성/참여/관리
│   │   │   ├── channels/   # 채팅 채널
│   │   │   ├── chat/       # 실시간 채팅 (Gateway + REST)
│   │   │   ├── posts/      # 크루 게시판
│   │   │   ├── comments/   # 댓글 (할일/게시글)
│   │   │   ├── reactions/  # 좋아요/싫어요
│   │   │   ├── pomodoro/   # 크루 공유 포모도로 (Redis + Socket.io)
│   │   │   ├── notifications/ # 알림 (BullMQ)
│   │   │   ├── upload/     # S3 파일 업로드
│   │   │   ├── admin/      # 관리자 API
│   │   │   └── redis/      # Redis 전역 프로바이더
│   │   └── prisma/         # 스키마 & 마이그레이션
│   └── web/                # Next.js 프론트엔드
│       └── src/
│           ├── app/
│           │   ├── (auth)/  # 로그인, 회원가입
│           │   └── (app)/   # 대시보드, 크루, 알림, 설정, 관리자
│           ├── components/  # 재사용 UI 컴포넌트
│           ├── store/       # Zustand 스토어
│           └── lib/         # api axios, socket.io, utils
├── packages/
│   └── types/              # 공유 TypeScript 타입
├── nginx/                  # Nginx 설정 (프로덕션)
├── docker-compose.yml      # 로컬 개발용
└── docker-compose.prod.yml # 프로덕션 배포용
```

## 주요 기능

- **할일 관리**: 날짜별 할일, 카테고리, 완료 토글, 월간 달력 뷰
- **개인 포모도로**: Zustand 클라이언트 타이머, DB 설정 동기화
- **크루**: PUBLIC / PASSWORD / PRIVATE 가시성, 초대 코드
- **실시간 채팅**: 텍스트, 이미지, 파일 전송, 수정/삭제/신고
- **크루 게시판**: 게시글, 댓글, 좋아요/싫어요, 핀 고정
- **크루 공유 포모도로**: Redis 서버 권위적 타이머, Socket.io 브로드캐스트
- **알림**: BullMQ 비동기 처리
- **관리자**: 유저/크루/게시글/신고 관리

## 로컬 개발 시작

### 사전 요구사항

- Node.js 20+
- pnpm 8+
- Docker & Docker Compose

### 1. 환경 변수 설정

```bash
cp .env.example .env
# .env 파일을 편집하여 값 입력
```

### 2. 인프라 실행 (PostgreSQL + Redis)

```bash
docker-compose up postgres redis -d
```

### 3. 의존성 설치

```bash
pnpm install
```

### 4. DB 마이그레이션

```bash
pnpm --filter api db:migrate
pnpm --filter api db:generate
```

### 5. 개발 서버 실행

```bash
# 루트에서 API + Web 동시 실행
pnpm dev

# 또는 개별 실행
pnpm --filter api dev   # http://localhost:4200
pnpm --filter web dev   # http://localhost:3000
```

## 프로덕션 배포 (OCI)

### Docker 이미지 빌드

```bash
docker build -t dotask-api ./apps/api
docker build -t dotask-web ./apps/web
```

### OCI 서버에서 실행

```bash
# .env.prod 파일 준비 후
docker-compose -f docker-compose.prod.yml up -d
```

### DB 마이그레이션 (프로덕션)

```bash
docker-compose -f docker-compose.prod.yml exec api npx prisma migrate deploy
```

### SSL 인증서

Nginx 설정에서 인증서 경로를 지정합니다. Let's Encrypt 사용 시:

```bash
certbot certonly --standalone -d yourdomain.com
# /etc/letsencrypt/live/yourdomain.com/ 경로의 인증서를 nginx/certs/에 복사
```

## 환경 변수

| 변수 | 설명 |
|---|---|
| `DATABASE_URL` | PostgreSQL 연결 문자열 |
| `REDIS_HOST` / `REDIS_PORT` / `REDIS_PASSWORD` | Redis 연결 정보 |
| `JWT_SECRET` | JWT 서명 시크릿 |
| `JWT_EXPIRES_IN` | Access Token 만료 (e.g. `15m`) |
| `JWT_REFRESH_EXPIRES_IN` | Refresh Token 만료 (e.g. `7d`) |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Google OAuth |
| `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` | AWS 자격증명 |
| `AWS_S3_BUCKET` / `AWS_S3_REGION` | S3 버킷 설정 |
| `API_PORT` | API 서버 포트 (기본 4200) |
| `FRONTEND_URL` | CORS 허용 Origin |
| `NEXT_PUBLIC_API_URL` | 프론트에서 API 호출 URL |

## API 주요 엔드포인트

| 메서드 | 경로 | 설명 |
|---|---|---|
| POST | `/auth/register` | 회원가입 |
| POST | `/auth/login` | 로그인 |
| POST | `/auth/refresh` | 토큰 갱신 |
| GET | `/todos?date=YYYY-MM-DD` | 날짜별 할일 |
| GET | `/todos/calendar?year=&month=` | 월간 달력 |
| GET | `/crews?q=` | 크루 탐색 |
| POST | `/crews` | 크루 생성 |
| POST | `/crews/:id/join` | 크루 참여 |
| GET | `/channels/:id/messages` | 채팅 메시지 (cursor) |
| POST | `/upload/chat` | 파일/이미지 업로드 |
| GET | `/notifications` | 알림 목록 |
| GET | `/admin/stats` | 관리자 통계 |

## 실시간 소켓 이벤트

### 채팅 (ChatGateway)
- `chat:join` / `chat:leave` — 채널 입/퇴장
- `chat:send` → `chat:message` — 메시지 발송/수신
- `chat:edit` → `chat:edited`
- `chat:delete` → `chat:deleted`

### 크루 포모도로 (PomodoroGateway)
- `pomo:join` — 세션 참여 및 현재 상태 수신
- `pomo:start` / `pomo:pause` / `pomo:resume` / `pomo:end`
- `pomo:state` — 상태 브로드캐스트

## 디자인 원칙

- 흰 배경, 클린한 레이아웃
- 반응형: 모바일 하단 탭 / 태블릿 아이콘 사이드바 / 데스크톱 전체 사이드바
- Primary 색상: `#7c6ff7` (보라)
- 폰트: Pretendard
