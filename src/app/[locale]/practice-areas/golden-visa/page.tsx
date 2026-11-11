import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { ArrowLeft, ArrowRight, Building2, ClipboardCheck, FileSearch } from "lucide-react";
import FaqAccordion from "@/components/FaqAccordion";
import { routing } from "@/i18n/routing";
import { buildPageMeta } from "@/lib/seo";
import { propertyContactHref } from "@/lib/property-contact";
import { Link } from "@/navigation";

const realEstatePath = "/practice-areas/realEstate";
const pagePath = "/practice-areas/golden-visa";
const depositGuidePath = "/blog/prokatavoli-agora-akinitou";
const checkIcons = [FileSearch, Building2, ClipboardCheck];
// Thessaloniki waterfront photograph by K, https://www.pexels.com/photo/37845038/
const waterfrontPhoto = "/thessaloniki-waterfront.webp";

const content = {
  en: {
    seoTitle: "Golden Visa Property Due Diligence in Thessaloniki | Papaioannou",
    description: "Buying property in Thessaloniki, Greece, for a Golden Visa? Have a lawyer review the title, property documents and deposit terms before you pay or sign.",
    title: "Golden Visa in Thessaloniki",
    titleDetail: "Legal checks before buying property",
    intro: "Has a seller offered you a property in Thessaloniki as suitable for Greece’s Golden Visa? If you are buying from abroad, we can start with the title and any draft agreement you have received. We check the property documents and the terms of the purchase before you pay a deposit or sign.",
    back: "All legal services",
    contact: "Request a legal property review",
    photoAlt: "Aerial view of Thessaloniki’s waterfront and apartment buildings",
    rulesTitle: "Which Golden Visa rules apply to the property?",
    standardTitle: "Standard property purchase",
    specialTitle: "Special cases",
    standardPurchase: "For a standard purchase in the Thessaloniki regional unit or Attica, the minimum is €800,000 for one property. If it is already built or has a building permit, it must have at least 120 m² of main-use space. A flat advertised as 120 m² may fall short if the figure includes a storage room or parking space. Check the area in the deed and building documents before you rely on the listing.",
    specialPurchase: "The €250,000 minimum applies to specific cases, such as a qualifying change of use to residential or the restoration or reconstruction of a listed building. If the seller offers you a property on that basis, ask for the supporting documents. Where the change of use is still in progress, check who will complete it and what the agreement says if it is delayed. The change must be complete before the permit application is submitted.",
    checksTitle: "What we check before you commit",
    checks: [
      {
        title: "The seller’s title and the land register",
        text: "We compare the seller’s deed with the Greek Cadastre. We check which property and rights are being transferred, who can sign the sale, and whether there are registered mortgages, charges or claims that could affect the purchase.",
      },
      {
        title: "The documents behind the Golden Visa claim",
        text: "We look at the documents the seller provides for the route they are relying on and identify what the engineer or notary needs to confirm. For a property offered under a special route, tell us if the seller says it has already been used for a Golden Visa. That history is relevant to what the notary needs to verify.",
      },
      {
        title: "What happens to your deposit if there is a problem",
        text: "We review the written terms to see who receives the deposit, when it is due and when it can be returned. If the terms say nothing about what happens when a title issue or a missing property document stops the purchase, we flag it before you commit.",
      },
    ],
    signingTitle: "From the deposit to the purchase deed",
    signing: "Before signing, we check that the draft deed describes the same property and rights as the title documents and reflects the agreed payment terms. The notary certifies how the price was paid. After signing, the deed is registered with the relevant Cadastral Office. The residence permit application is a separate procedure with its own supporting documents, including evidence of full payment.",
    preparationTitle: "What to have ready when you contact us",
    preparation: "Tell us where the property is and when you have been asked to pay or sign. Have the seller’s deed, the cadastral reference (KAEK), any paperwork the seller gave you about the Golden Visa, and the draft reservation agreement ready if you have them. You can contact us in English or German.",
    depositGuide: "What to check before paying a property deposit",
    purchaseService: "Legal support for buying property in Greece",
    questionsTitle: "Questions before buying for a Golden Visa",
    questions: [
      {
        q: "Can the property checks start while I am abroad?",
        a: "Yes. You can start by telling us where the property is and what documents you already have. If you need someone to sign on your behalf, we can discuss with the notary whether a power of attorney is appropriate and what it must cover.",
      },
      {
        q: "Can I buy two properties to reach the minimum?",
        a: "The current property routes require a single property. If the offer includes two flats or separate titles for different spaces, have the deed and the cadastral records checked to see what is legally being transferred.",
      },
      {
        q: "Can I let the property to holiday guests?",
        a: "A property bought under the current Golden Visa rules cannot be let on a short-term basis, including through direct bookings. If your purchase depends on income from holiday lets, factor that restriction into your decision before paying a deposit.",
      },
    ],
  },
  de: {
    seoTitle: "Golden Visa: Immobilienprüfung in Thessaloniki | Papaioannou",
    description: "Immobilienkauf in Thessaloniki für ein Golden Visa in Griechenland. Wir prüfen Eigentumsurkunden, Unterlagen und Anzahlungsbedingungen vor dem Kauf.",
    title: "Golden Visa in Thessaloniki",
    titleDetail: "Rechtliche Prüfung vor dem Immobilienkauf",
    intro: "Hat Ihnen ein Verkäufer in Thessaloniki eine Immobilie angeboten, die für das griechische Golden Visa geeignet sein soll? Wenn Sie aus dem Ausland kaufen, können wir mit der Eigentumsurkunde und dem Vertragsentwurf beginnen, den Sie erhalten haben. Wir prüfen die Unterlagen und die Kaufbedingungen, bevor Sie eine Anzahlung leisten oder unterschreiben.",
    back: "Alle Rechtsgebiete",
    contact: "Rechtliche Immobilienprüfung anfragen",
    photoAlt: "Luftaufnahme der Uferpromenade und Wohnhäuser von Thessaloniki",
    rulesTitle: "Welche Voraussetzungen gelten für die Immobilie?",
    standardTitle: "Regulärer Immobilienkauf",
    specialTitle: "Sonderfälle",
    standardPurchase: "Beim regulären Immobilienkauf in der Regionaleinheit Thessaloniki oder in Attika beträgt die Mindestinvestition 800.000 € für eine einzelne Immobilie. Bei einem bereits errichteten Objekt oder einer erteilten Baugenehmigung sind mindestens 120 m² Hauptnutzfläche erforderlich. Die Flächenangabe im Inserat kann auch einen Abstellraum oder Stellplatz enthalten. Maßgeblich ist, welche Fläche sich aus der Urkunde und den Bauunterlagen ergibt.",
    specialPurchase: "Der Mindestbetrag von 250.000 € gilt für besondere Fälle, etwa eine Umnutzung zu Wohnraum, die die gesetzlichen Voraussetzungen erfüllt, oder die Sanierung oder den Wiederaufbau eines denkmalgeschützten Gebäudes. Beruft sich der Verkäufer darauf, bitten Sie ihn um die entsprechenden Nachweise. Bei einer laufenden Umnutzung ist zu klären, wer sie abschließt und was der Vertrag bei einer Verzögerung vorsieht. Die Umnutzung muss vor dem Antrag auf die Aufenthaltserlaubnis abgeschlossen sein.",
    checksTitle: "Was wir vor Ihrer Entscheidung prüfen",
    checks: [
      {
        title: "Eigentumsurkunde und Katastereinträge",
        text: "Wir gleichen die Eigentumsurkunde des Verkäufers mit den Einträgen im griechischen Kataster ab. Wir prüfen, welche Immobilie und welche Rechte übertragen werden, wer den Kaufvertrag unterschreiben darf und ob eingetragene Hypotheken, Belastungen oder Ansprüche den Kauf betreffen.",
      },
      {
        title: "Welche Unterlagen die Eignung für das Golden Visa belegen sollen",
        text: "Wir prüfen die Unterlagen, die der Verkäufer für die jeweilige Investitionskategorie vorlegt, und benennen die Punkte, die ein Ingenieur oder Notar bestätigen muss. Teilen Sie uns bei einem Objekt mit Sonderregelung mit, wenn der Verkäufer angibt, dass es bereits für ein Golden Visa genutzt wurde. Das ist für die notarielle Prüfung relevant.",
      },
      {
        title: "Was bei Problemen mit Ihrer Anzahlung geschieht",
        text: "Wir prüfen, an wen die Anzahlung geht, wann sie fällig wird und wann sie zurückgezahlt werden kann. Fehlt eine Regelung für den Fall, dass ein Problem mit dem Eigentum oder ein fehlendes Dokument den Kauf verhindert, weisen wir vor der Zahlung darauf hin.",
      },
    ],
    signingTitle: "Von der Anzahlung bis zur Eintragung des Kaufvertrags",
    signing: "Vor der Unterschrift prüfen wir, ob der Vertragsentwurf dieselbe Immobilie und dieselben Rechte wie die Eigentumsurkunden beschreibt und die vereinbarten Zahlungsbedingungen enthält. Der Notar bescheinigt, wie der Kaufpreis gezahlt wurde. Nach der Unterzeichnung wird der Kaufvertrag beim zuständigen Katasteramt eingetragen. Für die Aufenthaltserlaubnis gibt es ein eigenes Verfahren mit gesonderten Nachweisen, unter anderem über die vollständige Zahlung.",
    preparationTitle: "Was Sie für das erste Gespräch bereithalten können",
    preparation: "Nennen Sie uns die Lage der Immobilie und den Termin, zu dem Sie zahlen oder unterschreiben sollen. Wenn vorhanden, halten Sie die Eigentumsurkunde, die Katasternummer (KAEK), die Unterlagen des Verkäufers zum Golden Visa und die Reservierungsvereinbarung bereit. Sie können uns auf Deutsch oder Englisch kontaktieren.",
    depositGuide: "Was Sie vor einer Anzahlung prüfen sollten",
    purchaseService: "Rechtliche Begleitung beim Immobilienkauf in Griechenland",
    questionsTitle: "Fragen zum Immobilienkauf für ein Golden Visa",
    questions: [
      {
        q: "Kann die Prüfung beginnen, wenn ich im Ausland bin?",
        a: "Ja. Teilen Sie uns mit, wo die Immobilie liegt und welche Unterlagen Sie bereits haben. Wenn Sie sich bei der Unterschrift vertreten lassen möchten, können wir mit dem Notar besprechen, ob eine Vollmacht infrage kommt und was sie abdecken muss.",
      },
      {
        q: "Kann ich zwei Immobilien kaufen, um den Mindestbetrag zu erreichen?",
        a: "Die geltenden Regelungen für den Immobilienkauf setzen eine einzelne Immobilie voraus. Umfasst das Angebot zwei Wohnungen oder getrennte Titel für einzelne Flächen, lassen Sie anhand der Urkunden und Katastereinträge prüfen, was genau übertragen wird.",
      },
      {
        q: "Kann ich die Immobilie an Feriengäste vermieten?",
        a: "Eine nach den geltenden Regeln für das Golden Visa erworbene Immobilie darf nicht kurzfristig vermietet werden, auch nicht über Direktbuchungen. Wenn Ihre Kalkulation auf Einnahmen aus der Ferienvermietung beruht, berücksichtigen Sie diese Einschränkung vor der Anzahlung.",
      },
    ],
  },
  el: {
    seoTitle: "Έλεγχος ακινήτου για Golden Visa στη Θεσσαλονίκη | Παπαϊωάννου",
    description: "Αγορά ακινήτου στη Θεσσαλονίκη για Golden Visa. Ελέγχουμε τίτλους, έγγραφα του ακινήτου και όρους προκαταβολής πριν πληρώσετε ή υπογράψετε.",
    title: "Golden Visa στη Θεσσαλονίκη",
    titleDetail: "Νομικός έλεγχος πριν από την αγορά",
    intro: "Σας πρότεινε ο πωλητής ακίνητο στη Θεσσαλονίκη ως κατάλληλο για Golden Visa; Αν αγοράζετε από το εξωτερικό, μπορούμε να ξεκινήσουμε από τον τίτλο του πωλητή και το σχέδιο συμφωνίας που έχετε στα χέρια σας. Ελέγχουμε τα έγγραφα του ακινήτου και τους όρους της αγοράς πριν δώσετε προκαταβολή ή υπογράψετε.",
    back: "Όλες οι νομικές υπηρεσίες",
    contact: "Ζητήστε νομικό έλεγχο ακινήτου",
    photoAlt: "Πανοραμική άποψη της παραλίας και των πολυκατοικιών της Θεσσαλονίκης",
    rulesTitle: "Ποιες προϋποθέσεις ισχύουν για το ακίνητο;",
    standardTitle: "Γενικός κανόνας",
    specialTitle: "Ειδικές περιπτώσεις",
    standardPurchase: "Στη συνήθη αγορά στην Περιφερειακή Ενότητα Θεσσαλονίκης ή στην Αττική, το ελάχιστο τίμημα είναι 800.000 € για ένα ακίνητο. Αν είναι δομημένο ή έχει εκδοθεί οικοδομική άδεια, απαιτούνται τουλάχιστον 120 τ.μ. κύριων χώρων. Ένα διαμέρισμα που εμφανίζεται στην αγγελία ως 120 τ.μ. μπορεί να υπολείπεται αν στο εμβαδόν περιλαμβάνεται αποθήκη ή θέση στάθμευσης. Πριν βασιστείτε στην αγγελία, δείτε τι προκύπτει από τον τίτλο και τα οικοδομικά έγγραφα.",
    specialPurchase: "Το ελάχιστο τίμημα των 250.000 € αφορά ειδικές περιπτώσεις, όπως αλλαγή χρήσης σε κατοικία που πληροί τις νόμιμες προϋποθέσεις ή αγορά διατηρητέου προς αποκατάσταση ή ανακατασκευή. Αν ο πωλητής επικαλείται μία από αυτές τις περιπτώσεις, ζητήστε τα αντίστοιχα έγγραφα. Αν η αλλαγή χρήσης εκκρεμεί, έχει σημασία ποιος την αναλαμβάνει και τι προβλέπει η συμφωνία αν καθυστερήσει. Η αλλαγή πρέπει να έχει ολοκληρωθεί πριν υποβληθεί η αίτηση άδειας διαμονής.",
    checksTitle: "Τι ελέγχουμε πριν δεσμευτείτε",
    checks: [
      {
        title: "Τον τίτλο του πωλητή και τις κτηματολογικές εγγραφές",
        text: "Συγκρίνουμε τον τίτλο του πωλητή με τις εγγραφές του Κτηματολογίου. Ελέγχουμε ποιο ακίνητο και ποια δικαιώματα μεταβιβάζονται, ποιος μπορεί να υπογράψει και αν υπάρχουν καταχωρισμένες υποθήκες, βάρη ή διεκδικήσεις που επηρεάζουν την αγορά.",
      },
      {
        title: "Τα έγγραφα που επικαλείται ο πωλητής για τη Golden Visa",
        text: "Εξετάζουμε τα δικαιολογητικά που επικαλείται ο πωλητής για τη συγκεκριμένη κατηγορία και εντοπίζουμε τι χρειάζεται να επιβεβαιώσει ο μηχανικός ή ο συμβολαιογράφος. Αν ο πωλητής σάς είπε ότι έχει ήδη χρησιμοποιηθεί το ακίνητο για Golden Visa, ιδίως σε ειδική κατηγορία, αναφέρετέ το ώστε να διερευνηθεί με τον συμβολαιογράφο.",
      },
      {
        title: "Τι προβλέπει η συμφωνία για την προκαταβολή",
        text: "Ελέγχουμε ποιος θα εισπράξει την προκαταβολή, πότε πρέπει να την πληρώσετε και πότε προβλέπεται να επιστραφεί. Αν η συμφωνία δεν ορίζει τι γίνεται όταν ένα πρόβλημα στους τίτλους ή η έλλειψη εγγράφου εμποδίσει την αγορά, σας το επισημαίνουμε πριν δεσμευτείτε.",
      },
    ],
    signingTitle: "Από την προκαταβολή μέχρι την καταχώριση του συμβολαίου",
    signing: "Πριν από την υπογραφή ελέγχουμε αν το σχέδιο του συμβολαίου περιγράφει το ίδιο ακίνητο και τα ίδια δικαιώματα με τους τίτλους και αν αποτυπώνει όσα συμφωνήθηκαν για την πληρωμή. Ο συμβολαιογράφος βεβαιώνει τον τρόπο καταβολής του τιμήματος. Μετά την υπογραφή ακολουθεί η καταχώριση στο αρμόδιο Κτηματολογικό Γραφείο. Η αίτηση για άδεια διαμονής έχει χωριστή διαδικασία, για την οποία πρέπει να προκύπτει και η πλήρης εξόφληση.",
    preparationTitle: "Τι να έχετε διαθέσιμο όταν επικοινωνήσετε",
    preparation: "Πείτε μας πού βρίσκεται το ακίνητο και μέχρι πότε σας έχουν ζητήσει να πληρώσετε ή να υπογράψετε. Αν τα έχετε, κρατήστε διαθέσιμα τον τίτλο του πωλητή, τον ΚΑΕΚ, τα έγγραφα που σας έδωσαν για τη Golden Visa και το σχέδιο συμφωνίας κράτησης.",
    depositGuide: "Τι να ελέγξετε πριν δώσετε προκαταβολή",
    purchaseService: "Νομική υποστήριξη για αγορά ακινήτου στην Ελλάδα",
    questionsTitle: "Ερωτήσεις πριν από αγορά για Golden Visa",
    questions: [
      {
        q: "Μπορεί να ξεκινήσει ο έλεγχος ενώ είμαι στο εξωτερικό;",
        a: "Ναι. Πείτε μας πού βρίσκεται το ακίνητο και ποια έγγραφα έχετε ήδη. Αν θέλετε να υπογράψει κάποιος για λογαριασμό σας, μπορούμε να εξετάσουμε με τον συμβολαιογράφο αν μπορεί να χρησιμοποιηθεί πληρεξούσιο και τι πρέπει να προβλέπει.",
      },
      {
        q: "Μπορώ να αγοράσω δύο ακίνητα για να συμπληρώσω το όριο;",
        a: "Οι ισχύουσες κατηγορίες αγοράς απαιτούν ένα ακίνητο. Αν η προσφορά περιλαμβάνει δύο διαμερίσματα ή χωριστούς τίτλους για διαφορετικούς χώρους, πρέπει να ελεγχθεί τι ακριβώς μεταβιβάζεται σύμφωνα με τους τίτλους και τις κτηματολογικές εγγραφές.",
      },
      {
        q: "Μπορώ να διαθέσω το ακίνητο για βραχυχρόνια μίσθωση;",
        a: "Για ακίνητο που αγοράζεται με τους ισχύοντες κανόνες της Golden Visa, η βραχυχρόνια μίσθωση απαγορεύεται ακόμη και με απευθείας κράτηση. Αν υπολογίζετε σε έσοδα από τέτοιες μισθώσεις, λάβετε υπόψη τον περιορισμό πριν δώσετε προκαταβολή.",
      },
    ],
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
      <section className="border-b border-accent/40 bg-primary bg-linear-to-br from-primary via-primary to-[#194352] py-10 text-white md:py-14 lg:py-16">
        <div className="mx-auto max-w-6xl px-6">
          <Link
            href="/practice-areas"
            className="mb-7 inline-flex items-center gap-2 text-sm text-white/80 transition-colors hover:text-white hover:underline hover:underline-offset-4 lg:mb-8"
          >
            <ArrowLeft size={16} aria-hidden="true" /> {page.back}
          </Link>
          <div className="grid items-center gap-8 lg:grid-cols-[1.12fr_1fr] lg:gap-12">
            <div>
              <div className="mb-5 h-0.5 w-12 bg-accent" aria-hidden="true" />
              <h1 className="max-w-xl font-playfair tracking-tight">
                <span className="block text-3xl leading-[1.12] font-bold sm:text-4xl xl:text-[2.75rem]">{page.title}</span>{" "}
                <span className="mt-2 block text-xl leading-snug font-semibold text-white/90 sm:text-2xl">{page.titleDetail}</span>
              </h1>
              <p className="mt-5 max-w-xl text-base leading-relaxed text-white/85 lg:text-lg">{page.intro}</p>
              <Link
                href={propertyContactHref("golden-visa")}
                className="mt-7 inline-flex items-center gap-2 rounded-sm bg-accent px-5 py-3 font-semibold text-primary transition-colors hover:bg-[#d8a94d]"
              >
                {page.contact} <ArrowRight size={18} className="shrink-0" aria-hidden="true" />
              </Link>
            </div>
            <div className="rounded-sm border border-white/20 bg-white/5 p-1.5 shadow-xl">
              <div className="relative aspect-video overflow-hidden rounded-xs bg-primary lg:aspect-[5/4]">
                <Image
                  src={waterfrontPhoto}
                  alt={page.photoAlt}
                  fill
                  loading="eager"
                  fetchPriority="high"
                  sizes="(min-width: 1152px) 488px, (min-width: 1024px) 43vw, calc(100vw - 60px)"
                  className="object-cover object-[42%_50%]"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-primary/10 bg-[#f7f5ef] py-12 md:py-16">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="max-w-3xl text-balance font-playfair text-2xl font-bold text-primary sm:text-3xl">
            {page.rulesTitle}
          </h2>
          <div className="mt-7 grid gap-4 md:grid-cols-2 md:gap-5">
            <div className="rounded-sm border border-primary/10 border-t-2 border-t-accent bg-white p-5 shadow-sm md:p-7">
              <h3 className="font-playfair text-xl font-semibold text-primary">{page.standardTitle}</h3>
              <p className="mt-3 leading-relaxed text-gray-700">{page.standardPurchase}</p>
            </div>
            <div className="rounded-sm border border-primary/10 border-t-2 border-t-accent bg-white p-5 shadow-sm md:p-7">
              <h3 className="font-playfair text-xl font-semibold text-primary">{page.specialTitle}</h3>
              <p className="mt-3 leading-relaxed text-gray-700">{page.specialPurchase}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-12 md:py-16">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="max-w-3xl text-balance font-playfair text-2xl font-bold text-primary sm:text-3xl">
            {page.checksTitle}
          </h2>
          <div className="mt-7 grid gap-4 lg:grid-cols-3 lg:gap-5">
            {page.checks.map(({ title, text }, index) => {
              const Icon = checkIcons[index] ?? FileSearch;
              return (
                <div className="rounded-sm border border-primary/10 p-5 shadow-sm md:p-6" key={title}>
                  <div className="mb-4 flex size-10 items-center justify-center rounded-sm bg-accent/15 text-primary">
                    <Icon size={20} strokeWidth={1.7} aria-hidden="true" />
                  </div>
                  <h3 className="font-playfair text-xl leading-tight font-semibold text-primary">{title}</h3>
                  <p className="mt-3 leading-relaxed text-gray-700">{text}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <div className="border-y border-primary/10 bg-[#f4f7f7] py-12 md:py-16">
        <div className="mx-auto grid max-w-6xl items-start gap-8 px-6 lg:grid-cols-[1.1fr_1fr] lg:gap-12">
          <section className="lg:pt-4">
            <h2 className="max-w-xl text-balance font-playfair text-2xl font-bold text-primary sm:text-3xl">
              {page.signingTitle}
            </h2>
            <p className="mt-4 leading-relaxed text-gray-700">{page.signing}</p>
            <Link
              href={depositGuidePath}
              className="mt-5 inline-flex items-center gap-2 font-semibold text-primary underline underline-offset-4 hover:decoration-accent"
            >
              {page.depositGuide} <ArrowRight size={16} className="shrink-0" aria-hidden="true" />
            </Link>
          </section>
          <section className="rounded-sm border-t-2 border-accent bg-primary p-5 text-white shadow-md sm:p-7">
            <h2 className="font-playfair text-2xl font-bold">{page.preparationTitle}</h2>
            <p className="mt-3 leading-relaxed text-white/85">{page.preparation}</p>
            <Link
              href={propertyContactHref("golden-visa")}
              className="mt-5 inline-flex items-center gap-2 font-semibold text-white underline decoration-accent underline-offset-4 hover:text-[#f4d398]"
            >
              {page.contact} <ArrowRight size={16} className="shrink-0" aria-hidden="true" />
            </Link>
          </section>
        </div>
      </div>

      <section className="py-12 md:py-16">
        <div className="mx-auto grid max-w-6xl gap-6 px-6 lg:grid-cols-[0.7fr_1.5fr] lg:gap-12">
          <h2 className="max-w-sm text-balance font-playfair text-2xl font-bold text-primary sm:text-3xl">
            {page.questionsTitle}
          </h2>
          <div className="[&_button[aria-expanded=true]>span:first-child]:text-primary">
            <FaqAccordion items={page.questions} />
            <Link
              href={realEstatePath}
              className="mt-6 inline-flex items-center gap-2 font-semibold text-primary underline underline-offset-4 hover:decoration-accent"
            >
              {page.purchaseService} <ArrowRight size={16} className="shrink-0" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
