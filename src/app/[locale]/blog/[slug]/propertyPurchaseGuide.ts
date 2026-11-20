import type { PortableTextBlock } from "@portabletext/react";
import { PROPERTY_PURCHASE_GUIDES as translations } from "@/lib/property-content.mjs";

const guideSlug = "agora-akiniton-vimata";

export function getPropertyPurchaseGuide(slug: string, locale: string) {
  if (slug !== guideSlug) return null;

  const lang = locale === "en" || locale === "de" ? locale : "el";
  const { title, excerpt, serviceCta, serviceLabel, sections } = translations[lang];
  const body = sections.flatMap<PortableTextBlock>((section, index) => {
    const key = `guide-${index}`;
    const link = index === 0
      ? { href: "/practice-areas/realEstate", label: serviceLabel }
      : section.link;
    const blocks: PortableTextBlock[] = [
      { _key: `${key}-heading`, _type: "block", style: "h2", children: [
        { _key: `${key}-heading-text`, _type: "span", text: section.title },
      ] },
      { _key: `${key}-paragraph`, _type: "block", style: "normal", children: [
        { _key: `${key}-paragraph-text`, _type: "span", text: section.text },
      ] },
    ];

    if (link) {
      const href = link.href.startsWith("/") ? `/${lang}${link.href}` : link.href;
      blocks.push({
        _key: `${key}-link`,
        _type: "block",
        style: "normal",
        markDefs: [{ _key: `${key}-href`, _type: "link", href }],
        children: [{ _key: `${key}-link-text`, _type: "span", text: link.label, marks: [`${key}-href`] }],
      });
    }

    return blocks;
  });

  return {
    article: { title, excerpt, seoTitle: title, seoDescription: excerpt, body },
    serviceCta,
  };
}
