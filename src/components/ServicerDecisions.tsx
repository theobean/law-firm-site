import { getDecisions } from "@/sanity/client";
import { Link } from "@/navigation";
import { ArrowRight, Scale } from "lucide-react";

const i18n = {
  heading: { el: "Αποφάσεις που έχουμε κερδίσει", en: "Decisions We Have Won", de: "Gewonnene Entscheidungen" },
  sub:     { el: "Πραγματικές υποθέσεις απέναντι σε εταιρείες διαχείρισης απαιτήσεων.", en: "Real cases against debt management companies.", de: "Echte Fälle gegen Forderungsmanagementgesellschaften." },
  more:    { el: "Διαβάστε την απόφαση", en: "Read the decision", de: "Entscheidung lesen" },
};

type Decision = {
  _id: string;
  title: string;
  description?: string;
  slug?: { current: string };
  category: string;
};

export default async function ServicerDecisions({ locale }: { locale: string }) {
  let decisions: Decision[] = [];
  try {
    const all = await getDecisions();
    decisions = ((all ?? []) as Decision[])
      .filter((d) => d.category === "banking" && d.slug?.current)
      .slice(0, 4);
  } catch {
    return null;
  }

  if (decisions.length === 0) return null;

  const loc = (locale as keyof typeof i18n.heading) in i18n.heading ? (locale as keyof typeof i18n.heading) : "el";

  return (
    <section className="mb-16">
      <h2 className="text-2xl font-playfair font-bold text-primary mb-2 border-l-4 border-accent pl-4">
        {i18n.heading[loc]}
      </h2>
      <p className="text-gray-500 text-sm mb-8 pl-5">{i18n.sub[loc]}</p>
      <div className="grid sm:grid-cols-2 gap-4">
        {decisions.map((d) => (
          <Link
            key={d._id}
            href={`/decisions/${d.slug!.current}`}
            className="group block border border-gray-200 hover:border-accent/40 rounded-sm p-5 transition-all duration-200 hover:shadow-md"
          >
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5 group-hover:bg-accent/15 transition-colors">
                <Scale size={14} className="text-primary group-hover:text-accent transition-colors" />
              </div>
              <div>
                <p className="font-semibold text-primary text-sm leading-snug mb-1 group-hover:text-accent transition-colors line-clamp-3">
                  {d.title}
                </p>
                {d.description && (
                  <p className="text-gray-500 text-xs leading-relaxed line-clamp-2 mt-1">
                    {d.description}
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
