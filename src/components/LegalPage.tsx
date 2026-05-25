import { ReactNode } from "react";

interface Section {
  title: string;
  body: string;
}

interface LegalPageProps {
  title: string;
  intro: string;
  sections: Section[];
  lastUpdatedLabel: string;
  lastUpdatedDate: string;
}

export default function LegalPage({
  title,
  intro,
  sections,
  lastUpdatedLabel,
  lastUpdatedDate,
}: LegalPageProps): ReactNode {
  return (
    <div className="bg-white">
      <section className="bg-primary py-24 text-white">
        <div className="max-w-3xl mx-auto px-6">
          <div className="border-l-4 border-accent pl-6">
            <h1 className="text-4xl md:text-5xl font-playfair font-bold">{title}</h1>
            <p className="text-white/60 text-sm mt-3">
              {lastUpdatedLabel}: {lastUpdatedDate}
            </p>
          </div>
        </div>
      </section>

      <section className="max-w-3xl mx-auto px-6 py-16">
        <p className="text-gray-700 leading-relaxed mb-12 text-lg">{intro}</p>

        <div className="space-y-10">
          {sections.map((s) => (
            <div key={s.title}>
              <h2 className="text-xl font-bold text-primary mb-3 border-l-4 border-accent pl-4">
                {s.title}
              </h2>
              <p className="text-gray-600 leading-relaxed pl-5">{s.body}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
