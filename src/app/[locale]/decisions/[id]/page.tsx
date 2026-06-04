import { getDecisionById, getDecisions } from "@/sanity/client";
import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";

export const revalidate = 10;

export async function generateStaticParams() {
  const decisions = await getDecisions();
  return decisions.map((d: { _id: string }) => ({ id: d._id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string; locale: string }>;
}): Promise<Metadata> {
  const { id, locale } = await params;
  const decision = await getDecisionById(id);
  if (!decision) return {};

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.ioannispapaioannou.lawyer";
  const pageUrl = `${siteUrl}/${locale}/decisions/${id}`;

  // Use first image as OG image, fallback to file icon placeholder
  const ogImage = decision.images?.[0]?.url ?? `${siteUrl}/δικηγορος.png`;

  const description = decision.description ||
    [decision.court, decision.date ? new Date(decision.date).getFullYear() : null]
      .filter(Boolean).join(" · ");

  return {
    title: decision.title,
    description,
    alternates: { canonical: pageUrl },
    openGraph: {
      title: decision.title,
      description,
      url: pageUrl,
      type: "article",
      images: [{ url: ogImage, width: 1200, height: 630, alt: decision.title }],
    },
    twitter: {
      card: "summary_large_image",
      title: decision.title,
      description,
      images: [ogImage],
    },
  };
}

// This page only exists for OG metadata / sharing purposes.
// It redirects to the decisions list with the card in view.
export default async function DecisionPage({
  params,
}: {
  params: Promise<{ id: string; locale: string }>;
}) {
  const { id, locale } = await params;
  const decision = await getDecisionById(id);
  if (!decision) notFound();

  redirect(`/${locale}/decisions`);
}
