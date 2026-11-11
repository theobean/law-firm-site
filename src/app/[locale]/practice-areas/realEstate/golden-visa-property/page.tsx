import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { routing } from "@/i18n/routing";
import { buildPageMeta } from "@/lib/seo";
import { propertyContactHref } from "@/lib/property-contact";
import { Link } from "@/navigation";

const realEstatePath = "/practice-areas/realEstate";
const pagePath = `${realEstatePath}/golden-visa-property`;
const depositGuidePath = "/blog/prokatavoli-agora-akinitou";

const content = {
  en: {
    seoTitle: "Golden Visa Property Due Diligence in Thessaloniki | Papaioannou",
    description: "Buying property in Thessaloniki, Greece, for a Golden Visa? Have a lawyer review the title, property documents and deposit terms before you pay or sign.",
    title: "Golden Visa property due diligence in Thessaloniki",
    intro: "Has a seller offered you a property in Thessaloniki as suitable for Greece’s Golden Visa? If you are buying from abroad, we can start with the title and any draft agreement you have received. We check the property documents and the terms of the purchase before you pay a deposit or sign.",
    back: "Property purchase and title checks",
    contact: "Request a legal property review",
    checksTitle: "What we check before you commit",
    checks: [
      {
        title: "The seller’s title and the land register",
        text: "We compare the seller’s deed with the Greek Cadastre. We check which property and rights are being transferred, who can sign the sale, and whether there are registered mortgages, charges or claims that could affect the purchase.",
      },
      {
        title: "The documents behind the Golden Visa claim",
        text: "Ask the seller which property requirements they believe the purchase meets and what documents support that. If they are relying on a change from commercial to residential use, we review the documents they provide and identify any points that need confirmation by the engineer or notary.",
      },
      {
        title: "What happens to your deposit if there is a problem",
        text: "We review the written terms to see who receives the deposit, when it is due and when it can be returned. If the terms say nothing about what happens when a title issue or a missing property document stops the purchase, we flag it before you commit.",
      },
    ],
    preparationTitle: "What to have ready when you contact us",
    preparation: "Tell us where the property is and when you have been asked to pay or sign. Have the seller’s deed, the cadastral reference (KAEK), any paperwork the seller gave you about the Golden Visa, and the draft reservation agreement ready if you have them. You can contact us in English or German.",
    depositGuide: "What to check before paying a property deposit",
  },
  de: {
    seoTitle: "Golden Visa: Immobilienprüfung in Thessaloniki | Papaioannou",
    description: "Immobilienkauf in Thessaloniki für ein Golden Visa in Griechenland. Wir prüfen Eigentumsurkunden, Unterlagen und Anzahlungsbedingungen vor dem Kauf.",
    title: "Rechtliche Prüfung beim Immobilienkauf für ein Golden Visa in Thessaloniki",
    intro: "Hat Ihnen ein Verkäufer in Thessaloniki eine Immobilie angeboten, die für das griechische Golden Visa geeignet sein soll? Wenn Sie aus dem Ausland kaufen, können wir mit der Eigentumsurkunde und dem Vertragsentwurf beginnen, den Sie erhalten haben. Wir prüfen die Unterlagen und die Kaufbedingungen, bevor Sie eine Anzahlung leisten oder unterschreiben.",
    back: "Immobilienkauf und Prüfung der Eigentumsurkunden",
    contact: "Rechtliche Immobilienprüfung anfragen",
    checksTitle: "Was wir vor Ihrer Entscheidung prüfen",
    checks: [
      {
        title: "Eigentumsurkunde und Katastereinträge",
        text: "Wir gleichen die Eigentumsurkunde des Verkäufers mit den Einträgen im griechischen Kataster ab. Wir prüfen, welche Immobilie und welche Rechte übertragen werden, wer den Kaufvertrag unterschreiben darf und ob eingetragene Hypotheken, Belastungen oder Ansprüche den Kauf betreffen.",
      },
      {
        title: "Welche Unterlagen die Eignung für das Golden Visa belegen sollen",
        text: "Fragen Sie den Verkäufer, welche Voraussetzungen die Immobilie seiner Einschätzung nach erfüllt und welche Nachweise er dafür hat. Beruft er sich auf eine Umnutzung von Gewerbe- zu Wohnraum, prüfen wir die vorgelegten Unterlagen und klären, welche Punkte der Ingenieur oder Notar bestätigen muss.",
      },
      {
        title: "Was bei Problemen mit Ihrer Anzahlung geschieht",
        text: "Wir prüfen, an wen die Anzahlung geht, wann sie fällig wird und wann sie zurückgezahlt werden kann. Fehlt eine Regelung für den Fall, dass ein Problem mit dem Eigentum oder ein fehlendes Dokument den Kauf verhindert, weisen wir vor der Zahlung darauf hin.",
      },
    ],
    preparationTitle: "Was Sie für das erste Gespräch bereithalten können",
    preparation: "Nennen Sie uns die Lage der Immobilie und den Termin, zu dem Sie zahlen oder unterschreiben sollen. Wenn vorhanden, halten Sie die Eigentumsurkunde, die Katasternummer (KAEK), die Unterlagen des Verkäufers zum Golden Visa und die Reservierungsvereinbarung bereit. Sie können uns auf Deutsch oder Englisch kontaktieren.",
    depositGuide: "Was Sie vor einer Anzahlung prüfen sollten",
  },
  el: {
    seoTitle: "Έλεγχος ακινήτου για Golden Visa στη Θεσσαλονίκη | Παπαϊωάννου",
    description: "Αγορά ακινήτου στη Θεσσαλονίκη για Golden Visa. Ελέγχουμε τίτλους, έγγραφα του ακινήτου και όρους προκαταβολής πριν πληρώσετε ή υπογράψετε.",
    title: "Νομικός έλεγχος ακινήτου για Golden Visa στη Θεσσαλονίκη",
    intro: "Σας πρότεινε ο πωλητής ακίνητο στη Θεσσαλονίκη ως κατάλληλο για Golden Visa; Αν αγοράζετε από το εξωτερικό, μπορούμε να ξεκινήσουμε από τον τίτλο του πωλητή και το σχέδιο συμφωνίας που έχετε στα χέρια σας. Ελέγχουμε τα έγγραφα του ακινήτου και τους όρους της αγοράς πριν δώσετε προκαταβολή ή υπογράψετε.",
    back: "Αγορά ακινήτου και έλεγχος τίτλων",
    contact: "Ζητήστε νομικό έλεγχο ακινήτου",
    checksTitle: "Τι ελέγχουμε πριν δεσμευτείτε",
    checks: [
      {
        title: "Τον τίτλο του πωλητή και τις κτηματολογικές εγγραφές",
        text: "Συγκρίνουμε τον τίτλο του πωλητή με τις εγγραφές του Κτηματολογίου. Ελέγχουμε ποιο ακίνητο και ποια δικαιώματα μεταβιβάζονται, ποιος μπορεί να υπογράψει και αν υπάρχουν καταχωρισμένες υποθήκες, βάρη ή διεκδικήσεις που επηρεάζουν την αγορά.",
      },
      {
        title: "Τα έγγραφα που επικαλείται ο πωλητής για τη Golden Visa",
        text: "Ρωτήστε τον πωλητή ποιες προϋποθέσεις θεωρεί ότι πληροί το ακίνητο και με ποια έγγραφα το τεκμηριώνει. Αν επικαλείται αλλαγή χρήσης από επαγγελματικό χώρο σε κατοικία, εξετάζουμε τα έγγραφα που σας έδωσε και εντοπίζουμε τι χρειάζεται να επιβεβαιώσει ο μηχανικός ή ο συμβολαιογράφος.",
      },
      {
        title: "Τι προβλέπει η συμφωνία για την προκαταβολή",
        text: "Ελέγχουμε ποιος θα εισπράξει την προκαταβολή, πότε πρέπει να την πληρώσετε και πότε προβλέπεται να επιστραφεί. Αν η συμφωνία δεν ορίζει τι γίνεται όταν ένα πρόβλημα στους τίτλους ή η έλλειψη εγγράφου εμποδίσει την αγορά, σας το επισημαίνουμε πριν δεσμευτείτε.",
      },
    ],
    preparationTitle: "Τι να έχετε διαθέσιμο όταν επικοινωνήσετε",
    preparation: "Πείτε μας πού βρίσκεται το ακίνητο και μέχρι πότε σας έχουν ζητήσει να πληρώσετε ή να υπογράψετε. Αν τα έχετε, κρατήστε διαθέσιμα τον τίτλο του πωλητή, τον ΚΑΕΚ, τα έγγραφα που σας έδωσαν για τη Golden Visa και το σχέδιο συμφωνίας κράτησης.",
    depositGuide: "Τι να ελέγξετε πριν δώσετε προκαταβολή",
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
    title: { absolute: title },
    description,
    openGraph: { ...meta.openGraph, title, description },
    twitter: { card: "summary_large_image", title, description, images: meta.openGraph.images },
  };
}

export default async function GoldenVisaPropertyPage({ params }: Props) {
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
            href={propertyContactHref("golden-visa")}
            className="mt-8 inline-flex items-center gap-2 rounded-sm bg-accent px-5 py-3 font-semibold text-primary transition-colors hover:bg-accent/90"
          >
            {page.contact} <ArrowRight size={18} className="shrink-0" aria-hidden="true" />
          </Link>
        </div>
      </section>

      <div className="mx-auto max-w-4xl space-y-12 px-6 py-14 md:py-16">
        <section>
          <h2 className="border-l-4 border-accent pl-4 font-playfair text-2xl font-bold text-primary">
            {page.checksTitle}
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
          <Link
            href={depositGuidePath}
            className="mt-5 inline-flex items-center gap-2 font-semibold text-primary underline underline-offset-4 hover:decoration-accent"
          >
            {page.depositGuide} <ArrowRight size={16} className="shrink-0" aria-hidden="true" />
          </Link>
        </section>
      </div>
    </div>
  );
}
