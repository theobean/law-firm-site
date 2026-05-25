import { useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import LegalPage from "@/components/LegalPage";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "seo" });
  return { title: t("termsTitle"), robots: { index: false } };
}

export default function TermsPage() {
  const t = useTranslations("legal");

  return (
    <LegalPage
      title={t("termsTitle")}
      intro={t("termsIntro")}
      lastUpdatedLabel={t("lastUpdated")}
      lastUpdatedDate="25/05/2026"
      sections={[
        { title: t("termsSection1Title"), body: t("termsSection1") },
        { title: t("termsSection2Title"), body: t("termsSection2") },
        { title: t("termsSection3Title"), body: t("termsSection3") },
        { title: t("termsSection4Title"), body: t("termsSection4") },
        { title: t("termsSection5Title"), body: t("termsSection5") },
      ]}
    />
  );
}
