import { useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { buildPageMeta } from "@/lib/seo";
import { Scale, GraduationCap, Users } from "lucide-react";
import BiographySection from "@/components/BiographySection";
import MemberBioSection from "@/components/MemberBioSection";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "seo" });
  return { title: t("aboutTitle"), description: t("aboutDescription"), ...buildPageMeta(locale, "/about") };
}

export default function AboutPage() {
  const t = useTranslations("about");

  return (
    <div className="bg-white">
      {/* Header */}
      <section className="bg-primary py-24 text-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="border-l-4 border-accent pl-6">
            <h1 className="text-4xl md:text-5xl font-playfair font-bold">{t("title")}</h1>
          </div>
        </div>
      </section>

      {/* Full biography — Ioannis Papaioannou */}
      <BiographySection />

      {/* Georgios Liamos */}
      <MemberBioSection memberKey="georgios" bg="white" />

      {/* Lampriní Papaioannou */}
      <MemberBioSection memberKey="lamprinι" bg="gray" />

      {/* Values strip */}
      <section className="bg-gray-50 py-16 border-t border-gray-100">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: Scale, title: t("value1Title"), desc: t("value1Desc") },
              { icon: Users, title: t("value2Title"), desc: t("value2Desc") },
              { icon: GraduationCap, title: t("value3Title"), desc: t("value3Desc") },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="text-center p-6">
                <div className="inline-flex items-center justify-center w-14 h-14 bg-primary rounded-full mb-4">
                  <Icon className="text-accent" size={24} />
                </div>
                <h3 className="text-xl font-bold text-primary mb-2">{title}</h3>
                <p className="text-gray-600">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
