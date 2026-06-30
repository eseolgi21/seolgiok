import { Suspense } from "react";
import PayslipsView from "./view/PayslipsView";

export default function PayslipsPage() {
  return (
    <Suspense>
      <PayslipsView />
    </Suspense>
  );
}
