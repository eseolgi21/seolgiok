import { Suspense } from "react";
import ClientEntry from "./ClientEntry";
import { requireStoresAccess } from "./guard/requireStoresAccess";

export default async function StoresPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  await requireStoresAccess(locale);

  return (
    <Suspense>
      <ClientEntry />
    </Suspense>
  );
}
