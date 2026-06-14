import { setRequestLocale } from "next-intl/server";
import { DashboardOverview } from "@/components/dashboard/DashboardOverview";

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <div className="container-page py-12">
      <DashboardOverview />
    </div>
  );
}
