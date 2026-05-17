import { setRequestLocale } from "next-intl/server";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props) {
  await params;
  return {
    title: "이용약관 — 설기옥",
    description: "설기옥 선릉 본점 이용약관을 안내드립니다.",
  };
}

export default async function TermsPage({ params }: Props) {
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
        <h1 className="font-serif text-4xl font-bold text-cream">이용약관</h1>
        <div className="w-12 h-px bg-gold mx-auto mt-6" />
      </div>

      {/* 본문 */}
      <div className="max-w-3xl mx-auto px-6 py-16">

        <section>
          <h2 className="font-serif text-xl font-bold text-dark mb-3 mt-0">제1조 (목적)</h2>
          <div className="w-8 h-px bg-gold mb-4" />
          <div className="text-gray-600 text-sm leading-relaxed space-y-2">
            <p>
              이 약관은 설기옥 선릉 본점(이하 &quot;회사&quot;)이 운영하는 웹사이트(이하 &quot;서비스&quot;)를
              이용함에 있어 회사와 이용자 간의 권리, 의무 및 책임사항, 기타 필요한 사항을 규정함을 목적으로 합니다.
            </p>
          </div>
        </section>

        <section>
          <h2 className="font-serif text-xl font-bold text-dark mb-3 mt-10">제2조 (서비스 이용)</h2>
          <div className="w-8 h-px bg-gold mb-4" />
          <div className="text-gray-600 text-sm leading-relaxed space-y-2">
            <p>
              ① 서비스는 회사가 제공하는 식당 정보, 메뉴 안내, 예약 및 공지사항 등으로 구성됩니다.
            </p>
            <p>
              ② 회사는 서비스의 내용, 운영 시간, 제공 방식 등을 사전 고지 후 변경할 수 있으며,
              불가피한 사유가 있는 경우 즉시 변경 후 공지할 수 있습니다.
            </p>
            <p>
              ③ 회원 가입 후 이용 가능한 서비스(예약, 주문 내역 등)는 회원 본인만 이용할 수 있습니다.
            </p>
          </div>
        </section>

        <section>
          <h2 className="font-serif text-xl font-bold text-dark mb-3 mt-10">제3조 (회원의 의무)</h2>
          <div className="w-8 h-px bg-gold mb-4" />
          <div className="text-gray-600 text-sm leading-relaxed space-y-2">
            <p>① 이용자는 다음 행위를 하여서는 안 됩니다.</p>
            <p className="pl-4">1. 가입 시 허위 정보를 기재하는 행위</p>
            <p className="pl-4">2. 타인의 정보를 도용하는 행위</p>
            <p className="pl-4">3. 회사의 서비스 운영을 고의로 방해하는 행위</p>
            <p className="pl-4">4. 서비스를 이용하여 법령 또는 공공질서에 위반되는 행위</p>
            <p>
              ② 이용자는 관계 법령, 이 약관의 규정, 이용 안내 및 서비스와 관련하여 공지한 주의사항을
              준수하여야 합니다.
            </p>
          </div>
        </section>

        <section>
          <h2 className="font-serif text-xl font-bold text-dark mb-3 mt-10">제4조 (면책조항)</h2>
          <div className="w-8 h-px bg-gold mb-4" />
          <div className="text-gray-600 text-sm leading-relaxed space-y-2">
            <p>
              ① 회사는 천재지변, 전쟁, 기간통신사업자의 서비스 중단 등 불가항력적인 사유로 인해
              서비스를 제공하지 못한 경우 책임을 지지 않습니다.
            </p>
            <p>
              ② 회사는 이용자의 귀책사유로 인한 서비스 이용의 장애에 대해서는 책임을 지지 않습니다.
            </p>
            <p>
              ③ 회사는 서비스에 게재된 정보, 자료, 사실의 신뢰도, 정확성 등에 관해 보증하지 않으며,
              이로 인해 발생한 손해에 대해 책임을 부담하지 않습니다.
            </p>
          </div>
        </section>

        <section>
          <h2 className="font-serif text-xl font-bold text-dark mb-3 mt-10">제5조 (분쟁해결)</h2>
          <div className="w-8 h-px bg-gold mb-4" />
          <div className="text-gray-600 text-sm leading-relaxed space-y-2">
            <p>
              ① 회사와 이용자 사이에 발생한 분쟁은 상호 협의하여 해결하는 것을 원칙으로 합니다.
            </p>
            <p>
              ② 협의가 이루어지지 않을 경우, 소송은 회사의 소재지를 관할하는 법원을 전속 관할 법원으로 합니다.
            </p>
            <p>
              ③ 이 약관은 대한민국 법령에 따라 해석 및 적용됩니다.
            </p>
          </div>
        </section>

        <p className="text-gray-400 text-xs mt-14 text-right">시행일: 2026년 6월 1일</p>
      </div>
    </div>
  );
}
