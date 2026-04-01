# 마이그레이션 실행/검증 Runbook

## 0) 사전 준비
- Cloudflare D1/R2 바인딩 완료
- `packages/db/schema.sql`, `packages/db/seed.sql` 적용 완료
- 운영 관리자 토큰 발급 완료

### Creatorlink(모두) 등 JS로 목록을 그리는 사이트
정적 HTML만 크롤하면 `/news` 같은 목록 안의 **개별 글 URL이 링크로 잡히지 않을 수 있다.** 이 경우:

1. 브라우저에서 구 사이트 `/news` 등을 연 뒤, 개별 글을 연 상태의 **전체 URL**을 복사한다.
2. `packages/importer/url-seed.txt`를 만들고 한 줄에 URL 하나씩 넣는다(주석은 `#`으로 시작).
3. `node packages/importer/src/import.mjs`를 다시 실행한 뒤 R2 업로드·`apply-d1-remote`를 반복한다.

`robots.txt`의 `Sitemap:`(`user-sitemap`) URL은 자동으로 시드에 합쳐진다. 내부 링크는 **www / 비-www** 를 동일 사이트로 처리한다.

## 1) 콘텐츠 수집
```bash
node packages/importer/src/import.mjs
```

생성 파일:
- `packages/importer/output/articles.ndjson`
- `packages/importer/output/pages.ndjson`
- `packages/importer/output/media-assets.ndjson`
- `packages/importer/output/media/*` (다운로드된 원본 이미지)
- `packages/importer/output/redirects.json`
- `packages/importer/output/import-logs.json`

## 2) 1차 품질 점검
```bash
node packages/importer/src/qa-report.mjs
```

결과 파일:
- `packages/importer/output/qa-report.json`

## 3) D1 적재
NDJSON 결과를 기준으로 배치 SQL을 생성해 D1에 반영한다.

```bash
node packages/importer/src/build-d1-load-sql.mjs
```

원격 D1은 단일 SQL 파일이 커질 수 있어 `SQLITE_TOOBIG`가 날 수 있다. 이 경우 문장 단위 적재를 사용한다.

```bash
cd packages/importer
npm run apply-d1-remote -- --db-name wow3dprinting_news
```

(로컬 개발 DB만 쓸 때는 `--remote` 없이 `wrangler d1 execute`로 `load-d1.sql`을 적용할 수 있다.)

필요 시 redirect만 별도 재반영:

```bash
node packages/importer/src/build-redirect-sql.mjs
wrangler d1 execute wow3dprinting_news --file=packages/importer/output/redirects.sql
```

## 3-1) R2 이미지 업로드
본문 이미지 URL을 `/media/imported/...`로 치환하므로, 먼저 R2에 업로드한다.

```bash
node packages/importer/src/build-r2-upload-commands.mjs
```

생성된 `packages/importer/output/r2-upload-commands.ps1`를 실행해 대량 업로드한다.

또는 Node 실행 방식(권장):

```bash
cd packages/importer
npm run upload-r2 -- --bucket wow3dprinting-media --execute
```

- `--execute` 미지정 시 dry-run으로 명령만 출력
- `--limit 10`으로 샘플 업로드 가능

## 4) SEO 전환
- `redirects` 테이블 적재
- sitemap.xml/robots.txt 재생성
- Search Console 재제출

```bash
node packages/importer/src/build-seo-files.mjs
```

생성 위치:
- `packages/importer/output/sitemap.xml`
- `packages/importer/output/robots.txt`
- `apps/web/public/sitemap.xml`
- `apps/web/public/robots.txt`

## 5) 검수 체크리스트
- 제목/본문/날짜 정확도
- 본문 이미지 표시 및 깨짐 여부
- 기존 주요 URL 301 정상 동작
- 카테고리/검색 페이지 노출

## 6) 원클릭 실행(로컬)
```bash
cd packages/importer
npm run run-all
```
