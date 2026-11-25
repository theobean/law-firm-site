import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { buildPageMeta } from "@/lib/seo";
import { Link } from "@/navigation";
import { guideSources, settlementGuides } from "./content";

const pagePath = "/exodikastikos/odigos";
const sourceLink = "font-medium text-primary underline decoration-accent underline-offset-4";
const sectionHeading = "border-l-4 border-accent pl-4 font-playfair text-2xl font-bold leading-snug text-primary sm:text-3xl";

type PageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();

  const { title, description } = settlementGuides[locale];
  const meta = buildPageMeta(locale, pagePath);
  return {
    ...meta,
    title,
    description,
    openGraph: { ...meta.openGraph, type: "article", title, description },
    twitter: { card: "summary_large_image", title, description, images: meta.openGraph.images },
  };
}

export default async function DebtSettlementGuidePage({ params }: PageProps) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();

  const guide = settlementGuides[locale];

  return (
    <article>
      <header className="bg-primary py-14 text-white sm:py-20">
        <div className="mx-auto max-w-3xl px-6">
          <Link href="/exodikastikos" className="text-sm text-white/85 underline underline-offset-4 hover:text-white">
            {guide.serviceLink}
          </Link>
          <h1 className="mt-5 border-l-4 border-accent pl-5 font-playfair text-3xl font-bold leading-tight sm:text-5xl">
            {guide.title}
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-white/80">{guide.intro}</p>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-6 py-12 leading-relaxed text-gray-700 sm:py-16">
        <div className="space-y-12">
          {guide.sections.map(({ heading, paragraphs }) => (
            <section key={heading} className="space-y-4">
              <h2 className={sectionHeading}>{heading}</h2>
              {paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
            </section>
          ))}
        </div>
        <p className="mt-4">
          <Link href="/contact" className={sourceLink}>{guide.contactLink}</Link>
        </p>

        <aside aria-labelledby="guide-sources" className="mt-12 border-t border-gray-200 pt-6 text-sm">
          <h2 id="guide-sources" className="font-semibold text-primary">{guide.sourcesHeading}</h2>
          <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-2">
            {guideSources.map((href, index) => (
              <li key={href}>
                <a href={href} className={sourceLink}>{guide.sourceLabels[index]}</a>
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </article>
  );
}
