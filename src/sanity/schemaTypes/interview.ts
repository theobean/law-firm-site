import { defineField, defineType } from "sanity";

export const interview = defineType({
  name: "interview",
  title: "Τηλεοπτική Συνέντευξη",
  type: "document",
  fields: [
    defineField({
      name: "title",
      title: "Τίτλος συνέντευξης",
      type: "string",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "youtubeUrl",
      title: "YouTube URL",
      type: "url",
      description: "π.χ. https://www.youtube.com/watch?v=XXXXX ή https://youtu.be/XXXXX",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "show",
      title: "Εκπομπή / Κανάλι",
      type: "string",
      description: "π.χ. ΣΚΑΪ, ΑΝΤ1, Star, Voria.gr",
    }),
    defineField({
      name: "date",
      title: "Ημερομηνία",
      type: "date",
      options: { dateFormat: "DD/MM/YYYY" },
    }),
    defineField({
      name: "description",
      title: "Σύντομη περιγραφή (προαιρετικό)",
      type: "text",
      rows: 3,
    }),
  ],
  preview: {
    select: { title: "title", subtitle: "show", date: "date" },
    prepare({ title, subtitle, date }) {
      return {
        title,
        subtitle: [subtitle, date].filter(Boolean).join(" · "),
      };
    },
  },
});
