import { getArticles } from "@/sanity/client";
import { Link } from "@/navigation";
import { ArrowRight, FileText, Calendar } from "lucide-react";

const i18n = {
  eyebrow: { el: "ΠΡΟΣΦΑΤΑ ΑΡΘΡΑ", en: "RECENT ARTICLES", de: "AKTUELLE ARTIKEL" },
  heading: {
    el: "Νέο άρθρο κάθε μήνα από τους δικηγόρους μας",
    en: "A new article every month from our lawyers",
    de: "Jeden Monat ein neuer Artikel unserer Anwälte",
  },
  sub: {
    el: "Αναλύσεις νομολογίας, αλλαγών στη νομοθεσία και πρακτικών ζητημάτων από το γραφείο μας.",
    en: "Case-law analyses, legislative changes and practical issues from our office.",
    de: "Rechtsprechungsanalysen, Gesetzesänderungen und Praxisfragen aus unserer Kanzlei.",
  },
  viewAll: { el: "Όλα τα άρθρα", en: "All articles", de: "Alle Artikel" },
  more: { el: "Διαβάστε", en: "Read", de: "Lesen" },
  by: { el: "από", en: "by", de: "von" },
  defaultAuthor: { el: "Ιωάννης Παπαϊωάννου", en: "Ioannis Papaioannou", de: "Ioannis Papaioannou" },
};

type Article = {
  _id: string;
  title: string;
  excerpt?: string;
  slug?: { current: string };
  publishedAt?: string;
  author?: { name?: string };
};

export default async function LatestArticles({ locale }: { locale: string }) {
  let articles: Article[] = [];
  try {
    const all = await getArticles();
    articles = ((all ?? []) as Article[]).filter((a) => a.slug?.current).slice(0, 3);
  } catch {
    return null;
  }

  if (articles.length === 0) return null;

  const loc = (locale in i18n.heading ? locale : "el") as keyof typeof i18n.heading;
  const dateFormat = loc === "el" ? "el-GR" : loc === "de" ? "de-DE" : "en-GB";

  return (
    <section className="bg-gray-50 py-20">
      <div className="max-w-6xl mx-auto px-6">
        <div className="mb-12">
          <p className="text-accent text-xs uppercase tracking-widest font-semibold mb-3">
            {i18n.eyebrow[loc]}
          </p>
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <h2 className="text-3xl md:text-4xl font-playfair font-bold text-primary border-l-4 border-accent pl-6 max-w-2xl leading-tight">
              {i18n.heading[loc]}
            </h2>
            <Link
              href="/blog"
              className="inline-flex items-center gap-2 text-primary hover:text-accent text-sm font-semibold transition-colors flex-shrink-0"
            >
              {i18n.viewAll[loc]} <ArrowRight size={14} />
            </Link>
          </div>
          <p className="text-gray-600 text-base mt-4 pl-6 max-w-3xl">{i18n.sub[loc]}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {articles.map((a) => (
            <Link
              key={a._id}
              href={`/blog/${a.slug!.current}`}
              className="group bg-white border border-gray-200 hover:border-accent/40 rounded-sm p-6 transition-all duration-200 hover:shadow-lg flex flex-col"
            >
              <div className="w-10 h-10 rounded-full bg-primary/10 group-hover:bg-accent/15 flex items-center justify-center mb-4 transition-colors">
                <FileText size={16} className="text-primary group-hover:text-accent transition-colors" />
              </div>
              <h3 className="font-playfair font-bold text-primary text-lg leading-snug mb-3 group-hover:text-accent transition-colors line-clamp-3">
                {a.title}
              </h3>
              {a.excerpt && (
                <p className="text-gray-600 text-sm leading-relaxed line-clamp-3 mb-4 flex-grow">
                  {a.excerpt}
                </p>
              )}
              <div className="mt-auto pt-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                <span className="flex items-center gap-1.5">
                  <Calendar size={12} className="text-accent" />
                  {a.publishedAt ? new Date(a.publishedAt).toLocaleDateString(dateFormat, { day: "numeric", month: "short", year: "numeric" }) : ""}
                </span>
                <span className="inline-flex items-center gap-1 text-accent font-semibold uppercase tracking-wider">
                  {i18n.more[loc]} <ArrowRight size={11} />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
