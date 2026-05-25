"use client";

import { useForm } from "react-hook-form";
import { useTranslations } from "next-intl";
import { useState } from "react";

interface FormData {
  name: string;
  email: string;
  phone: string;
  message: string;
}

export default function ContactForm() {
  const t = useTranslations("contact");
  const [submitted, setSubmitted] = useState(false);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>();

  async function onSubmit(data: FormData) {
    const res = await fetch("https://api.web3forms.com/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        access_key: "36eb1c5f-2261-4b67-af44-085ab241a840",
        subject: `Νέο μήνυμα από ${data.name}`,
        from_name: "Δικηγορικό Γραφείο Παπαϊωάννου — Φόρμα Επικοινωνίας",
        name: data.name,
        email: data.email,
        phone: data.phone || "—",
        message: data.message,
      }),
    });
    const result = await res.json();
    if (result.success) setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="relative overflow-hidden bg-gradient-to-br from-primary to-primary/90 rounded-sm p-12 text-center shadow-xl">
        <div className="absolute top-0 left-0 w-full h-1 bg-accent" />
        <div className="mx-auto w-20 h-20 rounded-full bg-accent/15 border-2 border-accent flex items-center justify-center mb-6">
          <svg className="w-10 h-10 text-accent" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-white font-playfair font-bold text-2xl mb-3">
          {t("success")}
        </h3>
        <p className="text-white/70 text-sm max-w-md mx-auto leading-relaxed">
          {t("successDetail")}
        </p>
        <div className="mt-8 inline-flex items-center gap-2 text-accent text-xs uppercase tracking-widest font-semibold">
          <span className="w-8 h-px bg-accent" />
          {t("firmName")}
          <span className="w-8 h-px bg-accent" />
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">{t("name")} *</label>
        <input
          {...register("name", { required: t("required") })}
          className="w-full border border-gray-300 rounded-sm px-4 py-3 focus:outline-none focus:border-primary transition-colors"
          placeholder={t("name")}
        />
        {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">{t("email")} *</label>
        <input
          {...register("email", {
            required: t("required"),
            pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: t("invalidEmail") },
          })}
          type="email"
          className="w-full border border-gray-300 rounded-sm px-4 py-3 focus:outline-none focus:border-primary transition-colors"
          placeholder="email@example.com"
        />
        {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">{t("phone")}</label>
        <input
          {...register("phone")}
          type="tel"
          className="w-full border border-gray-300 rounded-sm px-4 py-3 focus:outline-none focus:border-primary transition-colors"
          placeholder="+30 69X XXX XXXX"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">{t("message")} *</label>
        <textarea
          {...register("message", { required: t("required") })}
          rows={5}
          className="w-full border border-gray-300 rounded-sm px-4 py-3 focus:outline-none focus:border-primary transition-colors resize-none"
          placeholder={t("message")}
        />
        {errors.message && <p className="text-red-500 text-xs mt-1">{errors.message.message}</p>}
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-accent hover:bg-accent/90 disabled:opacity-60 text-white font-semibold py-4 rounded-sm transition-colors"
      >
        {isSubmitting ? t("sending") : t("send")}
      </button>
    </form>
  );
}
