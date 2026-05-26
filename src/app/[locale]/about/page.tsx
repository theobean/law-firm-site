import { useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { Scale, GraduationCap, Users } from "lucide-react";
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

      {/* Team grid — all three members */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-px bg-accent" />
            <p className="text-accent text-sm font-semibold tracking-widest uppercase">{tTeam("sectionTitle")}</p>
          </div>
          <h2 className="text-3xl font-playfair font-bold text-primary">{tTeam("sectionSubtitle")}</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Ioannis Papaioannou — founder */}
          <div className="group flex flex-col border border-gray-100 rounded-sm overflow-hidden hover:border-accent/40 hover:shadow-lg transition-all duration-300">
            <div className="relative aspect-[3/4] bg-gray-100 overflow-hidden">
              <Image
                src="/δικηγορος.png"
                alt={t("name")}
                fill
                className="object-cover object-top transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-primary/70 via-transparent to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <span className="inline-block bg-accent text-white text-[10px] font-bold tracking-widest uppercase px-2 py-1 mb-2">
                  {tTeam("founderBadge")}
                </span>
              </div>
            </div>
            <div className="p-5 flex-1 flex flex-col">
              <h3 className="text-xl font-playfair font-bold text-primary mb-1">{t("name")}</h3>
              <p className="text-accent text-xs font-semibold tracking-wide uppercase mb-3">{t("role")}</p>
              <p className="text-gray-600 text-sm leading-relaxed">{t("bio1")}</p>
            </div>
          </div>

          {/* Georgios Liamos */}
          <div className="group flex flex-col border border-gray-100 rounded-sm overflow-hidden hover:border-accent/40 hover:shadow-lg transition-all duration-300">
            <div className="relative aspect-[3/4] bg-primary flex items-center justify-center overflow-hidden">
              <span className="text-accent font-playfair font-bold text-6xl opacity-30 select-none">ΛΓ</span>
              <div className="absolute inset-0 bg-gradient-to-t from-primary/80 via-transparent to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <span className="inline-block bg-white/10 text-white/70 text-[10px] font-bold tracking-widest uppercase px-2 py-1 mb-2">
                  {tTeam("associateBadge")}
                </span>
              </div>
            </div>
            <div className="p-5 flex-1 flex flex-col">
              <h3 className="text-xl font-playfair font-bold text-primary mb-1">{tTeam("georgios.name")}</h3>
              <p className="text-accent text-xs font-semibold tracking-wide uppercase mb-3">{tTeam("associateRole")}</p>
              <p className="text-gray-600 text-sm leading-relaxed">{tTeam("georgios.bio")}</p>
            </div>
          </div>

          {/* Lampriní Papaioannou */}
          <div className="group flex flex-col border border-gray-100 rounded-sm overflow-hidden hover:border-accent/40 hover:shadow-lg transition-all duration-300">
            <div className="relative aspect-[3/4] bg-primary flex items-center justify-center overflow-hidden">
              <span className="text-accent font-playfair font-bold text-6xl opacity-30 select-none">ΠΛ</span>
              <div className="absolute inset-0 bg-gradient-to-t from-primary/80 via-transparent to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <span className="inline-block bg-white/10 text-white/70 text-[10px] font-bold tracking-widest uppercase px-2 py-1 mb-2">
                  {tTeam("associateBadge")}
                </span>
              </div>
            </div>
            <div className="p-5 flex-1 flex flex-col">
              <h3 className="text-xl font-playfair font-bold text-primary mb-1">{tTeam("lamprinι.name")}</h3>
              <p className="text-accent text-xs font-semibold tracking-wide uppercase mb-3">{tTeam("associateRole")}</p>
              <p className="text-gray-600 text-sm leading-relaxed">{tTeam("lamprinι.bio")}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Founder detail — education & memberships */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-6xl mx-auto px-6">
          <div className="max-w-2xl">
            <h2 className="text-2xl font-playfair font-bold text-primary mb-8">{t("name")}</h2>
            <p className="text-gray-600 leading-relaxed mb-8">{t("bio2")}</p>

            <div className="grid sm:grid-cols-2 gap-8">
              {/* Education */}
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <GraduationCap className="text-accent" size={20} />
                  <h3 className="text-lg font-bold text-primary">{t("education")}</h3>
                </div>
                <ul className="space-y-2">
                  <li className="text-gray-600 text-sm before:content-['—'] before:mr-2 before:text-accent">{t("edu1")}</li>
                  <li className="text-gray-600 text-sm before:content-['—'] before:mr-2 before:text-accent">{t("edu2")}</li>
                </ul>
              </div>

              {/* Memberships */}
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <Users className="text-accent" size={20} />
                  <h3 className="text-lg font-bold text-primary">{t("memberships")}</h3>
                </div>
                <ul className="space-y-2">
                  <li className="text-gray-600 text-sm before:content-['—'] before:mr-2 before:text-accent">{t("member1")}</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values strip */}
      <section className="py-16">
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
