import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { routing } from "@/i18n/routing";
import { buildPageMeta } from "@/lib/seo";
import { Link } from "@/navigation";

const realEstatePath = "/practice-areas/realEstate";
const pagePath = `${realEstatePath}/agora-akinitou-athina`;
const guidePath = "/blog/agora-akiniton-vimata";
const cadastreOfficeSearch = "https://www.ktimatologio.gr/#ota";

const content = {
  el: {
    seoTitle: "Δικηγόρος για αγορά ακινήτου στην Αθήνα",
    description: "Νομικός έλεγχος τίτλων, βαρών και συμβολαίου για αγορά ακινήτου στην Αθήνα και την Αττική, με συντονισμό από το γραφείο μας στη Θεσσαλονίκη.",
    title: "Νομικός έλεγχος για αγορά ακινήτου στην Αθήνα",
    intro: "Αναλαμβάνουμε τον έλεγχο τίτλων και την υποστήριξη αγοραστών στην Αθήνα και την Αττική από το γραφείο μας στη Θεσσαλονίκη. Αν έχετε βρει ακίνητο και συζητάτε προκαταβολή ή ημερομηνία συμβολαίου, πείτε μας σε ποιο στάδιο βρίσκεστε.",
    back: "Αγορά ακινήτου και έλεγχος τίτλων",
    contact: "Ζητήστε νομικό έλεγχο για ακίνητο στην Αθήνα",
    identificationTitle: "Εντοπισμός ακινήτου στο Κτηματολόγιο",
    identification: "Για τον έλεγχο τίτλων χρειάζεται να προσδιοριστεί το συγκεκριμένο ακίνητο και το αρμόδιο Κτηματολογικό Γραφείο ή Υποκατάστημα. Αναφέρετε τον δήμο και την πλήρη διεύθυνση, γιατί ο όρος «Αθήνα» μπορεί να αφορά διαφορετικούς δήμους της Αττικής. Αν γνωρίζετε τον ΚΑΕΚ, δηλαδή τον κωδικό του ακινήτου στο Κτηματολόγιο, κρατήστε τον διαθέσιμο μαζί με τον τίτλο του πωλητή.",
    cadastreLink: "Αναζήτηση περιοχής ή γραφείου στο Ελληνικό Κτηματολόγιο",
    apartment: "Για διαμέρισμα, σημειώστε τον όροφο και αν η συμφωνία περιλαμβάνει αποθήκη ή θέση στάθμευσης. Ζητήστε τα αντίστοιχα στοιχεία από τον πωλητή ώστε να ελεγχθεί πώς αποτυπώνονται στους τίτλους.",
    preparationTitle: "Τι να συγκεντρώσετε για την πρώτη επικοινωνία",
    checklist: [
      "Δήμο, διεύθυνση, είδος ακινήτου και ΚΑΕΚ, αν είναι διαθέσιμος.",
      "Αντίγραφο του τίτλου του πωλητή και στοιχεία για αποθήκη ή στάθμευση, εφόσον περιλαμβάνονται.",
      "Σχέδιο συμφωνητικού, όρους προκαταβολής και τυχόν προθεσμία υπογραφής.",
    ],
    coordinationTitle: "Αν βρίσκεστε εκτός Αθήνας",
    coordination: "Στην πρώτη επικοινωνία πείτε μας πού βρίσκεστε και πότε μπορείτε να βρεθείτε στην Αθήνα. Συζητάμε ποια έγγραφα μπορούν να ελεγχθούν εκ των προτέρων, τι εκκρεμεί από τον πωλητή ή τον συμβολαιογράφο και πώς συνδέεται ο έλεγχος με την προθεσμία σας.",
    representation: "Αν δυσκολεύεστε να παρευρεθείτε στην υπογραφή, αναφέρετέ το από την αρχή. Εξετάζουμε με τον συμβολαιογράφο αν μπορεί να χρησιμοποιηθεί πληρεξούσιο για τη συγκεκριμένη συναλλαγή και ποιες ενέργειες χρειάζονται πριν οριστεί ημερομηνία.",
    guideLink: "Δείτε τα 7 βήματα για αγορά ακινήτου στην Ελλάδα",
  },
  en: {
    seoTitle: "Lawyer for buying property in Athens",
    description: "Title, encumbrance and deed checks for buyers in Athens and Attica, coordinated from our Thessaloniki office.",
    title: "Legal checks for buying property in Athens",
    intro: "From our Thessaloniki office, we review title and support buyers purchasing property in Athens and Attica. If you have found a property and are discussing a deposit or signing date, let us know what stage you have reached.",
    back: "Property purchase and title checks",
    contact: "Request a legal review for a property in Athens",
    identificationTitle: "Identifying the property in the Greek Cadastre",
    identification: "A title check starts with identifying the property and the relevant Cadastral Office or branch. Give us the municipality and full address, as an Athens address may fall within one of several municipalities in Attica. If you know the cadastral reference number, known as the KAEK, have it available alongside the seller’s deed.",
    cadastreLink: "Look up an area or office in the Greek Cadastre",
    apartment: "For a flat, note the floor and whether the sale includes a storage unit or parking space. Ask the seller for the relevant details so we can check how they are recorded in the title documents.",
    preparationTitle: "What to gather before contacting us",
    checklist: [
      "The municipality, address, property type and cadastral reference (KAEK), if available.",
      "A copy of the seller’s deed and details of any storage unit or parking space included.",
      "Any draft agreement, proposed deposit terms and signing deadline.",
    ],
    coordinationTitle: "If you are based outside Athens",
    coordination: "At first contact, tell us where you are based and when you can be in Athens. We can discuss which documents can be reviewed in advance, what is still needed from the seller or notary, and how the review fits your deadline.",
    representation: "If attending the signing may be difficult, tell us early. We discuss with the notary whether a power of attorney can be used for your purchase and what needs to be arranged before setting a date.",
    guideLink: "Read the seven steps to buying property in Greece",
  },
  de: {
    seoTitle: "Anwalt für den Immobilienkauf in Athen",
    description: "Prüfung von Eigentumstiteln, Belastungen und Kaufvertrag in Athen und Attika durch unsere Kanzlei in Thessaloniki.",
    title: "Rechtliche Prüfung beim Immobilienkauf in Athen",
    intro: "Von unserer Kanzlei in Thessaloniki aus prüfen wir Eigentumstitel und begleiten Käufer von Immobilien in Athen und Attika. Wenn Sie bereits eine Immobilie gefunden haben und über eine Anzahlung oder einen Termin zur Unterzeichnung sprechen, teilen Sie uns den aktuellen Stand mit.",
    back: "Immobilienkauf und Prüfung der Eigentumstitel",
    contact: "Rechtliche Prüfung für eine Immobilie in Athen anfragen",
    identificationTitle: "Die Immobilie im griechischen Kataster ermitteln",
    identification: "Für die Titelprüfung müssen die Immobilie und das zuständige Katasteramt oder dessen Außenstelle feststehen. Geben Sie die Gemeinde und die vollständige Adresse an, da mit Athen auch unterschiedliche Gemeinden in Attika gemeint sein können. Halten Sie die Katasternummer (KAEK) zusammen mit der Urkunde des Verkäufers bereit, sofern Sie diese Angaben haben.",
    cadastreLink: "Ort oder Amt im griechischen Kataster suchen",
    apartment: "Bei einer Wohnung geben Sie das Stockwerk an und teilen uns mit, ob ein Abstellraum oder Stellplatz zum Kauf gehört. Fragen Sie den Verkäufer nach den entsprechenden Angaben, damit wir prüfen können, wie diese in den Eigentumstiteln erfasst sind.",
    preparationTitle: "Welche Angaben und Unterlagen Sie bereithalten können",
    checklist: [
      "Gemeinde, Adresse, Art der Immobilie und gegebenenfalls die Katasternummer (KAEK).",
      "Eine Kopie der Eigentumsurkunde des Verkäufers und Angaben zu mitverkauften Abstellräumen oder Stellplätzen.",
      "Einen vorhandenen Vertragsentwurf, die Bedingungen für die Anzahlung und eine etwaige Frist zur Unterzeichnung.",
    ],
    coordinationTitle: "Wenn Sie sich außerhalb Athens aufhalten",
    coordination: "Teilen Sie uns beim ersten Kontakt mit, wo Sie sich aufhalten und wann Sie nach Athen kommen können. Wir besprechen, welche Unterlagen sich vorab prüfen lassen, was vom Verkäufer oder Notar noch benötigt wird und wie die Prüfung in Ihren Zeitrahmen passt.",
    representation: "Falls Sie bei der Unterzeichnung voraussichtlich nicht anwesend sein können, sagen Sie uns frühzeitig Bescheid. Wir klären mit dem Notar, ob für Ihren Kauf eine Vollmacht in Betracht kommt und was vor der Terminvereinbarung zu erledigen ist.",
    guideLink: "Lesen Sie die sieben Schritte zum Immobilienkauf in Griechenland",
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

export default async function AthensPropertyPurchasePage({ params }: Props) {
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
            {page.identificationTitle}
          </h2>
          <p className="mt-5 leading-relaxed text-gray-700">{page.identification}</p>
          <p className="mt-3 leading-relaxed text-gray-700">{page.apartment}</p>
          <a
            href={cadastreOfficeSearch}
            className="mt-4 inline-block font-semibold text-primary underline underline-offset-4 hover:decoration-accent"
          >
            {page.cadastreLink}
          </a>
        </section>

        <section className="rounded-sm border border-primary/10 bg-primary/5 p-5 md:p-7">
          <h2 className="font-playfair text-2xl font-bold text-primary">{page.preparationTitle}</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 leading-relaxed text-gray-700">
            {page.checklist.map((item) => <li key={item}>{item}</li>)}
          </ul>
        </section>

        <section>
          <h2 className="border-l-4 border-accent pl-4 font-playfair text-2xl font-bold text-primary">
            {page.coordinationTitle}
          </h2>
          <p className="mt-5 leading-relaxed text-gray-700">{page.coordination}</p>
          <p className="mt-3 leading-relaxed text-gray-700">{page.representation}</p>
          <Link
            href={guidePath}
            className="mt-5 inline-flex items-center gap-2 font-semibold text-primary underline underline-offset-4 hover:decoration-accent"
          >
            {page.guideLink} <ArrowRight size={16} className="shrink-0" aria-hidden="true" />
          </Link>
        </section>
      </div>
    </div>
  );
}
