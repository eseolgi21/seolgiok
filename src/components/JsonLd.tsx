export function RestaurantJsonLd() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Restaurant",
    name: "설기옥 선릉 본점",
    alternateName: ["설기옥", "Seolgiok", "雪記玉"],
    description:
      "매일 새벽 24시간 고아낸 진한 고기 육수로 만든 곰탕 전문점. 서울 강남구 선릉역 인근, 연중무휴 운영.",
    url: "https://seolgiok.com",
    telephone: "+82-507-1376-9086",
    sameAs: [
      "https://map.naver.com/p/entry/place/1614979428",
      "https://naver.me/xX7us7A8",
    ],
    address: {
      "@type": "PostalAddress",
      streetAddress: "테헤란로63길 9, 1층 104호 104-1호",
      addressLocality: "강남구",
      addressRegion: "서울",
      postalCode: "06134",
      addressCountry: "KR",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: 37.5042,
      longitude: 127.0527,
    },
    logo: "https://seolgiok.com/images/logo.png",
    image: "https://seolgiok.com/images/seolgiok_homescreen.png",
    areaServed: [
      { "@type": "City", name: "강남구" },
      { "@type": "City", name: "서울" },
    ],
    servesCuisine: ["Korean", "곰탕", "Gomtang", "Beef Soup"],
    priceRange: "₩₩",
    menu: "https://seolgiok.com/ko/menu",
    hasMap: "https://map.naver.com/p/entry/place/1614979428",
    openingHoursSpecification: [
      // 평일 오전 세션 (브레이크 전)
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        opens: "09:00",
        closes: "16:00",
      },
      // 평일 저녁~익일 새벽 세션 (브레이크 후)
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        opens: "17:00",
        closes: "09:00",
      },
      // 주말 및 공휴일
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Saturday", "Sunday", "PublicHolidays"],
        opens: "09:00",
        closes: "23:00",
      },
    ],
    paymentAccepted: "Cash, Bank Transfer",
    currenciesAccepted: "KRW",
    amenityFeature: [
      {
        "@type": "LocationFeatureSpecification",
        name: "지하 주차장",
        value: true,
        description: "1시간 2,000원, 현금·계좌이체 납부",
      },
      { "@type": "LocationFeatureSpecification", name: "단체석", value: true },
      { "@type": "LocationFeatureSpecification", name: "포장", value: true },
    ],
    hasMenuItem: [
      {
        "@type": "MenuItem",
        name: "맑은 곰탕",
        description: "매일 새벽 24시간 고아낸 맑고 깊은 진한 고기 육수",
      },
      {
        "@type": "MenuItem",
        name: "갈비탕",
        description: "부드러운 갈비와 진한 고기 육수의 조화",
      },
      {
        "@type": "MenuItem",
        name: "갈비찜",
        description: "간장 양념에 조린 갈비찜",
      },
      {
        "@type": "MenuItem",
        name: "곱창 전골",
        description: "신선한 곱창과 채소의 얼큰한 전골",
      },
    ],
    speakable: {
      "@type": "SpeakableSpecification",
      xpath: [
        "/html/head/title",
        "/html/head/meta[@name='description']/@content",
      ],
    },
    contactPoint: {
      "@type": "ContactPoint",
      telephone: "+82-507-1376-9086",
      contactType: "customer service",
      availableLanguage: ["Korean"],
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

type FaqItem = { q: string; a: string };

export function FaqPageJsonLd({ items }: { items: FaqItem[] }) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    speakable: {
      "@type": "SpeakableSpecification",
      xpath: ["//details/summary/span[1]", "//details/div/p"],
    },
    mainEntity: items.map(({ q, a }) => ({
      "@type": "Question",
      name: q,
      acceptedAnswer: {
        "@type": "Answer",
        text: a,
      },
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export function WebSiteJsonLd() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "설기옥",
    url: "https://seolgiok.com",
    inLanguage: ["ko", "en", "ja", "zh", "vi"],
    publisher: {
      "@type": "Restaurant",
      name: "설기옥",
      url: "https://seolgiok.com",
    },
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

type AboutPageProps = { url: string; description: string };

export function AboutPageJsonLd({ url, description }: AboutPageProps) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    name: "설기옥 소개",
    url,
    description,
    about: {
      "@type": "Restaurant",
      name: "설기옥",
      url: "https://seolgiok.com",
    },
    speakable: {
      "@type": "SpeakableSpecification",
      xpath: ["/html/head/title", "/html/head/meta[@name='description']/@content"],
    },
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export function GrandOpeningEventJsonLd() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: "설기옥 선릉 본점 그랜드 오픈",
    startDate: "2026-06-01T09:00:00+09:00",
    endDate: "2026-06-01T23:00:00+09:00",
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    description:
      "매일 새벽 24시간 고아낸 진한 고기 육수로 만든 곰탕 전문점 설기옥 선릉 본점 그랜드 오픈. 맑은 곰탕·갈비탕·갈비찜·곱창전골을 선보입니다.",
    image: "https://seolgiok.com/images/grand_open.png",
    url: "https://seolgiok.com/ko/announcements",
    location: {
      "@type": "Place",
      name: "설기옥 선릉 본점",
      address: {
        "@type": "PostalAddress",
        streetAddress: "테헤란로63길 9, 1층 104호 104-1호",
        addressLocality: "강남구",
        addressRegion: "서울",
        postalCode: "06134",
        addressCountry: "KR",
      },
      geo: {
        "@type": "GeoCoordinates",
        latitude: 37.5042,
        longitude: 127.0527,
      },
    },
    organizer: {
      "@type": "Restaurant",
      name: "설기옥",
      url: "https://seolgiok.com",
    },
    offers: {
      "@type": "Offer",
      availability: "https://schema.org/InStock",
      priceCurrency: "KRW",
      url: "https://seolgiok.com/ko/menu",
    },
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

type MenuJsonLdProps = { url: string };

export function MenuJsonLd({ url }: MenuJsonLdProps) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Menu",
    name: "설기옥 메뉴",
    url,
    inLanguage: "ko",
    provider: { "@type": "Restaurant", name: "설기옥", url: "https://seolgiok.com" },
    hasMenuSection: [
      {
        "@type": "MenuSection",
        name: "국물 요리",
        hasMenuItem: [
          {
            "@type": "MenuItem",
            name: "맑은 곰탕",
            description: "매일 새벽 24시간 고아낸 맑고 깊은 진한 고기 육수",
            offers: { "@type": "Offer", priceCurrency: "KRW" },
          },
          {
            "@type": "MenuItem",
            name: "갈비탕",
            description: "부드러운 갈비와 진한 고기 육수의 조화",
            offers: { "@type": "Offer", priceCurrency: "KRW" },
          },
          {
            "@type": "MenuItem",
            name: "곱창 전골",
            description: "신선한 곱창과 채소의 얼큰한 전골",
            offers: { "@type": "Offer", priceCurrency: "KRW" },
          },
        ],
      },
      {
        "@type": "MenuSection",
        name: "단품 요리",
        hasMenuItem: [
          {
            "@type": "MenuItem",
            name: "갈비찜",
            description: "간장 양념에 조린 갈비찜",
            offers: { "@type": "Offer", priceCurrency: "KRW" },
          },
        ],
      },
    ],
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

type NewsArticleProps = {
  url: string;
  headline: string;
  datePublished: string;
  dateModified?: string;
};

export function NewsArticleJsonLd({ url, headline, datePublished, dateModified }: NewsArticleProps) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline,
    url,
    datePublished,
    dateModified: dateModified ?? datePublished,
    author: { "@type": "Organization", name: "설기옥", url: "https://seolgiok.com" },
    publisher: {
      "@type": "Organization",
      name: "설기옥",
      url: "https://seolgiok.com",
      logo: { "@type": "ImageObject", url: "https://seolgiok.com/images/logo.png" },
    },
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

type ItemListItem = { name: string; url: string };

export function ItemListJsonLd({ items }: { items: ItemListItem[] }) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: items.map(({ name, url }, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name,
      url,
    })),
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

type BreadcrumbItem = { name: string; item: string };

export function BreadcrumbListJsonLd({ items }: { items: BreadcrumbItem[] }) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map(({ name, item }, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name,
      item,
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
