import { useTranslations, useLocale } from "next-intl";
import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { MapPin, Phone, Mail, Clock, ChevronRight } from "lucide-react";
import ContactForm from "@/components/ContactForm";
import ScrollReveal from "@/components/ScrollReveal";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "seo" });
  return { title: t("contactTitle"), description: t("contactDescription") };
}

export default function ContactPage() {
  const t = useTranslations("contact");
  const tCommon = useTranslations("common");
  const locale = useLocale();

  return (
    <div className="bg-white">
      {/* Header */}
      <section className="bg-primary py-24 text-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="border-l-4 border-accent pl-6">
            <h1 className="text-4xl md:text-5xl font-playfair font-bold">{t("title")}</h1>
            <p className="text-white/70 text-xl mt-2">{t("subtitle")}</p>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <div className="grid md:grid-cols-2 gap-16">
          {/* Contact info */}
          <div>
            <div className="space-y-8">
              {[
                { icon: MapPin, label: t("address"), lines: [t("addressLine1"), t("addressLine2")], href: "https://maps.google.com/?q=Λέοντος+του+Σοφού+12,+54625+Θεσσαλονίκη", external: true },
                { icon: Phone, label: t("phone"), lines: ["+30 2310 545 261"], href: "tel:+302310545261", external: false },
                { icon: Mail, label: t("email"), lines: ["iopapaio@gmail.com"], href: "mailto:iopapaio@gmail.com", external: false },
                { icon: Clock, label: t("hours"), lines: [t("hoursValue")], href: null, external: false },
              ].map(({ icon: Icon, label, lines, href, external }, i) => (
                <ScrollReveal key={label} direction="left" delay={i * 0.12}>
                  <a
                    href={href ?? undefined}
                    target={external ? "_blank" : undefined}
                    rel={external ? "noopener noreferrer" : undefined}
                    className={`flex gap-4 group items-center rounded-sm px-4 py-3 transition-all duration-150 ${
                      href
                        ? `bg-gray-50 hover:bg-white active:bg-gray-50
                           border border-gray-200 hover:border-accent/40 active:border-accent/20
                           shadow-[0_3px_0_0_rgba(0,0,0,0.08)] hover:shadow-[0_3px_0_0_rgba(200,146,42,0.2)]
                           active:shadow-none active:translate-y-[3px]
                           cursor-pointer`
                        : "cursor-default"
                    }`}
                  >
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                      <Icon className="text-accent" size={18} />
                    </div>
                    <div className="flex-1">
                      <p className={`font-bold mb-0.5 transition-colors ${href ? "text-primary group-hover:text-accent" : "text-primary"}`}>{label}</p>
                      {lines.map((line) => (
                        <p key={line} className="text-gray-500 text-sm">{line}</p>
                      ))}
                    </div>
                    {href && <ChevronRight size={16} className="text-gray-300 group-hover:text-accent flex-shrink-0 transition-colors" />}
                  </a>
                </ScrollReveal>
              ))}
            </div>

            {/* Google Maps embed */}
            <ScrollReveal direction="up" delay={0.5}>
              <div className="hidden md:block mt-10 rounded-sm overflow-hidden h-64">
                <iframe
                  src={`https://maps.google.com/maps?q=Λέοντος+του+Σοφού+12,+54625+Θεσσαλονίκη&output=embed&hl=${locale}`}
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title={tCommon("mapTitle")}
                />
              </div>
            </ScrollReveal>
          </div>

          {/* Form */}
          <ScrollReveal direction="right" delay={0.15}>
            <ContactForm />
          </ScrollReveal>
        </div>
      </section>
    </div>
  );
}
