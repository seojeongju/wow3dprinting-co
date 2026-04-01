# 다음 세션 이어하기 (핸드오프)

**저장소 루트**: `d:\Program_DEV\wow3dprinting-co` (이 경로에서 터미널·Cursor 작업)

이 문서는 작업을 중단했다가 **동일 환경에서 바로 재개**할 때 필요한 상태·명령·남은 일을 모아 둔다.

## 현재까지 완료된 것

- **D1** `wow3dprinting_news` 생성 및 스키마/시드 적용(원격). `database_id`는 `apps/web/wrangler.toml`에 반영됨.
- **R2** 버킷 `wow3dprinting-media` 생성 및 이관 이미지 원격 업로드(`npm run upload-r2 -- --execute`).
- **기사 slug 충돌 방지**: `packages/importer/src/import.mjs`의 `uniqueSlugForUrl()` — 동일 `<title>` 페이지가 많아도 `slug`가 덮어쓰이지 않음.
- **원격 D1 적재**: `packages/importer/src/apply-d1-remote.mjs` — 큰 본문은 청크 `UPDATE ... ||` 방식, 배치 파일 크기 상한으로 `SQLITE_TOOBIG` 회피. `BEGIN/COMMIT` 미사용.
- **Pages** 프로젝트 `wow3dprinting-news` 생성, 배포 성공.
- **Functions 라우트**: `functions/media/[[path]].ts` (Pages는 `[...param]` 형식 미지원).
- **`wrangler.toml`**: Pages 검증 오류를 피하기 위해 `[observability]` 제거됨.

## 배포·엔드포인트 (참고)

- 프로젝트 기본 도메인: `https://wow3dprinting-news.pages.dev`
- 마지막 배포 예시(프리뷰 형태 URL은 배포마다 달라질 수 있음): 배포 로그에 표시된 `*.wow3dprinting-news.pages.dev`
- 헬스: `/api/health` (D1 `SELECT 1` 성공 시 `ok: true`)

## 데이터 건수 (마지막 확인 기준)

원격 D1에서 대략: 기사 12, 페이지 9, 미디어 19(동일 이미지 URL은 `r2_key` 유니크로 합쳐짐), 리다이렉트 21.  
이관 범위를 넓히면 `import.mjs`의 크롤 한도·분류 로직을 조정해야 한다.

## 다음 세션에서 할 일 (우선순위)

1. **`ADMIN_TOKEN` 설정** (CMS/API 보호)  
   ```bash
   cd apps/web
   wrangler secret put ADMIN_TOKEN
   ```
2. **프로덕션 배포 확인**: 대시보드에서 최신 프로덕션 URL·바인딩(D1 `DB`, R2 `MEDIA_BUCKET`)이 배포에 붙었는지 확인.
3. **수동 검수**: 홈, `/news/{slug}` 기사, `/media/imported/...` 이미지, 정적 페이지, 샘플 301 리다이렉트.
4. **커스텀 도메인** 연결 후 `sitemap.xml` / Search Console 재제출.
5. **선택**: `packages/importer`에 스모크 테스트 스크립트(주요 URL HEAD/GET) 추가.

## 자주 쓰는 명령 (워크스페이스 루트 기준)

```bash
# 이관 산출물 전체 재생성
cd packages/importer
npm run run-all

# 원격 D1 전체 재적재(기존 이관 행 지우고 다시 넣음)
node src/apply-d1-remote.mjs --fresh

# R2 재업로드
npm run upload-r2 -- --bucket wow3dprinting-media --execute

# Pages 배포
cd ../../apps/web
wrangler pages deploy public --project-name wow3dprinting-news
```

## 관련 파일

| 목적 | 경로 |
|------|------|
| Pages 설정·바인딩 | `apps/web/wrangler.toml` |
| D1 스키마 | `packages/db/schema.sql` |
| 이관 파이프라인 | `packages/importer/src/import.mjs`, `apply-d1-remote.mjs` |
| 운영 절차 | `docs/migration-runbook.md`, `docs/operations.md`, `docs/cloudflare-setup.md` |

## 알려진 제한·메모

- `deploy-all.mjs`는 `CLOUDFLARE_API_TOKEN` / `CLOUDFLARE_ACCOUNT_ID`를 요구한다. OAuth 로그인만 쓰는 경우에는 수동으로 `wrangler` 명령을 실행하는 편이 낫다.
- 원격 D1에 단일 대용량 `load-d1.sql` 한 방 적재는 `SQLITE_TOOBIG` 가능 → **`apply-d1-remote` 사용**.
- `seed.sql`의 관리자 `password_hash`는 운영 전 실제 해시로 교체하거나 CMS 토큰만 사용할지 결정할 것.
