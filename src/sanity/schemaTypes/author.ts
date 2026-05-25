import { defineField, defineType } from "sanity";

export const author = defineType({
  name: "author",
  title: "Συντάκτης",
  type: "document",
  fields: [
    defineField({
      name: "name",
      title: "Όνομα",
      type: "string",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "role",
      title: "Ιδιότητα",
      type: "string",
      description: "π.χ. Δικηγόρος Παρ' Αρείω Πάγω",
    }),
    defineField({
      name: "bio",
      title: "Σύντομο βιογραφικό",
      type: "text",
      rows: 3,
    }),
    defineField({
      name: "image",
      title: "Φωτογραφία",
      type: "image",
      options: { hotspot: true },
    }),
  ],
  preview: {
    select: { title: "name", subtitle: "role", media: "image" },
  },
});
