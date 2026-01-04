"use client";

// 페이지: 연산부(훅)와 렌더링(view) 분리
// JSX.Element/React.ReactNode 타입 선언 없음

import ListView from "./view/ListView";
import { useUsersList } from "./hooks/useUsersList";

export default function Page() {
  const data = useUsersList();
  return <ListView {...data} />;
}
