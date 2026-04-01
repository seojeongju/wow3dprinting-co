import { format } from 'date-fns';

export const runtime = 'edge';

export default function PrivacyPolicyPage() {
  const lastUpdated = "2026년 4월 1일";

  return (
    <div className="container mx-auto px-4 py-20 md:px-6 max-w-4xl min-h-screen">
      <header className="mb-16 border-b pb-10">
        <h1 className="text-4xl font-black tracking-tighter mb-4 italic">개인정보처리방침</h1>
        <p className="text-sm text-muted-foreground font-medium">최종 수정일: {lastUpdated}</p>
      </header>

      <div className="prose prose-lg dark:prose-invert max-w-none text-muted-foreground leading-relaxed space-y-12">
        <section>
          <h2 className="text-xl font-bold text-foreground mb-4 border-l-4 border-primary pl-4">1. 총칙</h2>
          <p>
            '3D프린팅타임즈'(이하 "회사")는 이용자의 개인정보를 소중하게 생각하며, "개인정보보호법" 등 관련 법령을 준수하고 있습니다. 
            회사는 개인정보처리방침을 통하여 이용자가 제공하는 개인정보가 어떠한 용도와 방식으로 이용되고 있으며, 개인정보보호를 위해 어떠한 조치가 취해지고 있는지 알려드립니다.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-foreground mb-4 border-l-4 border-primary pl-4">2. 수집하는 개인정보 항목 및 수집방법</h2>
          <p>회사는 서비스 제공을 위해 아래와 같은 개인정보를 수집할 수 있습니다.</p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>관리자 서비스 이용 시:</strong> 성명, 이메일 주소, 접속 로그, 서비스 이용 기록 등</li>
            <li><strong>수집방법:</strong> 홈페이지(로그인), 생성된 로그 분석 도구 등</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-foreground mb-4 border-l-4 border-primary pl-4">3. 개인정보의 수집 및 이용목적</h2>
          <p>회사는 수집한 개인정보를 다음의 목적을 위해 활용합니다.</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>사이트 운영 관리 및 회원(관리자) 식별</li>
            <li>뉴스 기사 작성, 편집 및 배포 관리</li>
            <li>기술적 오류 해결 및 서비스 개선 통계 분석</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-foreground mb-4 border-l-4 border-primary pl-4">4. 개인정보의 보유 및 이용기간</h2>
          <p>
            이용자의 개인정보는 원칙적으로 개인정보의 수집 및 이용목적이 달성되면 지체 없이 파기합니다. 
            단, 다음의 정보에 대해서는 아래의 이유로 명시한 기간 동안 보존합니다.
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>보존 항목:</strong> 접속 로그, 이메일 정보</li>
            <li><strong>보존 근거:</strong> 통신비밀보호법</li>
            <li><strong>보존 기간:</strong> 3개월</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-foreground mb-4 border-l-4 border-primary pl-4">5. 개인정보의 파기절차 및 방법</h2>
          <p>회사는 원칙적으로 개인정보 수집 및 이용목적이 달성된 후에는 해당 정보를 지체 없이 파기합니다. 파기절차 및 방법은 다음과 같습니다.</p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>파기절차:</strong> 목적 달성 후 별도의 DB로 옮겨져 관련 법령에 의한 정보보호 사유에 따라 일정 기간 저장된 후 파기됩니다.</li>
            <li><strong>파기방법:</strong> 전자적 파일형태로 저장된 개인정보는 기록을 재생할 수 없는 기술적 방법을 사용하여 삭제합니다.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-foreground mb-4 border-l-4 border-primary pl-4">6. 개인정보 보호책임자</h2>
          <p>회사는 이용자의 개인정보를 보호하고 개인정보와 관련한 불만을 처리하기 위하여 아래와 같이 관련 부서 및 개인정보 보호책임자를 지정하고 있습니다.</p>
          <div className="bg-muted p-6 rounded-2xl border-l-4 border-primary">
            <p className="font-bold text-foreground mb-2">개인정보 보호책임자</p>
            <ul className="text-sm space-y-1">
              <li>성명: 김순희</li>
              <li>직책: 편집인 / 청소년보호책임자</li>
              <li>이메일: 3dcookiehd@naver.com</li>
            </ul>
          </div>
        </section>
      </div>
      
      <footer className="mt-20 pt-10 border-t text-center text-xs text-muted-foreground">
        본 방침은 2026년 4월 1일부터 시행됩니다.
      </footer>
    </div>
  );
}
