import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { ArrowLeft, ArrowRight } from "lucide-react";
import FaqAccordion from "@/components/FaqAccordion";
import { routing } from "@/i18n/routing";
import { buildPageMeta } from "@/lib/seo";
import { propertyContactHref } from "@/lib/property-contact";
import { Link } from "@/navigation";

const realEstatePath = "/practice-areas/realEstate";
const pagePath = `${realEstatePath}/agora-neodmitou`;

const content = {
  el: {
    seoTitle: "Δικηγόρος για αγορά νεόδμητου στη Θεσσαλονίκη | Παπαϊωάννου",
    description: "Αγοράζετε νεόδμητο ή ακίνητο υπό κατασκευή στη Θεσσαλονίκη; Ελέγχουμε τους τίτλους, το εργολαβικό συμβόλαιο και τους όρους πληρωμής και παράδοσης.",
    title: "Αγορά νεόδμητου και έλεγχος εργολαβικού συμβολαίου στη Θεσσαλονίκη",
    intro: "Αν ο εργολάβος σάς έδωσε κάτοψη και πρόγραμμα δόσεων για διαμέρισμα υπό κατασκευή, κρατήστε τα μαζί με το σχέδιο της συμφωνίας. Ελέγχουμε τι δεσμεύεται να παραδώσει ο πωλητής, πότε οφείλεται κάθε δόση και ποιος έχει δικαίωμα να υπογράψει τη μεταβίβαση.",
    back: "Αγορά ακινήτου και έλεγχος τίτλων",
    contact: "Ζητήστε έλεγχο εργολαβικού συμβολαίου",
    scope: "Τι ελέγχουμε στους τίτλους και στο εργολαβικό",
    checks: [
      {
        title: "Ποιος έχει δικαίωμα να σας πουλήσει το ακίνητο",
        text: "Ξεκινάμε από τους τίτλους και τα καταχωρισμένα βάρη. Αν άλλος έχει το οικόπεδο και άλλος χτίζει, διαβάζουμε και τη μεταξύ τους συμφωνία για να δούμε ποιος μπορεί να μεταβιβάσει το συγκεκριμένο διαμέρισμα.",
      },
      {
        title: "Τι περιλαμβάνει η αγορά και πότε πληρώνετε",
        text: "Διαβάζουμε το σχέδιο του συμβολαίου μαζί με την κάτοψη. Ελέγχουμε πώς περιγράφονται το διαμέρισμα και τυχόν αποθήκη ή θέση στάθμευσης που περιλαμβάνεται στην αγορά. Αν μια δόση συνδέεται με την πρόοδο του έργου, κοιτάζουμε ποιο στάδιο πρέπει να έχει ολοκληρωθεί για να την καταβάλετε.",
      },
      {
        title: "Τι προβλέπει η συμφωνία για την παράδοση",
        text: "Κοιτάζουμε πότε προβλέπεται να παραλάβετε το διαμέρισμα και με ποιες προδιαγραφές. Εξετάζουμε επίσης τι ορίζει το κείμενο αν αλλάξει η κάτοψη, καθυστερήσει το έργο ή δεν προχωρήσει η αγορά.",
      },
    ],
    preparationTitle: "Έχετε ήδη στα χέρια σας σχέδιο συμφωνίας;",
    preparation: "Στην πρώτη επικοινωνία πείτε μας ποιο είναι το διαμέρισμα και μέχρι πότε σας ζητούν να πληρώσετε ή να υπογράψετε. Κρατήστε διαθέσιμα όσα σας έχουν δώσει, ιδίως το σχέδιο της συμφωνίας, την κάτοψη, τις τεχνικές προδιαγραφές και το χρονοδιάγραμμα πληρωμών ή παράδοσης.",
    questionsTitle: "Συχνές ερωτήσεις για την αγορά νεόδμητου",
    questions: [
      {
        title: "Μου ζητούν χρήματα για να κρατήσουν το διαμέρισμα. Τι κοιτάζω πριν πληρώσω;",
        text: "Ζητήστε τους όρους γραπτώς. Δείτε ποιος εισπράττει το ποσό, ποιο διαμέρισμα κρατούν για εσάς, μέχρι πότε ισχύει η κράτηση και αν το ποσό αφαιρείται από το τίμημα. Κοιτάξτε τι λέει η συμφωνία για την επιστροφή των χρημάτων αν ο έλεγχος τίτλων δείξει πρόβλημα ή αν δεν εγκριθεί το δάνειο που χρειάζεστε για την αγορά.",
      },
      {
        title: "Ποιος υπογράφει αν ο εργολάβος και ο οικοπεδούχος είναι διαφορετικά πρόσωπα;",
        text: "Το βλέπουμε στους τίτλους, στο εργολαβικό συμβόλαιο και σε τυχόν πληρεξούσιο. Ελέγχουμε ποιος μπορεί να υπογράψει τη μεταβίβαση του συγκεκριμένου διαμερίσματος και ποιος έχει αναλάβει να το ολοκληρώσει και να σας το παραδώσει.",
      },
      {
        title: "Τι να ζητήσω από τον μηχανικό για ένα διαμέρισμα υπό κατασκευή;",
        text: "Ζητήστε να συγκρίνει την κάτοψη που σας έδωσαν με τα σχέδια της οικοδομικής άδειας. Ο μηχανικός μπορεί επίσης να ελέγξει την πρόοδο του έργου και τις τεχνικές προδιαγραφές. Εμείς εξετάζουμε τι έχει δεσμευτεί να παραδώσει ο πωλητής. Αν ο μηχανικός βρει διαφορά, ζητήστε να αποτυπωθεί η λύση που θα συμφωνήσετε στο σχέδιο του συμβολαίου πριν υπογράψετε.",
      },
    ],
    lawyer: "Λαμπρινή Παπαϊωάννου",
    role: "Δικηγόρος Παρ’ Εφέταις",
    biography: "Η Λαμπρινή Παπαϊωάννου αναλαμβάνει τον έλεγχο τίτλων και εργολαβικών συμβολαίων για όσους αγοράζουν νεόδμητο ή υπό κατασκευή ακίνητο.",
    team: "Γνωρίστε την ομάδα του γραφείου",
  },
  en: {
    seoTitle: "New Build Property Lawyer in Thessaloniki | Papaioannou",
    description: "Buying a new build or off-plan property in Thessaloniki? We review title, the developer agreement and the terms for payment and handover.",
    title: "Buying a new build in Thessaloniki and checking the developer agreement",
    intro: "If the developer has given you a floor plan and an instalment schedule for a flat still under construction, keep them with the draft agreement. We check what the seller has agreed to deliver, when each payment is due and who can sign the transfer.",
    back: "Property purchase and title checks",
    contact: "Request a review of the developer agreement",
    scope: "What we check in the title and developer agreement",
    checks: [
      {
        title: "Who can sell you the property",
        text: "We start with the title documents and any registered encumbrances. If the landowner and developer are different parties, we also read their agreement to see who can transfer the particular flat to you.",
      },
      {
        title: "What you are buying and when you pay",
        text: "We read the draft agreement alongside the floor plan. We check how it describes the flat and any storage unit or parking space included in the sale. If an instalment is tied to progress on site, we check which stage of construction must be complete before you pay it.",
      },
      {
        title: "What the agreement says about handover",
        text: "We look at the agreed handover date and the specifications the seller has agreed to meet. We also check what the draft says if the floor plan changes, the work runs late or the purchase falls through.",
      },
    ],
    preparationTitle: "Have you already been given a draft agreement?",
    preparation: "When you first contact us, tell us which flat you are considering and when you have been asked to pay or sign. Have the documents you were given to hand, especially the draft agreement, floor plan, technical specifications and any payment or handover schedule.",
    questionsTitle: "Common questions about buying a new-build property",
    questions: [
      {
        title: "I've been asked for money to reserve the flat. What should I check first?",
        text: "Ask for the terms in writing. Check who receives the money, which flat they are holding for you, when the reservation expires and whether the payment comes off the purchase price. Check what the terms say about a refund if the title search reveals a problem or the mortgage you need is declined.",
      },
      {
        title: "Who signs if the developer and the landowner are different parties?",
        text: "We look at the title documents, the development agreement and any power of attorney. They help us establish who can sign the deed transferring that flat and who has agreed to finish and hand it over to you.",
      },
      {
        title: "What should I ask the engineer to check if the flat is still being built?",
        text: "Ask them to compare the floor plan you were given with the plans approved under the building permit. They can also check progress on site and the technical specifications. We check what the seller has agreed to deliver. If the engineer finds a discrepancy, ask for the agreed fix to be written into the draft before you sign.",
      },
    ],
    lawyer: "Lampriní Papaioannou",
    role: "Attorney at the Court of Appeal",
    biography: "Lampriní Papaioannou reviews title documents and developer agreements for people buying newly built homes or properties that are still under construction.",
    team: "Meet the team",
  },
  de: {
    seoTitle: "Anwältin für den Neubaukauf in Thessaloniki | Papaioannou",
    description: "Sie kaufen einen Neubau in Thessaloniki? Wir prüfen die Eigentumstitel, den Bauträgervertrag und die Bedingungen für Zahlung und Übergabe.",
    title: "Neubaukauf und Prüfung des Bauträgervertrags in Thessaloniki",
    intro: "Hat Ihnen der Bauträger für eine Wohnung im Bau einen Grundriss und einen Ratenplan gegeben, bewahren Sie beides zusammen mit dem Vertragsentwurf auf. Wir prüfen, was der Verkäufer übergeben muss, wann die einzelnen Raten fällig werden und wer die Übertragung unterzeichnen darf.",
    back: "Immobilienkauf und Prüfung der Eigentumstitel",
    contact: "Prüfung des Bauträgervertrags anfragen",
    scope: "Was wir in den Eigentumstiteln und im Bauträgervertrag prüfen",
    checks: [
      {
        title: "Wer Ihnen die Immobilie verkaufen kann",
        text: "Wir beginnen mit den Eigentumstiteln und den eingetragenen Belastungen. Sind Grundstückseigentümer und Bauträger verschiedene Personen, prüfen wir auch ihre Vereinbarung, um zu klären, wer die betreffende Wohnung übertragen kann.",
      },
      {
        title: "Was Sie kaufen und wann Sie zahlen",
        text: "Wir lesen den Vertragsentwurf zusammen mit dem Grundriss. Dabei prüfen wir, wie die Wohnung und ein etwaiger Abstellraum oder Stellplatz beschrieben sind. Ist eine Rate an den Baufortschritt geknüpft, klären wir, welcher Bauabschnitt vor der Zahlung abgeschlossen sein muss.",
      },
      {
        title: "Was der Vertrag für die Übergabe vorsieht",
        text: "Wir prüfen den vereinbarten Übergabetermin und die zugesagten Leistungen. Außerdem sehen wir nach, was der Entwurf vorsieht, wenn sich der Grundriss ändert, sich der Bau verzögert oder der Kauf scheitert.",
      },
    ],
    preparationTitle: "Haben Sie bereits einen Vertragsentwurf erhalten?",
    preparation: "Sagen Sie uns beim ersten Kontakt, um welche Wohnung es geht und bis wann Sie zahlen oder unterschreiben sollen. Halten Sie die Unterlagen bereit, die Sie bekommen haben, vor allem den Vertragsentwurf, den Grundriss, die Baubeschreibung und Angaben zu den Zahlungen oder zur Übergabe.",
    questionsTitle: "Häufige Fragen zum Kauf einer Neubauimmobilie",
    questions: [
      {
        title: "Ich soll Geld für die Reservierung zahlen. Was sollte ich vorher prüfen?",
        text: "Bitten Sie um schriftliche Bedingungen. Prüfen Sie, wer das Geld erhält, welche Wohnung für Sie reserviert wird, wann die Reservierung endet und ob der Betrag auf den Kaufpreis angerechnet wird. Klären Sie, ob Sie das Geld zurückbekommen, wenn bei der Titelprüfung ein Problem auftaucht oder Sie das benötigte Darlehen nicht erhalten.",
      },
      {
        title: "Wer unterschreibt, wenn Bauträger und Grundstückseigentümer verschieden sind?",
        text: "Wir sehen in die Eigentumsnachweise, den Vertrag über das Bauvorhaben und eine etwaige Vollmacht. So klären wir, wer die Übertragung der konkreten Wohnung unterzeichnen kann und wer sich verpflichtet hat, die Wohnung fertigzustellen und Ihnen zu übergeben.",
      },
      {
        title: "Was sollte der Ingenieur prüfen, wenn die Wohnung noch im Bau ist?",
        text: "Bitten Sie ihn, den erhaltenen Grundriss mit den genehmigten Bauplänen zu vergleichen. Er kann auch den Baufortschritt und die technischen Vorgaben prüfen. Wir schauen, welche Leistungen der Verkäufer vertraglich zugesagt hat. Stellt der Ingenieur eine Abweichung fest, lassen Sie die vereinbarte Lösung vor der Unterzeichnung im Vertragsentwurf festhalten.",
      },
    ],
    lawyer: "Lampriní Papaioannou",
    role: "Rechtsanwältin am Berufungsgericht",
    biography: "Lampriní Papaioannou prüft Eigentumstitel und Bauträgerverträge für Käuferinnen und Käufer von Neubauten und Immobilien im Bau.",
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
    title: { absolute: title },
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
            href={propertyContactHref("new-build")}
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

        <section>
          <h2 className="mb-6 border-l-4 border-accent pl-4 font-playfair text-2xl font-bold text-primary">
            {page.questionsTitle}
          </h2>
          <FaqAccordion items={page.questions.map(({ title, text }) => ({ q: title, a: text }))} />
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
