"use client";

import Image from "next/image";
// import { useTranslations } from "next-intl";

export function SeolgiokView() {
    // 나중에 i18n 적용 가능하도록 hook 준비
    // const t = useTranslations("home.Seolgiok");

    return (
        <div className="min-h-screen bg-[#fdfbf7] text-[#1a1a1a] font-sans selection:bg-[#d4b886] selection:text-white">
            {/* Hero Section */}
            <section className="relative h-[100dvh] w-full overflow-hidden flex items-center justify-center">
                <div className="absolute inset-0 z-0">
                    <Image
                        src="/images/seolgiok-hero.png"
                        alt="Seolgiok Gomtang"
                        fill
                        className="object-cover object-center brightness-[0.85] scale-105 animate-[kenburns_20s_infinite_alternate]"
                        priority
                    />
                    <div className="absolute inset-0 bg-black/30" />
                </div>

                <div className="relative z-10 text-center text-white px-4 animate-in fade-in zoom-in duration-1000 slide-in-from-bottom-4">
                    <p className="text-lg md:text-xl font-light tracking-[0.5em] mb-4 opacity-90 drop-shadow-md">
                        정성의 시간
                    </p>
                    <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight mb-8 drop-shadow-xl font-serif">
                        설기옥
                    </h1>
                    <p className="text-sm md:text-base font-light tracking-widest opacity-80 border-t border-white/40 pt-6 inline-block px-8">
                        KOREAN BEEF BONE SOUP
                    </p>
                </div>

                <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce opacity-70">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                    </svg>
                </div>
            </section>

            {/* Philosophy Section */}
            <section className="py-24 md:py-32 px-6 md:px-12 max-w-7xl mx-auto text-center">
                <span className="block text-[#d4b886] text-sm font-bold tracking-widest mb-6 uppercase">Our Philosophy</span>
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-10 leading-snug break-keep text-gray-900 font-serif">
                    24시간의 기다림,<br className="md:hidden" /> 맑고 깊은 한 그릇
                </h2>
                <p className="text-gray-600 leading-loose max-w-2xl mx-auto text-sm md:text-base break-keep">
                    설기옥은 타협하지 않는 정직함을 담습니다. 최상급 한우 사골을 엄선하여 가마솥에서 24시간 동안 정성껏 고아냅니다.
                    첨가물 없이 오직 시간과 불, 그리고 정성으로만 완성된 맑고 깊은 국물은 몸과 마음을 따뜻하게 채워줍니다.
                    전통의 맛을 현대적인 감각으로 재해석한 설기옥에서 진정한 미식의 위로를 경험하세요.
                </p>
            </section>

            {/* Menu Highlight - Grid */}
            <section className="bg-white py-24 md:py-32">
                <div className="max-w-7xl mx-auto px-6 md:px-12">
                    <div className="text-center mb-16">
                        <span className="block text-[#d4b886] text-sm font-bold tracking-widest mb-4 uppercase">Signature Menu</span>
                        <h3 className="text-3xl md:text-4xl font-bold font-serif text-gray-900">대표 메뉴</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-20 items-center">
                        {/* Menu Item 1 */}
                        <div className="group cursor-pointer">
                            <div className="aspect-[4/3] relative overflow-hidden rounded-2xl mb-6 shadow-lg">
                                <div className="absolute inset-0 bg-gray-200 animate-pulse" /> {/* Placeholder BG */}
                                <Image
                                    src="/images/seolgiok-hero.png"
                                    alt="Seolgiok Gomtang"
                                    fill
                                    className="object-cover transition-transform duration-700 group-hover:scale-110"
                                />
                                <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors duration-500" />
                            </div>
                            <div className="text-center md:text-left">
                                <h4 className="text-2xl font-bold mb-2 text-gray-900 group-hover:text-[#d4b886] transition-colors">설기 맑은 곰탕</h4>
                                <p className="text-gray-500 text-sm leading-relaxed mb-3">Traditional Clear Beef Soup</p>
                                <div className="w-12 h-px bg-[#d4b886] mx-auto md:mx-0 mb-4" />
                                <p className="text-gray-600 text-sm leading-relaxed break-keep">
                                    기름기를 걷어내어 깔끔하고 담백한 맛이 일품인 설기옥의 대표 메뉴입니다. 부드러운 양지와 사태가 어우러져 깊은 풍미를 자아냅니다.
                                </p>
                            </div>
                        </div>

                        {/* Menu Item 2 (Placeholder Image for variety) */}
                        <div className="group cursor-pointer md:mt-24">
                            <div className="aspect-[4/3] relative overflow-hidden rounded-2xl mb-6 shadow-lg bg-gray-100">
                                {/* Reusing hero image but zoomed differently or just placeholder for now since I only have 1 gen image */}
                                <Image
                                    src="/images/seolgiok-hero.png"
                                    alt="Suyuk"
                                    fill
                                    className="object-cover transition-transform duration-700 group-hover:scale-110 object-bottom"
                                />
                                <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors duration-500" />
                            </div>
                            <div className="text-center md:text-left">
                                <h4 className="text-2xl font-bold mb-2 text-gray-900 group-hover:text-[#d4b886] transition-colors">한우 수육</h4>
                                <p className="text-gray-500 text-sm leading-relaxed mb-3">Premium Boiled Beef Slices</p>
                                <div className="w-12 h-px bg-[#d4b886] mx-auto md:mx-0 mb-4" />
                                <p className="text-gray-600 text-sm leading-relaxed break-keep">
                                    최상급 한우의 다양한 부위를 촉촉하게 삶아내어 부추와 함께 곁들여 먹는 별미입니다. 술안주로도, 든든한 요리로도 손색이 없습니다.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Detailed Features */}
            <section className="py-24 bg-[#f8f5f2]">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
                        <div className="p-8 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow">
                            <div className="w-12 h-12 bg-[#fdfbf7] rounded-full flex items-center justify-center mx-auto mb-6 text-[#d4b886]">
                                <span className="font-serif text-xl font-bold">01</span>
                            </div>
                            <h5 className="font-bold text-lg mb-3">최상급 재료</h5>
                            <p className="text-gray-500 text-sm leading-relaxed">엄선된 1++ 한우만을 사용하여<br />믿을 수 있는 품질을 약속합니다.</p>
                        </div>
                        <div className="p-8 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow">
                            <div className="w-12 h-12 bg-[#fdfbf7] rounded-full flex items-center justify-center mx-auto mb-6 text-[#d4b886]">
                                <span className="font-serif text-xl font-bold">02</span>
                            </div>
                            <h5 className="font-bold text-lg mb-3">전통 방식</h5>
                            <p className="text-gray-500 text-sm leading-relaxed">전통 가마솥 방식을 고수하여<br />깊고 진한 맛을 냅니다.</p>
                        </div>
                        <div className="p-8 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow">
                            <div className="w-12 h-12 bg-[#fdfbf7] rounded-full flex items-center justify-center mx-auto mb-6 text-[#d4b886]">
                                <span className="font-serif text-xl font-bold">03</span>
                            </div>
                            <h5 className="font-bold text-lg mb-3">건강한 맛</h5>
                            <p className="text-gray-500 text-sm leading-relaxed">인공 조미료를 배제하고<br />자연 본연의 맛을 추구합니다.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Info / Footer-ish area */}
            <section className="bg-[#1a1a1a] text-white py-24">
                <div className="max-w-4xl mx-auto px-6 text-center">
                    <h3 className="text-3xl font-serif font-bold mb-8 text-[#d4b886]">설기옥</h3>
                    <p className="text-gray-400 mb-10 leading-relaxed">
                        서울시 강남구 테헤란로 123, 설기빌딩 1층<br />
                        전화문의: 02-1234-5678<br />
                        운영시간: 11:00 - 22:00 (Break Time 15:00 - 17:00)
                    </p>
                    <button className="px-8 py-3 border border-[#d4b886] text-[#d4b886] hover:bg-[#d4b886] hover:text-white transition-colors duration-300 rounded-none uppercase text-sm tracking-widest">
                        오시는 길
                    </button>
                </div>
            </section>
        </div>
    );
}
