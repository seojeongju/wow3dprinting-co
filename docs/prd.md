# Cloudflare Pages 기반 언론사 사이트 PRD

이 문서는 승인된 계획을 바탕으로 실제 구현에 필요한 요구사항과 산출물을 기술한다.

## 범위
- 기존 사이트 전체 이관(기사/정적 페이지/이미지)
- Cloudflare Pages + D1 + R2 기반 배포
- 1차 운영 모델: 초기 이관 후 CMS 수동 운영

## 핵심 산출물
- D1 스키마: `packages/db/schema.sql`
- 관리자/공개 API: `apps/web/functions/api/*`
- 이관 파이프라인: `packages/importer/src/*`
- 운영 문서: `docs/migration-runbook.md`, `docs/operations.md`

## 승인 기준
- 기사 CRUD와 페이지 수정 기능이 동작
- 미디어 업로드 후 R2 URL이 본문에 삽입 가능
- 이관 스크립트가 NDJSON 및 redirect 맵을 생성
- QA 리포트(건수/누락/오류)가 생성
