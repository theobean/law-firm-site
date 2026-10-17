# Law Firm Site — Παπαϊωάννου & Συνεργάτες

Ιστότοπος δικηγορικού γραφείου με υπηρεσίες, άρθρα, δικαστικές αποφάσεις, συνεντεύξεις, φόρμα επικοινωνίας και newsletter.

**Production:** [www.ioannispapaioannou.lawyer](https://www.ioannispapaioannou.lawyer)

## Τεχνολογίες

- **Next.js 16.4.1**, App Router, TypeScript και React / React DOM 19.2.4.
- Tailwind CSS 4 και γραμματοσειρές Inter / Jost μέσω `next/font`.
- `next-intl` για ελληνική, αγγλική και γερμανική διεπαφή (`el`, `en`, `de`).
- Sanity για το περιεχόμενο και ενσωματωμένο Studio στο `/studio`.
- Web3Forms για τη φόρμα επικοινωνίας και Brevo για newsletter / αποστολές άρθρων.
- Vercel για hosting, deployments και firewall.

Οι ακριβείς εγκατεστημένες εκδόσεις καθορίζονται από το [package-lock.json](package-lock.json). Το Next.js είναι κλειδωμένο στην `16.4.1`, με Sharp `0.35.5` στο lockfile.

## Τοπική εγκατάσταση

Προτεινόμενο περιβάλλον: **Node.js 24.x** και npm, όπως στο production. Το repository δεν επιβάλλει έκδοση Node μέσω `engines` ή `.nvmrc`.

```bash
gh repo clone theobean/law-firm-site
cd law-firm-site
npm ci
```

Δημιούργησε `.env.local` στη ρίζα του project:

```dotenv
NEXT_PUBLIC_SANITY_PROJECT_ID=hwu5yvsr
NEXT_PUBLIC_SANITY_DATASET=production
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_WEB3FORMS_KEY=
```

Το δημόσιο Sanity project / dataset παραπάνω είναι και οι προεπιλογές του κώδικα. Τοπικά διαβάζεται το ίδιο περιεχόμενο, εκτός αν ορίσεις διαφορετικό dataset. Για πραγματικές υποβολές επικοινωνίας χρειάζεται το Web3Forms access key.

```bash
npm run dev
```

Άνοιξε το [localhost:3000/el](http://localhost:3000/el). Διατίθενται επίσης `/en`, `/de` και `/studio`. Το build χρειάζεται πρόσβαση στο Sanity και στο Google Fonts.

## Μεταβλητές περιβάλλοντος

| Μεταβλητή | Χρήση |
| --- | --- |
| `NEXT_PUBLIC_SANITY_PROJECT_ID` | Δημόσιο project ID του Sanity. Προεπιλογή: `hwu5yvsr`. |
| `NEXT_PUBLIC_SANITY_DATASET` | Dataset περιεχομένου. Προεπιλογή: `production`. |
| `NEXT_PUBLIC_SITE_URL` | Βασικό URL για canonical links, sitemap, RSS και συνδέσμους email. Στο production ορίζεται στο κανονικό HTTPS domain. |
| `NEXT_PUBLIC_WEB3FORMS_KEY` | Δημόσιο Web3Forms access key για τις υποβολές της φόρμας επικοινωνίας. |
| `BREVO_API_KEY` | Ιδιωτικό API key για εγγραφές newsletter και αποστολές καμπανιών. |
| `BREVO_LIST_ID` | Αριθμητικό ID της λίστας συνδρομητών στο Brevo. |
| `BREVO_SENDER_EMAIL` | Επιβεβαιωμένος αποστολέας στο Brevo, απαραίτητος για καμπάνιες άρθρων. |
| `BREVO_SENDER_NAME` | Προαιρετικό όνομα αποστολέα. Αν απουσιάζει, χρησιμοποιείται το όνομα του γραφείου. |
| `SANITY_WEBHOOK_SECRET` | Κοινό μυστικό για την εξουσιοδότηση του webhook αποστολής άρθρων. |
| `SANITY_API_TOKEN` | Μόνο για βοηθητικά scripts συντήρησης του CMS· δεν χρειάζεται στο δημόσιο runtime. |

Πρόσθεσε τις server-side μεταβλητές τοπικά μόνο όταν χρειάζεσαι τις αντίστοιχες διασυνδέσεις. Οι μεταβλητές `NEXT_PUBLIC_*` ενσωματώνονται στον κώδικα του browser κατά το build· δεν πρέπει να περιέχουν ιδιωτικά API keys ή secrets.

Τα `.env*` αγνοούνται από το Git. Οι production τιμές διαχειρίζονται στο Vercel και επιλέγονται ανά environment. Ένα `vercel env pull` μπορεί να εξαγάγει `[SENSITIVE]` αντί πραγματικής τιμής για προστατευμένες μεταβλητές· αυτές οι ενδείξεις δεν αποτελούν έγκυρη τοπική ρύθμιση.

## Περιεχόμενο και γλώσσες

- Οι σελίδες βρίσκονται στο [src/app/[locale]](src/app/%5Blocale%5D), ενώ τα κείμενα της διεπαφής στα [messages](messages).
- Το routing και οι υποστηριζόμενες γλώσσες ορίζονται στο [src/i18n/routing.ts](src/i18n/routing.ts). Προεπιλεγμένη γλώσσα είναι η ελληνική. Το [src/proxy.ts](src/proxy.ts) χειρίζεται τη δρομολόγηση γλώσσας και τις σχετικές προτιμήσεις.
- Άρθρα, αποφάσεις και συνεντεύξεις διαχειρίζονται από το `/studio`, με λογαριασμό που έχει πρόσβαση στο Sanity project. Τα schemas βρίσκονται στο [src/sanity/schemaTypes](src/sanity/schemaTypes).
- Η διεπαφή μεταφράζεται ανά γλώσσα, αλλά το περιεχόμενο του CMS είναι κοινό και δεν μεταφράζεται αυτόματα.
- Το `/sitemap.xml` περιλαμβάνει τις σελίδες του site και περιεχόμενο από το CMS. Το `/rss.xml` περιλαμβάνει έως 30 πρόσφατα άρθρα με ελληνικούς συνδέσμους και επανεπικυρώνεται ανά ώρα.
- Τα εργαλεία στο [scripts](scripts) περιλαμβάνουν ενέργειες που αλλάζουν πραγματικό περιεχόμενο στο Sanity. Έλεγξε project, dataset και δικαιώματα token πριν τα χρησιμοποιήσεις.

## Επικοινωνία, newsletter και webhook

### Φόρμα επικοινωνίας

Το [ContactForm.tsx](src/components/ContactForm.tsx) στέλνει από τον browser απευθείας στο Web3Forms και περιλαμβάνει validation και honeypot πεδίο. Το `POST /api/contact` επιστρέφει σκόπιμα **404** και δεν χρησιμοποιείται ως mail relay.

### Newsletter

Το `POST /api/newsletter` προσθέτει ή ενημερώνει συνδρομητή στη λίστα του Brevo. Απορρίπτει μη έγκυρο email με **400**. Αν έχει συμπληρωθεί το honeypot `botcheck`, επιστρέφει **200** χωρίς να καλέσει το Brevo.

### Δημοσίευση άρθρου

Το `POST /api/article-published` μπορεί να κληθεί από webhook του Sanity με:

- Header `sanity-webhook-secret`, ίσο με το `SANITY_WEBHOOK_SECRET`.
- JSON body με `_type: "article"` και `slug.current` του δημοσιευμένου άρθρου.

Αν το άρθρο υπάρχει και οι μεταβλητές Brevo έχουν οριστεί, ο handler δημιουργεί και **αποστέλλει άμεσα καμπάνια στη λίστα συνδρομητών**. Δεν διαθέτει deduplication: επαναλήψεις ή retries μπορούν να προκαλέσουν νέα αποστολή. Η εξωτερική ρύθμιση του webhook γίνεται στο Sanity και δεν αποθηκεύεται σε αυτό το repository.

Για smoke tests χρησιμοποίησε μόνο αιτήματα χωρίς έγκυρο secret, που αναμένεται να επιστρέφουν **401**. Μην ενεργοποιείς πραγματικές αποστολές καμπανιών ως δοκιμή λειτουργίας.

## Build και έλεγχοι πριν από deployment

```bash
npm ci
npm run build
npm run start
```

Το production build περιλαμβάνει έλεγχο TypeScript. Τα διαθέσιμα npm scripts είναι `dev`, `build` και `start`· δεν υπάρχει ξεχωριστό test ή lint script.

Έλεγξε πριν από δημοσίευση:

1. `/el`, `/en`, `/de`, αλλαγή γλώσσας, μενού κινητού και ρυθμίσεις cookies.
2. Υπηρεσίες και τραπεζικές σελίδες, μαζί με τη δυναμική `/de/practice-areas/banking`.
3. Λίστες και πραγματικές detail σελίδες από `/el/blog`, `/el/decisions` και `/el/media`.
4. Εικόνες, CSS / JavaScript, `/sitemap.xml`, `/robots.txt` και `/rss.xml`.
5. Redirects παλιών WordPress URLs και 404 για άγνωστες διαδρομές.
6. Εμφάνιση και validation της φόρμας επικοινωνίας χωρίς αποστολή μηνύματος.
7. Τοπικά API rejection checks: μη έγκυρο newsletter email → **400**, συμπληρωμένο honeypot → **200**, webhook χωρίς secret → **401**.

Το επιτυχές build από μόνο του δεν επιβεβαιώνει όλες τις συνδέσεις με εξωτερικές υπηρεσίες. Έλεγξε και το πραγματικό περιεχόμενο του CMS στο deployment.

## Deployment στο Vercel

Το GitHub repository συνδέεται με το Vercel project **`law-firm-site`**, στην ομάδα **`pap5`**. Το **`main`** είναι το production branch.

Για αλλαγές εφαρμογής ή εξαρτήσεων:

1. Κάνε την αλλαγή σε branch και ενημέρωσε μαζί `package.json` / `package-lock.json` όταν αλλάζουν εξαρτήσεις.
2. Άνοιξε pull request και έλεγξε το Vercel preview και το build του.
3. Μετά το merge στο `main`, έλεγξε ότι το production deployment είναι **Ready** και έχει συνδεθεί με τα κανονικά domains.
4. Επανέλαβε τους βασικούς ελέγχους στο [δημόσιο site](https://www.ioannispapaioannou.lawyer) και επιβεβαίωσε την έκδοση Next.js στα build logs.

Για σύνδεση του τοπικού φακέλου με το υπάρχον project μέσω CLI:

```bash
vercel login
vercel link --yes --scope pap5 --project law-firm-site
```

Οι production μεταβλητές περιβάλλοντος παραμένουν στο Vercel. Αλλαγή σε `NEXT_PUBLIC_*` απαιτεί νέο build για να περάσει στον browser.

## Ρυθμίσεις ασφαλείας

- Τα security headers και τα redirects ορίζονται στο [next.config.ts](next.config.ts). Η δημόσια CSP στο production δεν επιτρέπει `unsafe-eval`, ενώ το `/studio` το επιτρέπει για τη λειτουργία του Sanity Studio.
- Το WAF, το **Bot Protection → Challenge** και οι αποκλεισμοί IP διαχειρίζονται από το [Vercel Firewall](https://vercel.com/pap5/law-firm-site/firewall/rules), ανεξάρτητα από τον κώδικα του repository.
- Οι αποκλεισμοί IP ανά hostname χρειάζονται κάλυψη και για `ioannispapaioannou.lawyer` και για `www.ioannispapaioannou.lawyer` όταν ο αποκλεισμός πρέπει να ισχύει και στα δύο domains.
- Έλεγξε την προστασία αυτοματοποιημένης κίνησης και την πρόσβαση κανονικού browser μετά από σημαντικές αλλαγές. Το firewall δεν υποκαθιστά τις ενημερώσεις των εξαρτήσεων ή τον έλεγχο της εφαρμογής.
