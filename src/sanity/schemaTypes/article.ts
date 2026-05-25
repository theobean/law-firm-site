import { defineField, defineType } from "sanity";

const categories = [
  { title: "Αστικό Δίκαιο", value: "civil" },
  { title: "Ποινικό Δίκαιο", value: "criminal" },
  { title: "Εμπορικό Δίκαιο", value: "commercial" },
  { title: "Ακίνητη Περιουσία", value: "realEstate" },
  { title: "Εργατικό Δίκαιο", value: "labor" },
  { title: "Διοικητικό Δίκαιο", value: "administrative" },
  { title: "Κληρονομικό Δίκαιο", value: "inheritance" },
  { title: "Φορολογικό Δίκαιο", value: "tax" },
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
