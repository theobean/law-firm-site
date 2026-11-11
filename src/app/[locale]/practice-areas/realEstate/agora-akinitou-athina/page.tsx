import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { routing } from "@/i18n/routing";
import { buildPageMeta } from "@/lib/seo";
import { propertyContactHref } from "@/lib/property-contact";
import { Link } from "@/navigation";

const realEstatePath = "/practice-areas/realEstate";
const pagePath = `${realEstatePath}/agora-akinitou-athina`;
const guidePath = "/blog/agora-akiniton-vimata";
const cadastreOfficeSearch = "https://www.ktimatologio.gr/#ota";

const content = {
  el: {
    seoTitle: "Δικηγόρος για αγορά ακινήτου στην Αθήνα | Παπαϊωάννου",
    description: "Αγορά ακινήτου στην Αθήνα και την Αττική. Ελέγχουμε τίτλους, βάρη, όρους προκαταβολής και το σχέδιο του συμβολαίου από το γραφείο μας στη Θεσσαλονίκη.",
    title: "Νομικός έλεγχος για αγορά ακινήτου στην Αθήνα",
    intro: "Αν ο πωλητής σάς έχει στείλει τον τίτλο για ακίνητο στην Αθήνα, μπορούμε να ξεκινήσουμε από αυτόν. Από τον τίτλο και τις εγγραφές του Κτηματολογίου βλέπουμε τι ακριβώς μεταβιβάζεται. Αν υπάρχει και σχέδιο συμφωνίας, εξετάζουμε πότε σας ζητούν να πληρώσετε και τι προβλέπεται για την προκαταβολή αν ο έλεγχος δείξει πρόβλημα. Χειριζόμαστε αγορές στην Αθήνα και την Αττική από το γραφείο μας στη Θεσσαλονίκη.",
    back: "Αγορά ακινήτου και έλεγχος τίτλων",
    contact: "Μιλήστε μας για το ακίνητο στην Αθήνα",
    identificationTitle: "Ποιο ακίνητο αγοράζετε σύμφωνα με τους τίτλους;",
    identification: "Ξεκινάμε από τον δήμο και την πλήρη διεύθυνση για να βρούμε το αρμόδιο Κτηματολογικό Γραφείο στην Αττική. Αν έχετε τον τίτλο του πωλητή ή τον ΚΑΕΚ, τον κωδικό του ακινήτου στο Κτηματολόγιο, δώστε μας και αυτά τα στοιχεία. Από τους τίτλους και τις εγγραφές ελέγχουμε ποιος έχει δικαίωμα να πουλήσει και αν υπάρχουν υποθήκες, προσημειώσεις ή άλλες εκκρεμότητες που επηρεάζουν τη μεταβίβαση.",
    cadastreLink: "Βρείτε το αρμόδιο Κτηματολογικό Γραφείο",
    apartment: "Αν στη συμφωνία για το διαμέρισμα περιλαμβάνεται αποθήκη ή θέση στάθμευσης, ζητήστε από τον πωλητή να σας δείξει πού αναφέρεται στον τίτλο. Ελέγχουμε αν μεταβιβάζεται μαζί με το διαμέρισμα και ποιο δικαίωμα αποκτάτε.",
    preparationTitle: "Τι χρειαζόμαστε για να ξεκινήσει ο έλεγχος",
    checklist: [
      "Τον δήμο, τη διεύθυνση και τον ΚΑΕΚ, αν τον έχετε.",
      "Τον τίτλο του πωλητή και τυχόν σχέδιο συμφωνίας που σας έδωσαν.",
      "Το ποσό που σας ζήτησαν για προκαταβολή και τυχόν ημερομηνία πληρωμής ή υπογραφής.",
    ],
    feeTitle: "Αμοιβή για τον νομικό έλεγχο ακινήτου",
    fee: "Για την αμοιβή έχει σημασία πόσο πίσω χρειάζεται να φτάσει η έρευνα στους τίτλους και αν υπάρχουν εγγραφές στο Κτηματολόγιο που χρειάζονται διερεύνηση. Στην εκτίμηση συνυπολογίζεται τυχόν έλεγχος του συμφωνητικού για την προκαταβολή ή του σχεδίου του συμβολαίου.",
    coordinationTitle: "Μένετε εκτός Αθήνας;",
    coordination: "Αν βρίσκεστε σε άλλη πόλη ή στο εξωτερικό, μπορούμε πρώτα να δούμε όσα έγγραφα έχετε. Θα σας πούμε τι λείπει από τον φάκελο και τι χρειάζεται να ζητήσουμε από τον πωλητή ή τον συμβολαιογράφο πριν οριστεί η υπογραφή.",
    representation: "Αν δυσκολεύεστε να έρθετε για την υπογραφή, πείτε μας από την πρώτη επικοινωνία. Θα εξετάσουμε με τον συμβολαιογράφο αν μπορείτε να εκπροσωπηθείτε με πληρεξούσιο και τι χρειάζεται να ετοιμάσετε.",
    guideLink: "Δείτε τα 7 βήματα για αγορά ακινήτου στην Ελλάδα",
  },
  en: {
    seoTitle: "Lawyer for Buying Property in Athens | Papaioannou",
    description: "Buying in Athens or Attica? Our Thessaloniki office checks title, encumbrances, deposit terms and the draft deed.",
    title: "Legal checks for buying property in Athens",
    intro: "If the seller has sent you the deed for a property in Athens, we can start there. We read it alongside the cadastral records to see exactly what is being transferred. If there is a draft agreement, we check when payment is due and what happens to the deposit if the title check uncovers a problem. We handle purchases in Athens and across Attica from our office in Thessaloniki.",
    back: "Property purchase and title checks",
    contact: "Talk to us about the property in Athens",
    identificationTitle: "What do the title documents say you are buying?",
    identification: "Give us the municipality and full address so we can find the right Cadastral Office in Attica. If you know the property's cadastral reference (KAEK), provide it with the seller's deed. We review the deeds and register to see who has the right to sell and whether any mortgages, other registered charges or outstanding issues affect the transfer.",
    cadastreLink: "Find the relevant Cadastral Office",
    apartment: "If the deal includes a storage unit or parking space, ask the seller where it appears in the deed. We check whether it transfers with the flat and what rights you acquire.",
    preparationTitle: "What we need to start the checks",
    checklist: [
      "The municipality, address and cadastral reference (KAEK), if you have it.",
      "The seller's deed and any draft agreement you were given.",
      "The amount of the deposit and the date you have been asked to pay or sign.",
    ],
    feeTitle: "Legal fees for a property title check",
    fee: "The fee depends on how far back the title search needs to go and whether any cadastral entries need further investigation. It also takes into account any review of the deposit agreement or draft deed.",
    coordinationTitle: "Based outside Athens?",
    coordination: "If you are in another city or abroad, we can start with the documents you already have. We will tell you what is missing and what we need to request from the seller or notary before a signing date is set.",
    representation: "Tell us early if you may have trouble attending the signing. We will check with the notary whether you can be represented under a power of attorney and what you need to prepare.",
    guideLink: "Read the seven steps to buying property in Greece",
  },
  de: {
    seoTitle: "Anwalt für den Immobilienkauf in Athen | Papaioannou",
    description: "Prüfung von Eigentumstiteln, Belastungen und Kaufvertrag in Athen und Attika durch unsere Kanzlei in Thessaloniki.",
    title: "Rechtliche Prüfung beim Immobilienkauf in Athen",
    intro: "Hat Ihnen der Verkäufer die Eigentumsurkunde für eine Immobilie in Athen geschickt, können wir damit beginnen. Anhand der Urkunde und der Katastereinträge prüfen wir, was genau übertragen wird. Liegt ein Vertragsentwurf vor, prüfen wir die Zahlungsfrist und was mit der Anzahlung geschieht, falls sich bei der Titelprüfung ein Problem zeigt. Wir begleiten Käufe in Athen und Attika von unserer Kanzlei in Thessaloniki aus.",
    back: "Immobilienkauf und Prüfung der Eigentumstitel",
    contact: "Sprechen Sie mit uns über die Immobilie in Athen",
    identificationTitle: "Was steht in den Eigentumsurkunden?",
    identification: "Mit der Gemeinde und der vollständigen Adresse ermitteln wir das zuständige Katasteramt in Attika. Wenn Sie die Katasternummer (KAEK) kennen, geben Sie sie uns zusammen mit der Urkunde des Verkäufers. Anhand der Urkunden und Einträge prüfen wir, wer verkaufen darf und ob Hypotheken, Vormerkungen oder andere offene Punkte die Übertragung betreffen.",
    cadastreLink: "Das zuständige Katasteramt finden",
    apartment: "Wenn ein Abstellraum oder Stellplatz zum Kauf gehört, fragen Sie den Verkäufer, wo er in der Urkunde aufgeführt ist. Wir prüfen, ob er zusammen mit der Wohnung übertragen wird und welche Rechte Sie erwerben.",
    preparationTitle: "Was wir für die Prüfung brauchen",
    checklist: [
      "Die Gemeinde, die Adresse und, falls bekannt, die Katasternummer (KAEK).",
      "Die Urkunde des Verkäufers und einen etwaigen Vertragsentwurf.",
      "Die Höhe der Anzahlung und den Termin, bis zu dem Sie zahlen oder unterschreiben sollen.",
    ],
    feeTitle: "Honorar für die rechtliche Prüfung der Immobilie",
    fee: "Für das Honorar kommt es darauf an, wie weit die Prüfung der Eigentumstitel zurückreichen muss und ob Katastereinträge näher untersucht werden müssen. Auch eine etwaige Prüfung der Anzahlungsvereinbarung oder des Kaufvertragsentwurfs fließt in die Einschätzung ein.",
    coordinationTitle: "Sie wohnen außerhalb Athens?",
    coordination: "Wenn Sie in einer anderen Stadt oder im Ausland sind, können wir zuerst die Unterlagen prüfen, die Sie schon haben. Wir sagen Ihnen, was noch fehlt und welche Unterlagen wir vom Verkäufer oder Notar anfordern müssen, bevor ein Termin festgelegt wird.",
    representation: "Wenn Sie bei der Unterzeichnung möglicherweise nicht dabei sein können, sagen Sie uns früh Bescheid. Wir klären mit dem Notar, ob Sie sich mit einer Vollmacht vertreten lassen können und was Sie dafür vorbereiten müssen.",
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
    title: { absolute: title },
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
            href={propertyContactHref("athens")}
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
            {page.feeTitle}
          </h2>
          <p className="mt-5 leading-relaxed text-gray-700">{page.fee}</p>
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
