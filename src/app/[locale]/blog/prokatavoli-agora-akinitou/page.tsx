import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { ArrowRight } from "lucide-react";
import { routing } from "@/i18n/routing";
import { propertyContactHref } from "@/lib/property-contact";
import { buildPageMeta } from "@/lib/seo";
import { Link } from "@/navigation";
import { depositGuides } from "./content";

const pagePath = "/blog/prokatavoli-agora-akinitou";

type PageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();

  const guide = depositGuides[locale];
  const meta = buildPageMeta(locale, pagePath);
  return {
    ...meta,
    title: { absolute: `${guide.title} | ${guide.firmName}` },
    description: guide.description,
    openGraph: {
      ...meta.openGraph,
      type: "article",
      title: guide.title,
      description: guide.description,
    },
    twitter: {
      card: "summary_large_image",
      title: guide.title,
      description: guide.description,
      images: ["/δικηγορος.jpg"],
    },
  };
}

export default async function PropertyDepositGuide({ params }: PageProps) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();

  const guide = depositGuides[locale];

  return (
    <article className="bg-white">
      <header className="bg-primary py-16 text-white sm:py-24">
        <div className="mx-auto max-w-3xl px-6">
          <h1 className="border-l-4 border-accent pl-6 font-playfair text-3xl font-bold md:text-4xl">
            {guide.title}
          </h1>
        </div>
      </header>

      <div className="mx-auto max-w-3xl space-y-10 px-6 py-12 sm:py-16">
        <p className="text-lg leading-relaxed text-gray-700">{guide.intro}</p>

        <section className="rounded-sm border border-primary/10 bg-primary/5 p-5 sm:p-7">
          <h2 className="font-playfair text-2xl font-bold text-primary">
            {guide.checklistTitle}
          </h2>
          <ul className="mt-4 list-disc space-y-3 pl-5 leading-relaxed text-gray-700">
            {guide.checklist.map((item) => <li key={item}>{item}</li>)}
          </ul>
        </section>

        {guide.scenarios.map(({ title, paragraphs, source }) => (
          <section key={title}>
            <h2 className="border-l-4 border-accent pl-4 font-playfair text-2xl font-bold text-primary">
              {title}
            </h2>
            {paragraphs.map((paragraph) => (
              <p key={paragraph} className="mt-4 leading-relaxed text-gray-700">{paragraph}</p>
            ))}
            {source && (
              <a
                href={source.href}
                className="mt-4 inline-block font-medium text-primary underline underline-offset-4 hover:decoration-accent"
              >
                {source.label}
              </a>
            )}
          </section>
        ))}

        <section className="rounded-sm border border-accent/30 bg-accent/10 p-5 sm:p-7">
          <h2 className="font-playfair text-2xl font-bold text-primary">{guide.contactTitle}</h2>
          <p className="mt-3 leading-relaxed text-gray-700">{guide.contactText}</p>
          <Link
            href={propertyContactHref("deposit-guide")}
            className="mt-5 inline-flex items-center gap-2 rounded-sm bg-primary px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary/90"
          >
            {guide.contactLabel} <ArrowRight size={16} className="shrink-0" aria-hidden="true" />
          </Link>
        </section>

        <Link
          href="/practice-areas/realEstate"
          className="inline-flex items-center gap-2 font-semibold text-primary underline underline-offset-4 hover:decoration-accent"
        >
          {guide.propertyServiceLabel} <ArrowRight size={16} className="shrink-0" aria-hidden="true" />
        </Link>
      </div>
    </article>
  );
}
