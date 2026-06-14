import { getArticlesByCategory } from "@/sanity/client";
import Link from "next/link";
import { ArrowRight, FileText } from "lucide-react";

const i18n = {
  heading: { el: "Σχετικά Άρθρα", en: "Related Articles", de: "Verwandte Artikel" },
  sub: {
    el: "Αναλύσεις και ενημερώσεις του γραφείου μας για το συγκεκριμένο αντικείμενο.",
    en: "Analyses and updates from our firm on this specific area.",
    de: "Analysen und Aktualisierungen unserer Kanzlei zu diesem Bereich.",
  },
  more: { el: "Διαβάστε περισσότερα", en: "Read more", de: "Mehr lesen" },
};

type Article = {
  _id: string;
  title: string;
  excerpt?: string;
  slug?: { current: string };
};

export default async function CategoryArticles({
  category,
  locale,
}: {
  category: string;
  locale: string;
}) {
  let articles: Article[] = [];
  try {
    const all = await getArticlesByCategory(category, 4);
    articles = ((all ?? []) as Article[]).filter((a) => a.slug?.current);
  } catch {
    return null;
  }

  if (articles.length === 0) return null;

  const loc = (locale in i18n.heading ? locale : "el") as keyof typeof i18n.heading;

  return (
    <section className="mt-16 pt-12 border-t border-gray-100">
      <h2 className="text-2xl font-playfair font-bold text-primary mb-2 border-l-4 border-accent pl-4">
        {i18n.heading[loc]}
      </h2>
      <p className="text-gray-500 text-sm mb-8 pl-5">{i18n.sub[loc]}</p>
      <div className="grid sm:grid-cols-2 gap-4">
        {articles.map((a) => (
          <Link
            key={a._id}
            href={`/${locale}/blog/${a.slug!.current}`}
            className="group block border border-gray-200 hover:border-accent/40 rounded-sm p-5 transition-all duration-200 hover:shadow-md"
          >
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5 group-hover:bg-accent/15 transition-colors">
                <FileText size={14} className="text-primary group-hover:text-accent transition-colors" />
              </div>
              <div>
                <p className="font-semibold text-primary text-sm leading-snug mb-1 group-hover:text-accent transition-colors line-clamp-2">
                  {a.title}
                </p>
                {a.excerpt && (
                  <p className="text-gray-500 text-xs leading-relaxed line-clamp-2 mt-1">
                    {a.excerpt}
                  </p>
                )}
                <span className="inline-flex items-center gap-1 text-accent text-xs font-medium mt-2">
                  {i18n.more[loc]} <ArrowRight size={11} />
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
