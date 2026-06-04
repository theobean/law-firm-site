import { defineField, defineType } from "sanity";
import { FileText } from "lucide-react";

export const decision = defineType({
  name: "decision",
  title: "Αποφάσεις",
  type: "document",
  icon: FileText,
  fields: [
    defineField({
      name: "title",
      title: "Τίτλος απόφασης",
      type: "string",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "file",
      title: "Αρχείο PDF",
      type: "file",
      options: { accept: ".pdf,.doc,.docx" },
      description: "Προαιρετικό — βάλε PDF ή/και εικόνες παρακάτω.",
    }),
    defineField({
      name: "images",
      title: "Εικόνες απόφασης",
      type: "array",
      of: [{ type: "image", options: { hotspot: true } }],
      description: "Προαιρετικό — μπορείς να ανεβάσεις μία ή περισσότερες εικόνες.",
    }),
    defineField({
      name: "date",
      title: "Ημερομηνία",
      type: "date",
    }),
    defineField({
      name: "court",
      title: "Δικαστήριο / Αρχή",
      type: "string",
      description: "π.χ. Εφετείο Θεσσαλονίκης, Άρειος Πάγος",
    }),
    defineField({
      name: "category",
      title: "Κατηγορία",
      type: "string",
      options: {
        list: [
          { title: "Τραπεζικό", value: "banking" },
          { title: "Εξωδικαστικός", value: "extrajudicial" },
          { title: "Ποινικό", value: "criminal" },
          { title: "Εμπορικό", value: "commercial" },
          { title: "Ακίνητα", value: "realEstate" },
          { title: "Διοικητικό", value: "administrative" },
          { title: "Κληρονομικό", value: "inheritance" },
          { title: "Φορολογικό", value: "tax" },
          { title: "Εργατικό", value: "labor" },
        ],
      },
    }),
    defineField({
      name: "description",
      title: "Σύντομη περιγραφή",
      type: "text",
      rows: 3,
    }),
  ],
  preview: {
    select: { title: "title", court: "court", date: "date", media: "images.0" },
    prepare({ title, court, date, media }) {
      return {
        title,
        media,
        subtitle: [court, date].filter(Boolean).join(" · "),
      };
    },
  },
  orderings: [
    {
      title: "Νεότερες πρώτα",
      name: "dateDesc",
      by: [{ field: "date", direction: "desc" }],
    },
  ],
});
