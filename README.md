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
| `CHATBOT_ENABLED` | Ο βοηθός εμφανίζεται και το `/api/chat` ενεργοποιείται μόνο με την ακριβή τιμή `true`. Προεπιλογή: απενεργοποιημένος. Αλλαγή χρειάζεται νέο build. |
| `OPENAI_API_KEY` | Ιδιωτικό server-side κλειδί OpenAI API για τον ψηφιακό βοηθό. Ποτέ με πρόθεμα `NEXT_PUBLIC_`. |
| `OPENAI_CHAT_MODEL` | Επιτρέπεται μόνο `gpt-5.4-mini` ή `gpt-5.4-mini-2026-03-17`, με επίλυση στο συγκεκριμένο snapshot και standard tier για τον έλεγχο κόστους. |
| `CHAT_DATABASE_URL` | Ιδιωτικό Neon Postgres URL του περιορισμένου runtime ρόλου, με TLS. Ο ρόλος καλεί μόνο τις συναρτήσεις quotas. Ποτέ owner/admin URL. |
| `CHAT_RATE_LIMIT_SECRET` | Ιδιωτικό σταθερό μυστικό 32+ χαρακτήρων για HMAC αναγνωριστικά, κοινό σε όλα τα instances. |
| `CHAT_TURNSTILE_ENABLED` / `NEXT_PUBLIC_CHAT_TURNSTILE_ENABLED` | Ορίζονται και τα δύο σε `true` για προστασία σε server και browser. Απαιτείται νέο build. |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Δημόσιο site key του Turnstile widget. |
| `CHAT_TURNSTILE_SECRET_KEY` | Ιδιωτικό κλειδί Siteverify, μόνο στον server. |
| `CHAT_TURNSTILE_HOSTNAMES` | Ακριβή επιτρεπόμενα hostnames με κόμμα, χωρίς wildcards/URLs. |

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

### Ψηφιακός βοηθός AI

Ο βοηθός υποστηρίζει `el`, `en` και `de` και χρησιμοποιεί το `POST /api/chat`.
Για τοπική προεπισκόπηση της διεπαφής πρόσθεσε `CHATBOT_ENABLED=true` στο
`.env.local`. Χωρίς `OPENAI_API_KEY` η αποστολή επιστρέφει **503** και εμφανίζεται
μήνυμα προσωρινής μη διαθεσιμότητας με άμεση επικοινωνία με το γραφείο. Δεν
υπάρχουν προσομοιωμένες απαντήσεις AI στο πραγματικό περιβάλλον.

