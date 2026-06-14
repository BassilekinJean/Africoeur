import { setRequestLocale } from "next-intl/server";
import { LoginForm } from "@/components/auth/LoginForm";

export default async function LoginPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <div className="container-page flex min-h-[70vh] items-center justify-center py-14">
      <LoginForm />
    </div>
  );
}
