import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { ArrowLeft, ArrowRight } from "lucide-react";
import FaqAccordion from "@/components/FaqAccordion";
import { routing } from "@/i18n/routing";
import { buildPageMeta } from "@/lib/seo";
import { propertyContactHref } from "@/lib/property-contact";
import { PROPERTY_NEW_BUILD_PAGES as content } from "@/lib/property-content.mjs";
import { Link } from "@/navigation";

const realEstatePath = "/practice-areas/realEstate";
const pagePath = `${realEstatePath}/agora-neodmitou`;

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();

  const { seoTitle: title, description } = content[locale];
  const meta = buildPageMeta(locale, pagePath);

  return {
    ...meta,
    title: { absolute: title },
    description,
    openGraph: { ...meta.openGraph, title, description },
    twitter: { card: "summary_large_image", title, description, images: meta.openGraph.images },
  };
}

export default async function NewBuildPurchasePage({ params }: Props) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  const page = content[locale];

  return (
    <div className="bg-white">
      <section className="bg-primary py-16 text-white md:py-24">
        <div className="mx-auto max-w-4xl px-6">
          <Link
            href={realEstatePath}
            className="mb-6 inline-flex items-center gap-2 text-sm text-white/75 transition-colors hover:text-accent"
          >
            <ArrowLeft size={16} aria-hidden="true" /> {page.back}
          </Link>
          <div className="border-l-4 border-accent pl-5 md:pl-6">
            <h1 className="font-playfair text-3xl font-bold md:text-5xl">{page.title}</h1>
            <p className="mt-4 max-w-3xl text-lg leading-relaxed text-white/85">{page.intro}</p>
          </div>
          <Link
            href={propertyContactHref("new-build")}
            className="mt-8 inline-flex items-center gap-2 rounded-sm bg-accent px-5 py-3 font-semibold text-primary transition-colors hover:bg-accent/90"
          >
            {page.contact} <ArrowRight size={18} className="shrink-0" aria-hidden="true" />
          </Link>
        </div>
      </section>

      <div className="mx-auto max-w-4xl space-y-12 px-6 py-14 md:py-16">
        <section>
          <h2 className="border-l-4 border-accent pl-4 font-playfair text-2xl font-bold text-primary">
            {page.scope}
          </h2>
          <div className="mt-5 divide-y divide-gray-200">
            {page.checks.map(({ title, text }) => (
              <div className="py-5" key={title}>
                <h3 className="font-playfair text-xl font-semibold text-primary">{title}</h3>
                <p className="mt-2 leading-relaxed text-gray-700">{text}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-sm border border-primary/10 bg-primary/5 p-5 md:p-7">
          <h2 className="font-playfair text-2xl font-bold text-primary">{page.preparationTitle}</h2>
          <p className="mt-3 leading-relaxed text-gray-700">{page.preparation}</p>
        </section>

        <section>
          <h2 className="mb-6 border-l-4 border-accent pl-4 font-playfair text-2xl font-bold text-primary">
            {page.questionsTitle}
          </h2>
          <FaqAccordion items={page.questions.map(({ title, text }) => ({ q: title, a: text }))} />
        </section>

        <section className="flex flex-col items-start gap-5 border-t border-gray-200 pt-8 sm:flex-row sm:gap-7">
          <div className="relative h-28 w-24 shrink-0 overflow-hidden rounded-sm bg-primary">
            <Image
              src="/λαμπρινη.png"
              alt=""
              fill
              sizes="96px"
              className="object-cover object-top"
            />
          </div>
          <div>
            <h2 className="font-playfair text-2xl font-bold text-primary">{page.lawyer}</h2>
            <p className="mt-1 text-sm font-medium text-gray-600">{page.role}</p>
            <p className="mt-3 leading-relaxed text-gray-700">{page.biography}</p>
            <Link href="/about" className="mt-3 inline-flex items-center gap-2 font-semibold text-primary underline underline-offset-4 hover:decoration-accent">
              {page.team} <ArrowRight size={16} className="shrink-0" aria-hidden="true" />
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
