import type { ReactNode } from "react";

// html/body는 src/app/[locale]/layout.tsx 에서 locale별로 lang 속성과 함께 렌더링합니다.
export default function RootLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
