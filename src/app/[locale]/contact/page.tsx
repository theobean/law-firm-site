import { useTranslations, useLocale } from "next-intl";
import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { MapPin, Phone, Mail, Clock } from "lucide-react";
import ContactForm from "@/components/ContactForm";

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
              <div className="flex gap-4">
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <MapPin className="text-accent" size={18} />
                </div>
                <div>
                  <p className="font-bold text-primary mb-1">{t("address")}</p>
                  <p className="text-gray-600">{t("addressLine1")}</p>
                  <p className="text-gray-600">{t("addressLine2")}</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <Phone className="text-accent" size={18} />
                </div>
                <div>
                  <p className="font-bold text-primary mb-1">{t("phone")}</p>
                  <p className="text-gray-600">+30 2310 545 261</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <Mail className="text-accent" size={18} />
                </div>
                <div>
                  <p className="font-bold text-primary mb-1">{t("email")}</p>
                  <p className="text-gray-600">iopapaio@gmail.com</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <Clock className="text-accent" size={18} />
                </div>
                <div>
                  <p className="font-bold text-primary mb-1">{t("hours")}</p>
                  <p className="text-gray-600">{t("hoursValue")}</p>
                </div>
              </div>
            </div>

            {/* Google Maps embed */}
            <div className="mt-10 rounded-sm overflow-hidden h-64">
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
          </div>

          {/* Form */}
          <ContactForm />
        </div>
      </section>
    </div>
  );
}