Για ενεργοποίηση στο Vercel, πρόσθεσε `OPENAI_API_KEY`, το scoped `CHAT_DATABASE_URL`,
το ιδιωτικό σταθερό `CHAT_RATE_LIMIT_SECRET` και `CHATBOT_ENABLED=true` στις
μεταβλητές του κατάλληλου environment και κάνε νέο
deployment. Δημιούργησε το κλειδί στο [OpenAI API dashboard](https://platform.openai.com/api-keys)
με λογαριασμό που έχει πρόσβαση API / διαθέσιμη χρέωση. Μην το καταχωρίζεις σε
GitHub, κώδικα browser, μηνύματα ή `NEXT_PUBLIC_*`. Ξεκίνα από Preview.

Τα rate limits και quotas εφαρμόζονται ατομικά σε Neon Postgres πριν από κάθε κλήση
μοντέλου, με διαφορετικά όρια για ανώνυμους και επαληθευμένους χρήστες. Ελλιπής
ρύθμιση, εξάντληση δωρεάν πόρων ή βλάβη βάσης επιστρέφει **503**, χωρίς fallback
στη μνήμη ή κλήση LLM.
Περιλαμβάνονται token buckets, ημερήσια quotas και leases ταυτόχρονων αιτημάτων,
ανά ταυτότητα, δίκτυο και συνολικά. Διατήρησε το edge/WAF για γενική HTTP κατάχρηση.
Δες [ρυθμίσεις και ακριβή όρια](docs/chatbot-quotas.md).

Η βάση παραμένει σε Neon **Free**, χωρίς ενεργοποίηση πληρωμένου πλάνου.
Τα SQL scripts δημιουργούν ξεχωριστό λογαριασμό με δικαίωμα εκτέλεσης μόνο των
`chat_quota.reserve` και `chat_quota.release`, χωρίς πρόσβαση στους πίνακες ή
διαχειριστικά δικαιώματα. Το namespace/environment συνδέεται με τον λογαριασμό
μέσα στη βάση. Το owner credential χρησιμοποιείται για setup/διαχείριση και δεν
περνά στις μεταβλητές ή στο runtime του site. Κάθε environment χρειάζεται δικό
του runtime credential. Η διαχείριση της βάσης μέσω Marketplace παραμένει
ξεχωριστή από τα δικαιώματα της εφαρμογής.

Το μοντέλο έχει ρητά `tools: []` και `tool_choice: "none"`. Δεν μπορεί να στείλει
μηνύματα, να κλείσει ραντεβού, να αλλάξει/διαγράψει στοιχεία ή να καλέσει APIs.
Απρόσμενα tool calls και μη υποστηριζόμενοι τύποι απάντησης απορρίπτονται ακόμη
και μαζί με έγκυρο κείμενο. Το backend απορρίπτει redirects της κλήσης OpenAI.
Τα μόνα database writes της συνομιλίας είναι οι εσωτερικές κρατήσεις quotas.
Οι μόνιμες διαπιστεύσεις χρειάζονται περιορισμένα provider permissions και
ξεχωριστό quota store. Μελλοντικές ενέργειες υψηλού αντίκτυπου απαιτούν ανεξάρτητη
server-side έγκριση εξουσιοδοτημένου ανθρώπου πριν ενεργοποιηθούν· δεν υπάρχει
τέτοια δυνατότητα ενεργειών σήμερα. Δες [capabilities και least privilege](docs/chatbot-capabilities.md).

Η LEXI λειτουργεί χωρίς εγγραφή ή login. Με ενεργό Turnstile, κάθε ερώτηση
επαληθεύεται στον server και ένα υπογεγραμμένο cookie 24 ωρών διατηρεί το
ανώνυμο όριο του browser ακόμη και όταν αλλάζει η IP. Παραμένουν κοινά όρια
δικτύου και συνολικής κατανάλωσης. Το χρηματικό όριο είναι 5€ ανά UTC ημέρα
στο ενεργό namespace/environment, με συντηρητική κράτηση πριν από την OpenAI,
ελεγμένη ισοτιμία ΕΚΤ και περιθώριο ασφαλείας. Δεν είναι μέτρηση τιμολογίου,
φόρων ή τραπεζικών προμηθειών. Δες [ρύθμιση ασφάλειας και απαιτούμενο έλεγχο
τιμών πριν τις 9 Δεκεμβρίου 2026](docs/chatbot-security.md).

Η συνομιλία αρχίζει μετά από ρητή επιλογή του επισκέπτη. Στην OpenAI αποστέλλεται
το ερώτημα, έως οκτώ πρόσφατα μηνύματα και η επιλεγμένη βάση πηγών. Ο κώδικας
δεν αποθηκεύει συνομιλίες και δεν καταγράφει prompts ή απαντήσεις στα logs.
Τα αιτήματα χρησιμοποιούν `store: false`, που απενεργοποιεί την αποθήκευση
application state από το Responses API· δεν ισοδυναμεί με μηδενική διατήρηση από
τον πάροχο για ελέγχους κατάχρησης. Δες τα επίσημα
[data controls](https://developers.openai.com/api/docs/guides/your-data).

Το `/api/chat` λειτουργεί ως backend proxy: ελέγχει consent, locale, ρόλους και
μέγεθος ιστορικού και επιλέγει μόνο τα επιτρεπόμενα πεδία πριν από την αποστολή
στο μοντέλο. Τα κείμενα κανονικοποιούνται σε Unicode NFC και LF, αφαιρούνται μη
εκτυπώσιμοι χαρακτήρες ελέγχου και direction overrides, και απορρίπτονται κενά,
υπερμεγέθη ή κακοσχηματισμένα Unicode μηνύματα. Τα JSON request/response bodies
περιορίζονται σε **64 KiB πραγματικών bytes**, ακόμη και χωρίς Content-Length.
Ελέγχονται ξανά οι απαντήσεις στον server και στον browser, μαζί με τα μήκη,
τους τύπους πεδίων και τους HTTPS συνδέσμους χωρίς credentials.

Τα μηνύματα εμφανίζονται από το `ChatText` ως απλά React text children, με
escaping στο DOM boundary. Η LEXI εμφανίζεται αριστερά με περιγραφή «Ο προσωπικός
σου βοηθός» και εφέ typewriter. Οι πηγές ελέγχονται στον server και στον browser,
χωρίς να εμφανίζεται λίστα παραπομπών στη συνομιλία. Δεν χρησιμοποιείται HTML injection,
Markdown-to-HTML ή `dangerouslySetInnerHTML` για περιεχόμενο συνομιλίας. Το
[React documentation](https://react.dev/reference/react-dom/components/common#dangerously-setting-the-inner-html)
εξηγεί τον κίνδυνο των raw HTML sinks. Η κανονικοποίηση κειμένου δεν αποτελεί
εγγύηση προστασίας από semantic prompt injection ή λανθασμένες νομικές απαντήσεις.

Το πεδίο `instructions` περιέχει μόνο το σταθερό template και την ελεγμένη
γλώσσα, μέσα σε `<assistant_instructions>`. Πηγές, ιστορικό και τρέχον ερώτημα
αποστέλλονται σε ξεχωριστά blocks `<reference_material>`,
`<conversation_history>` και `<user_input>` ενός user message. Τα δυναμικά κείμενα
περνούν από XML escaping, ώστε πλαστά closing tags να παραμένουν περιεχόμενο.
Ακόμη και μηνύματα ιστορικού με ρόλο assistant αντιμετωπίζονται ως δεδομένα από
τον browser. Τα quotas υπολογίζονται στο τελικό escaped payload. Οι delimiters
είναι συμπληρωματική βοήθεια προς το μοντέλο, όχι όριο εξουσιοδότησης ή εγγύηση
κατά του prompt injection· δες [τα prompt boundaries](docs/chatbot-content.md#prompt-data-boundaries).

Η πρόσβαση στο context επιβάλλεται στον server μέσω του `src/lib/chat/access.mjs`,
πριν κληθούν οι readers περιεχομένου. Ο δημόσιος βοηθός έχει μόνο τον server-issued
ρόλο `public` και άδεια ανάγνωσης των ρητά εγκεκριμένων δημόσιων πηγών και
καταχωρισμένων άρθρων του γραφείου. Ρόλοι, permissions, IDs ή context που δηλώνει ο client δεν δίνουν δικαιώματα.
Μη εγκεκριμένες, ιδιωτικές ή αδημοσίευτες πηγές αποκλείονται πριν κληθεί ο reader
τους. Προς το μοντέλο προβάλλονται μόνο `id`, `title`, `url`, `content` σε αμετάβλητο
snapshot. Το LLM service δέχεται μόνο context που εξουσιοδότησε η ίδια διεργασία,
όχι αυθαίρετους πίνακες πηγών ή αντικείμενα από JSON. Οι οδηγίες του system prompt
δεν αποτελούν μηχανισμό εξουσιοδότησης.

Η ανάκτηση context δεν συνδέεται με βάση ιδιωτικών υποθέσεων ή φακέλους πελατών.
Ο server διαβάζει χωρίς CMS token μόνο τα καταχωρισμένα δημοσιευμένα άρθρα από
το δημόσιο Sanity: ο έλεγχος principal και τα φίλτρα ID/slug/συντάκτη, δημοσίευσης
και αποκλεισμού drafts εφαρμόζονται πριν επιστραφεί κείμενο. Επιλέγονται έως δύο
σχετικά αποσπάσματα, όχι ολόκληρα τα άρθρα σε κάθε prompt. Το Neon Postgres
χρησιμοποιείται μόνο για μετρητές quotas.
Δεν υπάρχει authenticated client/staff portal ή database RBAC για τέτοια δεδομένα.
Πριν προστεθεί οποιαδήποτε τέτοια διασύνδεση, απαιτείται ξεχωριστή υλοποίηση με
επαληθευμένη server-side ταυτότητα, tenant/case permissions και περιορισμούς στο
query ή row-level policies **πριν από την ανάκτηση**, με αντίστοιχους περιορισμούς
στα credentials της βάσης. Δες [τα όρια πρόσβασης](docs/chatbot-content.md).

Οι απαντήσεις περιορίζονται σε επιλεγμένες πληροφορίες του γραφείου και γενικές
εξηγήσεις από επίσημες πηγές, με πρωτογενή αρχικά ΦΕΚ του Εθνικού Τυπογραφείου
και διακριτά αποσπάσματα άρθρων του δικηγόρου ως ερμηνευτικό σχόλιο. Τα αρχικά
ΦΕΚ δεν παρουσιάζονται ως ενοποιημένη ισχύουσα νομοθεσία. Μόνιμη ευδιάκριτη
αποποίηση δηλώνει ότι οι απαντήσεις δεν αποτελούν νομική συμβουλή.
Δεν γίνεται ζωντανή νομική έρευνα. Ο server
επιτρέπει μόνο αναγνωριστικά της δικής του βάσης πηγών και απορρίπτει απαντήσεις
τύπου `grounded` χωρίς πηγή. Για απάντηση χωρίς τεκμηρίωση χρησιμοποιεί σταθερό
μήνυμα παραπομπής. Η επιλογή πηγής από μοντέλο δεν εγγυάται από μόνη της την
ορθότητα κάθε πρότασης. Έλεγξε το περιεχόμενο και αντιπροσωπευτικές πραγματικές
απαντήσεις πριν από production· δες [την τεκμηρίωση περιεχομένου](docs/chatbot-content.md).

```bash
npm run test:chat
```

Οι έλεγχοι χρησιμοποιούν mock του API, χωρίς κλειδί ή χρέωση. Καλύπτουν όρια
input/history, Unicode, consent, roles, πηγές, XSS payloads στον πραγματικό React
text renderer, incomplete/refused output, origin, streamed body size, rate limits
και `store: false`. Ελέγχουν επίσης ότι μη εξουσιοδοτημένοι readers δεν καλούνται,
ότι πλαστοί ρόλοι/context δεν επεκτείνουν πρόσβαση και ότι ιδιωτικά πεδία δεν
περνούν στο provider request. Δεν αποτελούν αξιολόγηση
πραγματικών απαντήσεων μοντέλου. Τα transcripts μένουν μόνο στη μνήμη της
καρτέλας μέχρι ανανέωση, αλλαγή γλώσσας ή νέα συνομιλία.

Το `npm run test:chat:neon` είναι ξεχωριστός έλεγχος εναντίον πραγματικού,
δοκιμαστικού Neon Postgres. Δεν καλεί LLM. Χρησιμοποιεί απομονωμένους test ρόλους
και namespaces, με διαφορετικό administrative credential για fixtures και
περιορισμένο credential για τα πραγματικά αιτήματα. Οι συνήθεις unit έλεγχοι
δεν χρειάζονται εξωτερική υπηρεσία. Δες το explicit opt-in στο αντίστοιχο script.

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

Το production build περιλαμβάνει έλεγχο TypeScript. Οι έλεγχοι συνομιλίας εκτελούνται με `npm run test:chat`· δεν υπάρχει ξεχωριστό lint script.

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
