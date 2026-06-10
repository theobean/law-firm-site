import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { buildPageMeta } from "@/lib/seo";
import { use } from "react";
import ServicerLanding from "@/components/ServicerLanding";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "intrum" });
  return {
    title: t("seoTitle"),
    description: t("seoDescription"),
    ...buildPageMeta(locale, "/funds/intrum"),
  };
}

export default function IntrumPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = use(params);
  return <ServicerLanding locale={locale} namespace="intrum" />;
}
