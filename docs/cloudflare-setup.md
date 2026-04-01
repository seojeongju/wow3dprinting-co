# Cloudflare 인프라 설정 가이드

## 1. Pages 프로젝트 생성
대시보드에서 생성하거나 CLI로 생성할 수 있다.

```bash
wrangler pages project create wow3dprinting-news --production-branch main --compatibility-date=2026-03-31
```

- Pages용 `wrangler.toml`에는 **`[observability]` 블록을 넣지 않는다**(배포 검증 오류).
- D1/R2 바인딩은 `apps/web/wrangler.toml`의 `[[d1_databases]]`, `[[r2_buckets]]`를 배포 시 함께 반영한다.

## 2. D1 생성 및 마이그레이션
```bash
wrangler d1 create wow3dprinting_news
wrangler d1 execute wow3dprinting_news --file=../../packages/db/schema.sql
wrangler d1 execute wow3dprinting_news --file=../../packages/db/seed.sql
```

생성된 `database_id`를 `apps/web/wrangler.toml`에 반영한다.

## 3. R2 버킷 생성
```bash
wrangler r2 bucket create wow3dprinting-media
```

## 4. 시크릿/변수 설정
```bash
cd apps/web
wrangler secret put ADMIN_TOKEN
```

`wrangler.toml`의 `[vars]`에는 공개 가능한 환경 변수만 저장한다.

## 5. 배포
```bash
cd apps/web
wrangler pages deploy public --project-name wow3dprinting-news
```
