# 운영 전환 및 안정화 가이드

## 전환 D-1 체크리스트
- D1 스키마/시드 적용 완료
- R2 버킷 업로드 권한 및 CORS 확인
- `ADMIN_TOKEN` 시크릿 등록 완료
- 초기 이관 및 `qa-report.json` 확인
- `redirects.sql` 적용 완료

## 전환 당일 체크리스트
- 배포 직후 `/api/health` 200 확인
- 메인/기사/정적페이지/검색 동작 점검
- 우선순위 URL(상위 트래픽) 301 동작 점검
- 이미지 응답 코드(200) 및 캐시 헤더 확인

## 자동 배포(권장)
사전 조건:
- `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID` 설정
- `apps/web/wrangler.toml`의 `database_id` 실값 반영
- `packages/importer/output/load-d1.sql` 생성 완료

```bash
cd packages/importer
npm run deploy-all -- --db-name wow3dprinting_news --bucket wow3dprinting-media --project-name wow3dprinting-news
```

옵션:
- `--skip-upload` : R2 업로드 생략
- `--health-url https://<your-domain>/api/health` : 커스텀 헬스체크 URL

## 모니터링
- Cloudflare Logs에서 5xx 비율 모니터링
- `api/health` 외부 ping(1분 주기) 구성
- 주간 리포트: 요청 수, 오류율, 응답시간 p95

## 장애 대응
1) 장애 감지: health check 실패 또는 5xx 급증  
2) 1차 조치: 마지막 정상 배포로 롤백  
3) 2차 조치: D1 쿼리/바인딩/시크릿 확인  
4) 사후 조치: RCA 문서화 및 재발방지 태스크 등록

## 초기 2주 안정화 목표
- 치명적 장애 0건
- 301 누락 URL 1% 미만
- 이미지 누락 0.5% 미만
