"use client";

import { useForm } from "react-hook-form";
import { useState } from "react";
import { Mail, Send, Check } from "lucide-react";

const i18n = {
  el: {
    eyebrow: "NEWSLETTER",
    heading: "Νομική Ενημέρωση στο email σας",
    sub: "Λάβετε μηνιαία τα νέα άρθρα του γραφείου μας — αναλύσεις αποφάσεων, αλλαγές στη νομοθεσία, πρακτικά ζητήματα.",
    placeholder: "Το email σας",
    button: "Εγγραφή",
    sending: "Αποστολή…",
    success: "Σας ευχαριστούμε για την εγγραφή!",
    successDetail: "Θα λαμβάνετε τα νέα άρθρα του γραφείου μας.",
    error: "Παρουσιάστηκε σφάλμα. Δοκιμάστε ξανά.",
    privacy: "Δεν μοιραζόμαστε τη διεύθυνσή σας με τρίτους. Μπορείτε να διαγραφείτε όποτε θελήσετε.",
  },
  en: {
    eyebrow: "NEWSLETTER",
    heading: "Legal updates in your inbox",
    sub: "Receive our new articles monthly — case-law analyses, legislative changes, practical issues.",
    placeholder: "Your email",
    button: "Subscribe",
    sending: "Sending…",
    success: "Thank you for subscribing!",
    successDetail: "You will receive our new articles.",
    error: "Something went wrong. Please try again.",
    privacy: "We do not share your address with third parties. You can unsubscribe at any time.",
  },
  de: {
    eyebrow: "NEWSLETTER",
    heading: "Rechtliche Updates in Ihrem Postfach",
    sub: "Erhalten Sie monatlich unsere neuen Artikel — Rechtsprechungsanalysen, Gesetzesänderungen, Praxisfragen.",
    placeholder: "Ihre E-Mail",
    button: "Abonnieren",
    sending: "Wird gesendet…",
    success: "Vielen Dank für Ihre Anmeldung!",
    successDetail: "Sie erhalten unsere neuen Artikel.",
    error: "Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.",
    privacy: "Wir geben Ihre Adresse nicht an Dritte weiter. Sie können sich jederzeit abmelden.",
  },
};

interface FormData {
  email: string;
  botcheck: boolean;
}

export default function NewsletterSignup({ locale }: { locale: string }) {
  const loc = (locale in i18n ? locale : "el") as keyof typeof i18n;
  const t = i18n[loc];
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>();

  async function onSubmit(data: FormData) {
    setErrorMsg(null);
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: data.email,
          locale,
          botcheck: data.botcheck,
        }),
      });
      const result = await res.json();
      if (result.success) setSubmitted(true);
      else setErrorMsg(t.error);
    } catch {
      setErrorMsg(t.error);
    }
  }

  return (
    <section className="bg-primary py-20 grain relative overflow-hidden">
      <div className="max-w-4xl mx-auto px-6 text-center">
        <p className="text-accent text-xs uppercase tracking-widest font-semibold mb-3">
          {t.eyebrow}
        </p>
        <h2 className="text-3xl md:text-4xl font-playfair font-bold text-white mb-4 leading-tight">
          {t.heading}
        </h2>
        <p className="text-white/70 text-base mb-8 max-w-2xl mx-auto leading-relaxed">
          {t.sub}
        </p>

        {submitted ? (
          <div className="max-w-md mx-auto">
            <div className="bg-accent/15 border border-accent/40 rounded-sm p-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-accent flex items-center justify-center flex-shrink-0">
                <Check size={22} className="text-primary" strokeWidth={3} />
              </div>
              <div className="text-left">
                <p className="text-white font-semibold">{t.success}</p>
                <p className="text-white/60 text-sm mt-1">{t.successDetail}</p>
              </div>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="max-w-md mx-auto">
            <input type="checkbox" {...register("botcheck")} className="hidden" tabIndex={-1} autoComplete="off" />
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-grow">
                <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
                <input
                  type="email"
                  placeholder={t.placeholder}
                  {...register("email", { required: true, pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ })}
                  className="w-full bg-white/10 border border-white/20 focus:border-accent text-white placeholder:text-white/40 rounded-sm pl-11 pr-4 py-3 outline-none transition-colors"
                  disabled={isSubmitting}
                />
              </div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center justify-center gap-2 bg-accent hover:bg-accent/90 active:bg-accent/80 text-primary font-semibold px-6 py-3 rounded-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
              >
                {isSubmitting ? t.sending : (<>{t.button} <Send size={14} /></>)}
              </button>
            </div>
            {errors.email && (
              <p className="text-accent text-xs mt-2 text-left">{t.error}</p>
            )}
            {errorMsg && (
              <p className="text-accent text-xs mt-2 text-left">{errorMsg}</p>
            )}
            <p className="text-white/40 text-xs mt-4 leading-relaxed">{t.privacy}</p>
          </form>
        )}
      </div>
    </section>
  );
}
