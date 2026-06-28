import { Suspense } from "react";
import StaffNoticesView from "./view/StaffNoticesView";

export default function StaffNoticesPage() {
  return (
    <Suspense>
      <StaffNoticesView />
    </Suspense>
  );
}
