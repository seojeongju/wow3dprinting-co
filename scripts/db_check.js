const { execSync } = require('child_process');

function getCount() {
  console.log('📊 Cloudflare D1 기사 현황 확인 중...');
  try {
    const result = execSync('npx wrangler d1 execute wow3dprinting-co-db --remote --command="SELECT c.name, count(a.id) as count FROM categories c LEFT JOIN articles a ON c.id = a.category_id GROUP BY c.id;"', { encoding: 'utf-8' });
    console.log('\n✅ 카테고리별 기사 통계:');
    console.log(result);
  } catch (error) {
    console.error('❌ D1 데이터 조회 실패. wrangler 로그인을 확인하세요.');
    console.error(error.message);
  }
}

getCount();
