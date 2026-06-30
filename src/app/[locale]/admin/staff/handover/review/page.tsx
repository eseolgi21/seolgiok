import { Suspense } from "react";
import HandoverReviewView from "./HandoverReviewView";

export default function HandoverReviewPage() {
  return (
    <Suspense>
      <HandoverReviewView />
    </Suspense>
  );
}
