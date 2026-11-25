import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { notFound, redirect } from "next/navigation";
import { routing } from "@/i18n/routing";
import { localizedPageUrl, ogDefaults } from "@/lib/seo";
import { Link } from "@/navigation";

const title = "Οδηγός εξωδικαστικού μηχανισμού ρύθμισης οφειλών";
const description = "Πώς υπολογίζεται η πρόταση ρύθμισης, πότε τεκμαίρεται η συναίνεση των πιστωτών και τι ισχύει όταν ο εξωδικαστικός ολοκληρώνεται χωρίς συμφωνία.";
const canonical = localizedPageUrl(routing.defaultLocale, "/exodikastikos/odigos");
const openGraph = ogDefaults(routing.defaultLocale);
const sourceLink = "font-medium text-primary underline decoration-accent underline-offset-4";
const sectionHeading = "border-l-4 border-accent pl-4 font-playfair text-2xl font-bold leading-snug text-primary sm:text-3xl";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical },
  openGraph: { ...openGraph, type: "article", url: canonical, title, description, alternateLocale: [] },
  twitter: { card: "summary_large_image", title, description, images: openGraph.images },
};

export default async function DebtSettlementGuidePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  if (locale !== routing.defaultLocale) redirect(`/${locale}/exodikastikos`);

  return (
    <article>
      <header className="bg-primary py-14 text-white sm:py-20">
        <div className="mx-auto max-w-3xl px-6">
          <Link href="/exodikastikos" className="text-sm text-white/85 underline underline-offset-4 hover:text-white">
            Εξωδικαστικός μηχανισμός
          </Link>
          <h1 className="mt-5 border-l-4 border-accent pl-5 font-playfair text-3xl font-bold leading-tight sm:text-5xl">
            {title}
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-white/80">
            Η πλατφόρμα χρησιμοποιεί τα στοιχεία της αίτησης για να υπολογίσει τους όρους μιας ρύθμισης. Το αν η πρόταση θα προχωρήσει εξαρτάται και από την κατηγορία του οφειλέτη, τη στάση των πιστωτών και την επιλογή του οφειλέτη.
          </p>
        </div>
      </header>

      <div className="mx-auto max-w-3xl space-y-12 px-6 py-12 leading-relaxed text-gray-700 sm:py-16">
        <section className="space-y-4">
          <h2 className={sectionHeading}>Τι υπολογίζει ο αλγόριθμος</h2>
          <p>
            Ο αλγόριθμος είναι το υπολογιστικό εργαλείο της πλατφόρμας. Χρησιμοποιεί τα καταχωρισμένα υπόλοιπα των οφειλών, το εισόδημα που απομένει μετά τις εύλογες και ανελαστικές δαπάνες και την εκτιμώμενη αξία ρευστοποίησης της περιουσίας. Όπου προβλέπεται, συνυπολογίζει τα στοιχεία συνοφειλετών ή εγγυητών που συμμετέχουν στη διαδικασία. Με βάση αυτά διαμορφώνει τα ποσά αποπληρωμής, τις δόσεις και την τυχόν διαγραφή ανά πιστωτή.
          </p>
          <p>
            Δύο οφειλέτες με το ίδιο χρέος μπορεί να λάβουν διαφορετική πρόταση. Ένα ακίνητο με προσημείωση, για παράδειγμα, επηρεάζει τι θα μπορούσε να ανακτήσει ο πιστωτής από την εκποίησή του. Πριν από την υποβολή, στο γραφείο ελέγχουμε ποιος δικαιούται να εισπράξει την οφειλή, πώς προκύπτει το υπόλοιπο που δήλωσε ο servicer και ποιες χρεώσεις ή τόκοι χρειάζονται τεκμηρίωση.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className={sectionHeading}>Πότε τεκμαίρεται η συναίνεση των πιστωτών</h2>
          <p>
            Για τον ευάλωτο οφειλέτη που έχει εκδώσει τη σχετική βεβαίωση, ο νόμος θεωρεί ότι οι πιστωτές συναινούν στην πρόταση που διαμορφώνεται με την ειδική διαδικασία του άρθρου 14 παρ. 3. Ο ίδιος κανόνας καλύπτει και τους επιλέξιμους οφειλέτες με έως το διπλάσιο των εισοδηματικών και περιουσιακών κριτηρίων του ευάλωτου, εφόσον πληρούν και τον ειδικό όρο για οφειλές προς χρηματοδοτικούς φορείς έως 300.000 €, με καθυστέρηση τουλάχιστον 90 ημερών, εν όλω ή εν μέρει, κατά την έναρξη ισχύος του ν. 5193/2025.
          </p>
          <p>
            Ο οφειλέτης μπορεί να αποδεχθεί ή να απορρίψει την πρόταση. Πιστωτής που την αμφισβητεί έχει 20 ημέρες από την εξαγωγή της για να ασκήσει ανακοπή στο αρμόδιο Πρωτοδικείο. Οι λόγοι περιορίζονται σε ανακριβή στοιχεία που υπέβαλε ο οφειλέτης ή σε μικρότερη ικανοποίηση της απαίτησης του πιστωτή σε σχέση με εκείνη που θα προέκυπτε από αναγκαστική εκτέλεση.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className={sectionHeading}>Πότε μπορούν οι πιστωτές να απορρίψουν την πρόταση</h2>
          <p>
            Στην πολυμερή διαδικασία εκτός του καθεστώτος τεκμαιρόμενης συναίνεσης, οι χρηματοδοτικοί φορείς αξιολογούν την πρόταση και μπορούν να συναινέσουν, να υποβάλουν αντιπρόταση ή να αρνηθούν τη ρύθμιση. Για να προχωρήσει η συμφωνία χρειάζεται συναίνεση που να καλύπτει τουλάχιστον το 60% των απαιτήσεων των συμμετεχόντων χρηματοδοτικών φορέων και το 40% των απαιτήσεών τους με ειδικό προνόμιο, όπως υποθήκη ή προσημείωση. Τα ποσοστά υπολογίζονται στο ύψος των απαιτήσεων.
          </p>
          <p>
            Οι χρηματοδοτικοί φορείς οφείλουν να αιτιολογούν τη μη συναίνεση στην πρόταση της πλατφόρμας. Ένας λόγος μπορεί να είναι η αντικειμενική αδυναμία τήρησης των προτεινόμενων δόσεων. Άλλος λόγος μπορεί να είναι ένας πλειστηριασμός που επίκειται μέσα στο επόμενο τρίμηνο. Όταν η πολυμερής διαδικασία αποτυγχάνει στο στάδιο των πιστωτών, μπορεί να εξεταστεί χωριστή ρύθμιση προς το Δημόσιο ή τους φορείς κοινωνικής ασφάλισης, εφόσον πληρούνται οι προϋποθέσεις της.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className={sectionHeading}>Τι ισχύει αν η διαδικασία κλείσει χωρίς συμφωνία</h2>
          <p>
            Για τις οφειλές που μένουν αρρύθμιστες, η προσωρινή αναστολή του άρθρου 18 λήγει, όπου είχε ενεργοποιηθεί. Ο πιστωτής μπορεί τότε να συνεχίσει την αναγκαστική εκτέλεση, εφόσον έχει τις νόμιμες προϋποθέσεις. Η αναστολή έχει εξ αρχής εξαιρέσεις. Μεταξύ άλλων, εξαιρείται ο πλειστηριασμός που έχει προγραμματιστεί μέσα σε τρεις μήνες από την υποβολή, καθώς και οι προπαρασκευαστικές ενέργειες του ενέγγυου πιστωτή, στις οποίες μπορεί να περιλαμβάνεται κατάσχεση.
          </p>
          <p>
            Αν έχει ήδη επιδοθεί διαταγή πληρωμής, κατασχετήρια έκθεση ή πρόγραμμα πλειστηριασμού, εξετάζουμε τις επιδόσεις και τις προθεσμίες χωριστά από την πορεία της αίτησης. Έτσι μπορούμε να αξιολογήσουμε εγκαίρως αν χρειάζεται ανακοπή, αίτημα αναστολής ή διαπραγμάτευση με τον πιστωτή.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className={sectionHeading}>Τι ελέγχουμε πριν αποδεχθείτε μια πρόταση</h2>
          <p>
            Εξετάζουμε τον πίνακα δόσεων ανά πιστωτή, το συνολικό κόστος της ρύθμισης, τις εξασφαλίσεις και τις συνέπειες αν η ρύθμιση αθετηθεί. Για παράδειγμα, μια δόση που χωρά στον μηνιαίο προϋπολογισμό μπορεί να συνοδεύεται από σύμβαση που περιλαμβάνει υπόλοιπο το οποίο αμφισβητείτε. Η σύμβαση αναδιάρθρωσης μπορεί να χρησιμοποιηθεί ως εκτελεστός τίτλος από χρηματοδοτικούς φορείς σύμφωνα με το άρθρο 27. Γι’ αυτό ελέγχουμε και την απαίτηση που μπαίνει στη σύμβαση, μαζί με το ύψος της δόσης.
          </p>
          <p>
            Ο φάκελος για τον έλεγχο περιλαμβάνει την πλήρη πρόταση, την αναλυτική κίνηση της οφειλής και τυχόν έγγραφα που έχουν ήδη επιδοθεί. <Link href="/contact" className={sourceLink}>Επικοινωνία με το γραφείο για έλεγχο πρότασης</Link>
          </p>
        </section>

        <aside aria-labelledby="guide-sources" className="border-t border-gray-200 pt-6 text-sm">
          <h2 id="guide-sources" className="font-semibold text-primary">Νομοθεσία και διαδικασία</h2>
          <p className="mt-3 leading-relaxed">
            <a href="https://api.et.gr/apiLAW/1/2020/4738/pdf" className={sourceLink}>Ν. 4738/2020</a>
            {", "}
            <a href="https://api.et.gr/apiLAW/1/2025/5193/pdf" className={sourceLink}>άρθρο 178 του ν. 5193/2025</a>
            {", "}
            <a href="https://api.et.gr/apiLAW/1/2026/5313/pdf" className={sourceLink}>άρθρο 15 του ν. 5313/2026</a>
            {" και "}
            <a href="https://minfin.gov.gr/kratametospitimas.gr/ergaleia/veltiomenos-exodikastikos-michanismos-me-epipleon-kourema-chreous-os-28/sychnes-erotiseis-apantiseis/" className={sourceLink}>ερωτήσεις και απαντήσεις του Υπουργείου Οικονομικών</a>
            {"."}
          </p>
        </aside>
      </div>
    </article>
  );
}
