import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { routing } from "@/i18n/routing";
import { buildPageMeta } from "@/lib/seo";
import { Link } from "@/navigation";

const realEstatePath = "/practice-areas/realEstate";
const pagePath = `${realEstatePath}/agora-neodmitou`;

const content = {
  el: {
    seoTitle: "Δικηγόρος για Αγορά Νεόδμητου στη Θεσσαλονίκη",
    description: "Νομικός έλεγχος τίτλων, όρων πληρωμής και παράδοσης για αγορά νεόδμητου ή υπό κατασκευή ακινήτου στη Θεσσαλονίκη.",
    title: "Αγορά νεόδμητου και έλεγχος εργολαβικού συμβολαίου στη Θεσσαλονίκη",
    intro: "Αν αγοράζετε νεόδμητο ή υπό κατασκευή ακίνητο, ελέγχουμε ποιος μπορεί να σας το μεταβιβάσει, τι δεσμεύεται να παραδώσει και πότε προβλέπεται να πληρώσετε.",
    back: "Αγορά ακινήτου και έλεγχος τίτλων",
    contact: "Ζητήστε έλεγχο εργολαβικού συμβολαίου",
    scope: "Τι εξετάζουμε πριν από την υπογραφή",
    checks: [
      {
        title: "Τίτλοι και δικαίωμα μεταβίβασης",
        text: "Ελέγχουμε τους τίτλους, τα καταχωρισμένα βάρη και τη σχέση μεταξύ του ιδιοκτήτη, του εργολάβου και του προσώπου που θα υπογράψει ως πωλητής.",
      },
      {
        title: "Περιγραφή του ακινήτου και τίμημα",
        text: "Διαβάζουμε πώς περιγράφονται στο σχέδιο σύμβασης το διαμέρισμα, τυχόν αποθήκη ή θέση στάθμευσης και οι προδιαγραφές που συμφωνείτε. Εξετάζουμε τις ημερομηνίες πληρωμής και τη σύνδεσή τους με την πρόοδο του έργου, όπου προβλέπεται.",
      },
      {
        title: "Παράδοση, καθυστερήσεις και αλλαγές",
        text: "Εξετάζουμε πότε προβλέπεται να παραδοθεί το ακίνητο και τι ορίζουν οι όροι αν αλλάξουν οι προδιαγραφές, καθυστερήσει η παράδοση ή δεν προχωρήσει η αγορά.",
      },
    ],
    preparationTitle: "Τι να έχετε για την πρώτη επικοινωνία",
    preparation: "Αναφέρετε ποιο ακίνητο σας ενδιαφέρει και αν έχει οριστεί ημερομηνία προκαταβολής ή υπογραφής. Αν τα έχετε, κρατήστε διαθέσιμα το σχέδιο συμφωνίας, την κάτοψη, τις προδιαγραφές και το χρονοδιάγραμμα πληρωμών ή παράδοσης.",
    lawyer: "Λαμπρινή Παπαϊωάννου",
    role: "Δικηγόρος Παρ’ Εφέταις",
    biography: "Η Λαμπρινή Παπαϊωάννου αναλαμβάνει τον νομικό έλεγχο τίτλων και εργολαβικών συμβολαίων για αγοραστές σε νέες κατασκευές.",
    team: "Γνωρίστε την ομάδα του γραφείου",
  },
  en: {
    seoTitle: "New-Build Property Lawyer in Thessaloniki",
    description: "Legal review of title, payment terms and handover provisions when buying a newly built or off-plan property in Thessaloniki.",
    title: "Buying a new-build property in Thessaloniki and reviewing the developer agreement",
    intro: "If you are buying a new-build or off-plan property, we check who can transfer ownership, what the seller has agreed to deliver and when your payments are due.",
    back: "Property purchase and title checks",
    contact: "Request a review of the developer agreement",
    scope: "What we check before you sign",
    checks: [
      {
        title: "Title and authority to sell",
        text: "We check title, registered encumbrances and the relationship between the landowner, the developer and the person who will sign as the seller.",
      },
      {
        title: "Property description and purchase price",
        text: "We check how the draft describes the flat, any storage unit or parking space, and the agreed specifications. We review payment dates and how they are linked to construction milestones where the agreement provides for this.",
      },
      {
        title: "Handover, delays and changes",
        text: "We review the agreed handover date and what the agreement says if the specifications change, handover is delayed or the purchase falls through.",
      },
    ],
    preparationTitle: "What to have ready for the first discussion",
    preparation: "Tell us which property you are considering and whether a deposit or signing date has been set. If available, have the draft agreement, floor plan, specifications and payment or handover schedule to hand.",
    lawyer: "Lampriní Papaioannou",
    role: "Attorney at the Court of Appeal",
    biography: "Lampriní Papaioannou reviews titles and developer agreements for buyers of newly built and off-plan properties.",
    team: "Meet the team",
  },
  de: {
    seoTitle: "Anwältin für den Neubaukauf in Thessaloniki",
    description: "Rechtliche Prüfung der Eigentumstitel sowie der Zahlungs- und Übergabebedingungen beim Kauf einer Neubauimmobilie in Thessaloniki.",
    title: "Neubaukauf und Prüfung des Bauträgervertrags in Thessaloniki",
    intro: "Beim Kauf einer neuen oder noch im Bau befindlichen Immobilie prüfen wir, wer das Eigentum übertragen kann, welche Leistungen der Verkäufer schuldet und wann die Zahlungen fällig sind.",
    back: "Immobilienkauf und Prüfung der Eigentumstitel",
    contact: "Prüfung des Bauträgervertrags anfragen",
    scope: "Was wir vor der Unterschrift prüfen",
    checks: [
      {
        title: "Eigentumstitel und Verkaufsberechtigung",
        text: "Wir prüfen die Eigentumstitel, eingetragene Belastungen und das Verhältnis zwischen dem Grundstückseigentümer, dem Bauträger und der Person, die als Verkäufer unterschreibt.",
      },
      {
        title: "Beschreibung der Immobilie und Kaufpreis",
        text: "Wir prüfen, wie der Entwurf die Wohnung, einen etwaigen Abstellraum oder Stellplatz und die vereinbarte Ausstattung beschreibt. Wir prüfen auch, wann Zahlungen fällig werden und ob sie an bestimmte Bauabschnitte geknüpft sind.",
      },
      {
        title: "Übergabe, Verzögerungen und Änderungen",
        text: "Wir prüfen den vorgesehenen Übergabetermin und die Regelungen für den Fall, dass sich die Ausstattung ändert, die Übergabe verzögert oder der Kauf nicht zustande kommt.",
      },
    ],
    preparationTitle: "Unterlagen für das erste Gespräch",
    preparation: "Teilen Sie uns mit, für welche Immobilie Sie sich interessieren und ob bereits ein Termin für die Anzahlung oder die Unterzeichnung vereinbart wurde. Halten Sie, soweit vorhanden, den Vertragsentwurf, den Grundriss, die Baubeschreibung und den Zahlungs- oder Übergabeplan bereit.",
    lawyer: "Lampriní Papaioannou",
    role: "Rechtsanwältin am Berufungsgericht",
    biography: "Lampriní Papaioannou prüft Eigentumstitel und Bauträgerverträge für Käufer neuer oder noch im Bau befindlicher Immobilien.",
    team: "Lernen Sie das Kanzleiteam kennen",
  },
};

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();

  const { seoTitle: title, description } = content[locale];
  const meta = buildPageMeta(locale, pagePath);

  return {
    ...meta,
    title,
    description,
    openGraph: { ...meta.openGraph, title, description },
    twitter: { card: "summary_large_image", title, description, images: meta.openGraph.images },
  };
}

