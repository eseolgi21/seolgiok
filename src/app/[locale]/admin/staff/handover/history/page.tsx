import { Suspense } from "react";
import HandoverHistoryView from "./HandoverHistoryView";

export default function HandoverHistoryPage() {
  return (
    <Suspense>
      <HandoverHistoryView />
    </Suspense>
  );
}
