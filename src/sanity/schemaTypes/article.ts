import { defineField, defineType } from "sanity";

const categories = [
  { title: "Τραπεζικό Δίκαιο & Ανακοπές", value: "banking" },
  { title: "Εξωδικαστικός Μηχανισμός", value: "extrajudicial" },
  { title: "Ποινικό Δίκαιο", value: "criminal" },
  { title: "Εμπορικό Δίκαιο", value: "commercial" },
  { title: "Ακίνητη Περιουσία", value: "realEstate" },
  { title: "Διοικητικό Δίκαιο", value: "administrative" },
  { title: "Κληρονομικό Δίκαιο", value: "inheritance" },
  { title: "Φορολογικό Δίκαιο", value: "tax" },
  { title: "Εργατικό Δίκαιο", value: "labor" },
  { title: "Γενικά", value: "general" },
];

export const article = defineType({
  name: "article",
  title: "Άρθρο",
  type: "document",
  fields: [
    defineField({
      name: "title",
      title: "Τίτλος",
      type: "string",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "slug",
      title: "URL (slug)",
      type: "slug",
      options: { source: "title" },
      validation: (r) => r.required(),
    }),
    defineField({
      name: "category",
      title: "Κατηγορία",
      type: "string",
      options: { list: categories, layout: "dropdown" },
      initialValue: "general",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "tags",
      title: "Ετικέτες (tags)",
      type: "array",
      of: [{ type: "string" }],
      options: { layout: "tags" },
    }),
    defineField({
      name: "author",
      title: "Συντάκτης",
      type: "reference",
      to: [{ type: "author" }],
    }),
    defineField({
      name: "publishedAt",
      title: "Ημερομηνία δημοσίευσης",
      type: "datetime",
      initialValue: () => new Date().toISOString(),
    }),
    defineField({
      name: "mainImage",
      title: "Κύρια εικόνα",
      type: "image",
      options: { hotspot: true },
    }),
    defineField({
      name: "excerpt",
      title: "Σύνοψη",
      type: "text",
      rows: 3,
    }),
    defineField({
      name: "body",
      title: "Κείμενο",
      type: "array",
      of: [{ type: "block" }, { type: "image", options: { hotspot: true } }],
    }),
    // ─── SEO ────────────────────────────────────────────────────
    defineField({
      name: "seoTitle",
      title: "SEO Τίτλος",
      type: "string",
      description: "Τίτλος για Google (αν διαφέρει από τον τίτλο του άρθρου). Μέγιστο 60 χαρακτήρες.",
      validation: (r) => r.max(60),
      group: "seo",
    }),
    defineField({
      name: "seoDescription",
      title: "Meta Description",
      type: "text",
      rows: 3,
      description: "Περιγραφή για Google και social media. Ιδανικά 120–160 χαρακτήρες.",
      validation: (r) => r.max(160),
      group: "seo",
    }),
  ],
  groups: [
    { name: "seo", title: "SEO", icon: () => "🔍" },
  ],
  preview: {
    select: { title: "title", media: "mainImage", date: "publishedAt" },
    prepare({ title, media, date }) {
      return {
        title,
        media,
        subtitle: date ? new Date(date).toLocaleDateString("el-GR") : "",
      };
    },
  },
});
