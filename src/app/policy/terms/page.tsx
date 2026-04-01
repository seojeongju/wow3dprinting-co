export const runtime = 'edge';

export default function TermsOfServicePage() {
  const lastUpdated = "2026년 4월 1일";

  return (
    <div className="container mx-auto px-4 py-20 md:px-6 max-w-4xl min-h-screen">
      <header className="mb-16 border-b pb-10">
        <h1 className="text-4xl font-black tracking-tighter mb-4 italic">서비스 이용약관</h1>
        <p className="text-sm text-muted-foreground font-medium">최종 수정일: {lastUpdated}</p>
      </header>

      <div className="prose prose-lg dark:prose-invert max-w-none text-muted-foreground leading-relaxed space-y-12">
        <section>
          <h2 className="text-xl font-bold text-foreground mb-4 border-l-4 border-primary pl-4">제1조 (목적)</h2>
          <p>
            본 약관은 3D프린팅타임즈(이하 "사")가 제공하는 뉴스 미디어 서비스 및 관련 제반 서비스(이하 "서비스")를 이용함에 있어, 회사와 이용자의 권리, 의무 및 책임사항을 규정함을 목적으로 합니다.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-foreground mb-4 border-l-4 border-primary pl-4">제2조 (회원의 의무)</h2>
          <p>이용자는 다음 각 호의 행위를 하여서는 안 됩니다.</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>관리자 권한의 부정 사용 및 타인 계정 도용</li>
            <li>회사가 게시한 기사의 무단 복제, 배포 및 상업적 목적 활용</li>
            <li>사이트에 타인의 명예를 훼손하거나 저작권 등의 권리를 침해하는 행위</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-foreground mb-4 border-l-4 border-primary pl-4">제3조 (서비스의 내용 및 변경)</h2>
          <p>
            회사는 3D프린팅 및 최신 기술에 관한 뉴스, 동향 기사, 분석 보고서를 제공합니다. 서비스는 회사의 운영상, 기술상의 필요에 따라 변경되거나 중단될 수 있으며, 중대한 사항은 공지사항을 통해 사전에 고지합니다.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-foreground mb-4 border-l-4 border-primary pl-4">제4조 (저작권의 귀속 및 이용제한)</h2>
          <p>회사가 작성한 저작물에 대한 저작권 기타 지적재산권은 회사에 귀속됩니다. 이용자는 서비스를 이용함으로써 얻은 정보를 회사의 사전 승낙 없이 복제, 송신, 출판, 배포, 방송 기타 방법에 의하여 영리 목적으로 이용하거나 제3자에게 이용하게 하여서는 안 됩니다.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-foreground mb-4 border-l-4 border-primary pl-4">제5조 (게시물의 관리)</h2>
          <p>
            회사는 이용자가 게시하거나 전달하는 서비스 내의 게시물이 다음 각 호에 해당한다고 판단되는 경우 사전 통지 없이 삭제할 수 있습니다.
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>제3자의 저작권 등 기타 권리를 침해하는 경우</li>
            <li>범죄적 행위와 결합하거나 미풍양속을 저해하는 경우</li>
            <li>스팸성 광고물이나 부적절한 내용을 포함하는 경우</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-foreground mb-4 border-l-4 border-primary pl-4">제6조 (재판권 및 준거법)</h2>
          <p>본 약관과 관련하여 발생하는 분쟁에 대해서는 대한민국 법령을 준거법으로 하며, 회사 소재지 관할 법원을 합의 관할 법원으로 합니다.</p>
        </section>
      </div>
      
      <footer className="mt-20 pt-10 border-t text-center text-xs text-muted-foreground">
        본 이용약관은 2026년 4월 1일부터 효력이 발생합니다.
      </footer>
    </div>
  );
}
