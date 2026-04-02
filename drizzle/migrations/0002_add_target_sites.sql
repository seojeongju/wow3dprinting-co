-- 멀티 사이트 지원을 위한 게시 대상 사이트 컬럼 추가
-- 'times': 3D프린팅타임즈(wow3dprinting.co.kr)에만 게시
-- 'wow3d': 와우3D프린팅타임즈(wow3dprinting.com)에만 게시
-- 'both': 두 사이트 모두 동시 게시 (기본값)
ALTER TABLE articles ADD COLUMN target_sites TEXT NOT NULL DEFAULT 'both';

-- 기존 등록된 기사는 모두 양쪽 사이트에 표시
UPDATE articles SET target_sites = 'both' WHERE target_sites IS NULL;
