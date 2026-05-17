import { setRequestLocale } from "next-intl/server";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props) {
  await params;
  return {
    title: "개인정보처리방침 — 설기옥",
    description: "설기옥 선릉 본점 개인정보처리방침을 안내드립니다.",
  };
}

export default async function PrivacyPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="min-h-screen bg-cream">
      {/* 헤더 */}
      <div className="bg-dark text-cream py-16 text-center relative overflow-hidden">
        <div className="absolute top-4 left-4 w-8 h-8 border-t-2 border-l-2 border-gold/60" />
        <div className="absolute top-4 right-4 w-8 h-8 border-t-2 border-r-2 border-gold/60" />
        <div className="absolute bottom-4 left-4 w-8 h-8 border-b-2 border-l-2 border-gold/60" />
        <div className="absolute bottom-4 right-4 w-8 h-8 border-b-2 border-r-2 border-gold/60" />
        <p className="text-gold text-xs tracking-[0.3em] uppercase mb-3">SEOLGIOK</p>
        <h1 className="font-serif text-4xl font-bold text-cream">개인정보처리방침</h1>
        <div className="w-12 h-px bg-gold mx-auto mt-6" />
      </div>

      {/* 본문 */}
      <div className="max-w-3xl mx-auto px-6 py-16">

        <section>
          <h2 className="font-serif text-xl font-bold text-dark mb-3 mt-0">제1조 (수집하는 개인정보 항목)</h2>
          <div className="w-8 h-px bg-gold mb-4" />
          <div className="text-gray-600 text-sm leading-relaxed space-y-2">
            <p>회사는 서비스 제공을 위해 최소한의 개인정보를 수집합니다.</p>
            <p className="pl-4">• 필수 항목: 아이디(이메일 주소), 비밀번호, 이름</p>
            <p>서비스 이용 과정에서 IP 주소, 쿠키, 서비스 이용 기록 등이 자동으로 생성·수집될 수 있습니다.</p>
          </div>
        </section>

        <section>
          <h2 className="font-serif text-xl font-bold text-dark mb-3 mt-10">제2조 (개인정보의 수집 목적)</h2>
          <div className="w-8 h-px bg-gold mb-4" />
          <div className="text-gray-600 text-sm leading-relaxed space-y-2">
            <p>수집한 개인정보는 다음의 목적으로만 이용합니다.</p>
            <p className="pl-4">• 회원 가입 및 회원 관리 (본인 확인, 서비스 이용 자격 확인)</p>
            <p className="pl-4">• 서비스 제공 및 운영 (예약, 주문 내역 관리)</p>
            <p className="pl-4">• 공지사항 전달 및 고객 문의 응대</p>
          </div>
        </section>

        <section>
          <h2 className="font-serif text-xl font-bold text-dark mb-3 mt-10">제3조 (개인정보의 보유 및 이용 기간)</h2>
          <div className="w-8 h-px bg-gold mb-4" />
          <div className="text-gray-600 text-sm leading-relaxed space-y-2">
            <p>
              개인정보는 수집·이용 목적이 달성된 후 지체 없이 파기합니다.
              회원 탈퇴 시 해당 회원의 개인정보는 즉시 삭제됩니다.
            </p>
            <p>
              단, 관계 법령에 의해 보존이 필요한 경우 해당 법령에서 정한 기간 동안 보관합니다.
            </p>
            <p className="pl-4">• 전자상거래 등에서의 소비자보호에 관한 법률: 계약·청약철회 기록 5년, 대금결제 기록 5년</p>
          </div>
        </section>

        <section>
          <h2 className="font-serif text-xl font-bold text-dark mb-3 mt-10">제4조 (개인정보의 제3자 제공)</h2>
          <div className="w-8 h-px bg-gold mb-4" />
          <div className="text-gray-600 text-sm leading-relaxed space-y-2">
            <p>
              회사는 이용자의 개인정보를 제3자에게 제공하지 않습니다.
              다만, 이용자가 사전에 동의한 경우 또는 법령에 의해 요구되는 경우는 예외로 합니다.
            </p>
          </div>
        </section>

        <section>
          <h2 className="font-serif text-xl font-bold text-dark mb-3 mt-10">제5조 (개인정보의 파기)</h2>
          <div className="w-8 h-px bg-gold mb-4" />
          <div className="text-gray-600 text-sm leading-relaxed space-y-2">
            <p>
              개인정보 보유 기간이 경과하거나 처리 목적이 달성된 경우, 개인정보를 지체 없이 파기합니다.
            </p>
            <p className="pl-4">• 전자적 파일 형태: 복원이 불가능한 방법으로 영구 삭제</p>
            <p className="pl-4">• 종이 문서 형태: 분쇄 또는 소각</p>
          </div>
        </section>

        <section>
          <h2 className="font-serif text-xl font-bold text-dark mb-3 mt-10">제6조 (이용자의 권리)</h2>
          <div className="w-8 h-px bg-gold mb-4" />
          <div className="text-gray-600 text-sm leading-relaxed space-y-2">
            <p>이용자는 언제든지 다음의 권리를 행사할 수 있습니다.</p>
            <p className="pl-4">• 개인정보 열람 요청</p>
            <p className="pl-4">• 오류 등이 있을 경우 정정 요청</p>
            <p className="pl-4">• 삭제 요청</p>
            <p className="pl-4">• 처리 정지 요청</p>
            <p>위 권리 행사는 아래 개인정보 보호책임자에게 이메일 또는 전화로 연락하시면 처리해 드립니다.</p>
          </div>
        </section>

        <section>
          <h2 className="font-serif text-xl font-bold text-dark mb-3 mt-10">제7조 (개인정보 보호책임자)</h2>
          <div className="w-8 h-px bg-gold mb-4" />
          <div className="text-gray-600 text-sm leading-relaxed space-y-2">
            <p>개인정보 처리에 관한 업무를 총괄하고 관련 불만 및 피해 구제를 담당합니다.</p>
            <div className="mt-3 space-y-1">
              <p className="pl-4">• 성명: 이지선</p>
              <p className="pl-4">• 상호: 설기옥 선릉 본점</p>
              <p className="pl-4">• 사업자등록번호: 501-21-81985</p>
              <p className="pl-4">• 주소: 서울특별시 강남구 테헤란로63길 9, 1층 104호 104-1호</p>
              <p className="pl-4">• 전화: 0507-1376-9086</p>
              <p className="pl-4">• 이메일: niabest2022@gmail.com</p>
            </div>
          </div>
        </section>

        <p className="text-gray-400 text-xs mt-14 text-right">시행일: 2026년 6월 1일</p>
      </div>
    </div>
  );
}
