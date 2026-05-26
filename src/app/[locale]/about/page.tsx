import { useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { Scale, GraduationCap, Users, Briefcase } from "lucide-react";
import Image from "next/image";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "seo" });
  return { title: t("aboutTitle"), description: t("aboutDescription") };
}

export default function AboutPage() {
  const t = useTranslations("about");
  const tTeam = useTranslations("team");

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

      {/* Main content */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <div className="grid md:grid-cols-2 gap-16 items-start">
          {/* Photo */}
          <div className="relative">
            <div className="aspect-[3/4] rounded-sm overflow-hidden">
              <Image
                src="/δικηγορος.png"
                alt={t("name")}
                fill
                className="object-cover object-top"
              />
            </div>
            <div className="absolute -bottom-6 -right-6 bg-accent w-40 h-1" />
          </div>

          {/* Bio */}
          <div>
            <h2 className="text-3xl font-playfair font-bold text-primary mb-2">{t("name")}</h2>
            <p className="text-accent font-semibold mb-8 text-lg">{t("role")}</p>
            <p className="text-gray-600 leading-relaxed mb-4">{t("bio1")}</p>
            <p className="text-gray-600 leading-relaxed mb-10">{t("bio2")}</p>

            {/* Education */}
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <GraduationCap className="text-accent" size={22} />
                <h3 className="text-xl font-bold text-primary">{t("education")}</h3>
              </div>
              <ul className="space-y-2 pl-8">
                <li className="text-gray-600 before:content-['—'] before:mr-2 before:text-accent">{t("edu1")}</li>
                <li className="text-gray-600 before:content-['—'] before:mr-2 before:text-accent">{t("edu2")}</li>
              </ul>
            </div>

            {/* Memberships */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <Users className="text-accent" size={22} />
                <h3 className="text-xl font-bold text-primary">{t("memberships")}</h3>
              </div>
              <ul className="space-y-2 pl-8">
                <li className="text-gray-600 before:content-['—'] before:mr-2 before:text-accent">{t("member1")}</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Values strip */}
      <section className="bg-gray-50 py-16">
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

      {/* Team section */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        {/* Section header */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-px bg-accent" />
            <p className="text-accent text-sm font-semibold tracking-widest uppercase">{tTeam("sectionTitle")}</p>
          </div>
          <h2 className="text-3xl font-playfair font-bold text-primary">{tTeam("sectionSubtitle")}</h2>
        </div>

        {/* Team cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Georgios Liamos */}
          <div className="flex gap-6 p-6 border border-gray-100 rounded-sm hover:border-accent/30 transition-colors duration-300 group">
            {/* Avatar placeholder */}
            <div className="shrink-0 w-20 h-20 rounded-full bg-primary flex items-center justify-center shadow-md">
              <span className="text-accent font-playfair font-bold text-xl">ΛΓ</span>
            </div>
            {/* Info */}
            <div className="flex-1 min-w-0">
              <h3 className="text-xl font-playfair font-bold text-primary mb-1">{tTeam("georgios.name")}</h3>
              <div className="flex items-center gap-2 mb-3">
                <Briefcase size={13} className="text-accent shrink-0" />
                <p className="text-accent text-xs font-semibold tracking-wide uppercase">{tTeam("associateRole")}</p>
              </div>
              <p className="text-gray-600 text-sm leading-relaxed">{tTeam("georgios.bio")}</p>
            </div>
          </div>

          {/* Lampriní Papaioannou */}
          <div className="flex gap-6 p-6 border border-gray-100 rounded-sm hover:border-accent/30 transition-colors duration-300 group">
            {/* Avatar placeholder */}
            <div className="shrink-0 w-20 h-20 rounded-full bg-primary flex items-center justify-center shadow-md">
              <span className="text-accent font-playfair font-bold text-xl">ΠΛ</span>
            </div>
            {/* Info */}
            <div className="flex-1 min-w-0">
              <h3 className="text-xl font-playfair font-bold text-primary mb-1">{tTeam("lamprinι.name")}</h3>
              <div className="flex items-center gap-2 mb-3">
                <Briefcase size={13} className="text-accent shrink-0" />
                <p className="text-accent text-xs font-semibold tracking-wide uppercase">{tTeam("associateRole")}</p>
              </div>
              <p className="text-gray-600 text-sm leading-relaxed">{tTeam("lamprinι.bio")}</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
