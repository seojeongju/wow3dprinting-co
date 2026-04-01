# wow3dprinting-cloudflare-news

**정식 작업 경로**: `d:\Program_DEV\wow3dprinting-co` — Cursor에서는 이 폴더를 열어 작업한다.

Cloudflare Pages + D1 + R2 기반 언론사 사이트 구축 템플릿이다.  
기존 `wow3dprinting.co.kr` 콘텐츠 이관과 CMS 운영을 포함한다.

## 디렉터리
- `apps/web`: Pages Functions + 정적 페이지 + API
- `packages/db`: D1 스키마/시드
- `packages/importer`: 기존 사이트 이관/QA 스크립트
- `docs`: 운영 문서

## 빠른 시작
1) D1/R2 생성 후 `apps/web/wrangler.toml` 값 반영  
2) 스키마 적용: `packages/db/schema.sql`, `packages/db/seed.sql`  
3) 이관 실행: `node packages/importer/src/import.mjs`  
4) QA 실행: `node packages/importer/src/qa-report.mjs`  
5) D1 적재 SQL 생성: `node packages/importer/src/build-d1-load-sql.mjs`  
6) D1 반영: `wrangler d1 execute wow3dprinting_news --file=packages/importer/output/load-d1.sql`  
7) Pages 배포: `wrangler pages deploy apps/web/public`
8) 자동 배포(선택): `cd packages/importer && npm run deploy-all -- --db-name wow3dprinting_news --project-name wow3dprinting-news`

## 이어서 작업하기
- 상태·남은 작업·명령 모음: [docs/handoff-next-session.md](docs/handoff-next-session.md)

## 참고
- 계획 문서는 별도 관리되며 수정하지 않는다.
- 실제 운영 시 인증은 Access/JWT 기반으로 강화 권장.
- 원격 D1 대량 적재는 `load-d1.sql` 한 파일보다 `cd packages/importer && npm run apply-d1-remote -- --fresh` 권장.
- Pages 배포: `cd apps/web && wrangler pages deploy public --project-name wow3dprinting-news`
