import { useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import LegalPage from "@/components/LegalPage";
import { buildPageMeta } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "seo" });
  return { ...buildPageMeta(locale, "/privacy"), title: t("privacyTitle"), robots: { index: false } };
}

export default function PrivacyPage() {
  const t = useTranslations("legal");

  return (
    <>
      <LegalPage
        title={t("privacyTitle")}
        intro={t("privacyIntro")}
        lastUpdatedLabel={t("lastUpdated")}
        lastUpdatedDate="09/11/2026"
        sections={[
          { title: t("privacySection1Title"), body: t("privacySection1") },
          { title: t("privacySection2Title"), body: t("privacySection2") },
          { title: t("privacySection3Title"), body: t("privacySection3") },
          { title: t("privacySection4Title"), body: t("privacySection4") },
          { title: t("privacySection5Title"), body: t("privacySection5") },
          { title: t("privacySection6Title"), body: t("privacySection6") },
        ]}
      />
      <section className="max-w-3xl mx-auto px-6 pb-16">
        <details>
          <summary className="cursor-pointer text-base font-semibold text-primary">
            {t("privacyResourcesTitle")}
          </summary>
          <ul className="space-y-3 pl-5 mt-4 text-sm text-gray-600">
          <li>
            <a href="https://developers.openai.com/api/docs/guides/your-data" className="underline underline-offset-4">
              {t("openaiDataLink")}
            </a>
          </li>
          <li>
            <a href="https://www.cloudflare.com/turnstile-privacy-policy/" className="underline underline-offset-4">
              {t("cloudflarePrivacyLink")}
            </a>
          </li>
          <li>
            <a href="https://www.cloudflare.com/cookie-policy/" className="underline underline-offset-4">
              {t("cloudflareCookiesLink")}
            </a>
          </li>
          <li>
            <a href="https://www.dpa.gr/enimerwtiko/thematikes_enotites/electronikesepikoinwnies/cookies/cookies_diadiktuo_cookies" className="underline underline-offset-4">
              {t("authorityCookiesLink")}
            </a>
          </li>
          </ul>
        </details>
      </section>
    </>
  );
}