export default async function NewBuildPurchasePage({ params }: Props) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  const page = content[locale];

  return (
    <div className="bg-white">
      <section className="bg-primary py-16 text-white md:py-24">
        <div className="mx-auto max-w-4xl px-6">
          <Link
            href={realEstatePath}
            className="mb-6 inline-flex items-center gap-2 text-sm text-white/75 transition-colors hover:text-accent"
          >
            <ArrowLeft size={16} aria-hidden="true" /> {page.back}
          </Link>
          <div className="border-l-4 border-accent pl-5 md:pl-6">
            <h1 className="font-playfair text-3xl font-bold md:text-5xl">{page.title}</h1>
            <p className="mt-4 max-w-3xl text-lg leading-relaxed text-white/85">{page.intro}</p>
          </div>
          <Link
            href="/contact"
            className="mt-8 inline-flex items-center gap-2 rounded-sm bg-accent px-5 py-3 font-semibold text-primary transition-colors hover:bg-accent/90"
          >
            {page.contact} <ArrowRight size={18} className="shrink-0" aria-hidden="true" />
          </Link>
        </div>
      </section>

      <div className="mx-auto max-w-4xl space-y-12 px-6 py-14 md:py-16">
        <section>
          <h2 className="border-l-4 border-accent pl-4 font-playfair text-2xl font-bold text-primary">
            {page.scope}
          </h2>
          <div className="mt-5 divide-y divide-gray-200">
            {page.checks.map(({ title, text }) => (
              <div className="py-5" key={title}>
                <h3 className="font-playfair text-xl font-semibold text-primary">{title}</h3>
                <p className="mt-2 leading-relaxed text-gray-700">{text}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-sm border border-primary/10 bg-primary/5 p-5 md:p-7">
          <h2 className="font-playfair text-2xl font-bold text-primary">{page.preparationTitle}</h2>
          <p className="mt-3 leading-relaxed text-gray-700">{page.preparation}</p>
        </section>

        <section className="flex flex-col items-start gap-5 border-t border-gray-200 pt-8 sm:flex-row sm:gap-7">
          <div className="relative h-28 w-24 shrink-0 overflow-hidden rounded-sm bg-primary">
            <Image
              src="/λαμπρινη.png"
              alt=""
              fill
              sizes="96px"
              className="object-cover object-top"
            />
          </div>
          <div>
            <h2 className="font-playfair text-2xl font-bold text-primary">{page.lawyer}</h2>
            <p className="mt-1 text-sm font-medium text-gray-600">{page.role}</p>
            <p className="mt-3 leading-relaxed text-gray-700">{page.biography}</p>
            <Link href="/about" className="mt-3 inline-flex items-center gap-2 font-semibold text-primary underline underline-offset-4 hover:decoration-accent">
              {page.team} <ArrowRight size={16} className="shrink-0" aria-hidden="true" />
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
