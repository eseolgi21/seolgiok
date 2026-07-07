"use client";
// 페이지: 연산부(훅)와 렌더링(view) 분리 (admin/users/list/page.tsx 패턴 참고)
// page.tsx는 서버 컴포넌트(guard 호출)이므로 훅 호출은 이 클라이언트 경계에서 수행한다.

import ListView from "./view/ListView";
import { useStoresList } from "./hooks/useStoresList";

export default function ClientEntry() {
  const data = useStoresList();
  return <ListView {...data} />;
}
