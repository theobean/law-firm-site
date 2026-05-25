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
  return { title: t("privacyTitle"), robots: { index: false } };
}

export default function PrivacyPage() {
  const t = useTranslations("legal");

  return (
    <LegalPage
      title={t("privacyTitle")}
      intro={t("privacyIntro")}
      lastUpdatedLabel={t("lastUpdated")}
      lastUpdatedDate="25/05/2026"
      sections={[
        { title: t("privacySection1Title"), body: t("privacySection1") },
        { title: t("privacySection2Title"), body: t("privacySection2") },
        { title: t("privacySection3Title"), body: t("privacySection3") },
        { title: t("privacySection4Title"), body: t("privacySection4") },
        { title: t("privacySection5Title"), body: t("privacySection5") },
        { title: t("privacySection6Title"), body: t("privacySection6") },
      ]}
    />
  );
}
