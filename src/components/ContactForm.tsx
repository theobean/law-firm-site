"use client";

import { Controller, useForm } from "react-hook-form";
import { useTranslations } from "next-intl";
import { useId, useRef, useState } from "react";
import { trackPropertyContact, type PropertyContactSource } from "@/lib/property-contact";
import ContactDatePicker from "./ContactDatePicker";

interface FormData {
  name: string;
  email: string;
  phone: string;
  message: string;
  botcheck: boolean;
  propertyArea?: string;
  propertyDeadline?: string;
}

const inputClassName = "w-full border border-gray-300 rounded-sm px-4 py-3 focus:outline-none focus:border-primary transition-colors";

export default function ContactForm({
  propertyPurchase = false,
  source,
}: {
  propertyPurchase?: boolean;
  source?: PropertyContactSource;
}) {
  const t = useTranslations("contact");
  const fieldId = useId();
  const submissionLocked = useRef(false);
  const [status, setStatus] = useState<"idle" | "sending" | "error" | "success">("idle");
  const { control, register, handleSubmit, formState: { errors } } = useForm<FormData>();

  async function onSubmit(data: FormData) {
    if (submissionLocked.current) return;
    submissionLocked.current = true;
    setStatus("sending");

    // Web3Forms free plan only accepts browser calls — the access key is
    // public by design (NEXT_PUBLIC). Spam is handled by the botcheck
    // honeypot, which Web3Forms discards server-side.
    const payload: Record<string, string | boolean | undefined> = {
      access_key: process.env.NEXT_PUBLIC_WEB3FORMS_KEY,
      subject: propertyPurchase ? `Αγορά ακινήτου | Νέο αίτημα από ${data.name}` : `Νέο μήνυμα από ${data.name}`,
      from_name: "Δικηγορικό Γραφείο Παπαϊωάννου — Φόρμα Επικοινωνίας",
      name: data.name,
      email: data.email,
      phone: data.phone || "—",
      message: data.message,
      botcheck: data.botcheck,
    };

    if (propertyPurchase) {
      payload["Θέμα"] = "Αγορά ακινήτου";
      const propertyArea = data.propertyArea?.trim();
      if (propertyArea) payload["Περιοχή ακινήτου"] = propertyArea;
      if (data.propertyDeadline) payload["Ημερομηνία προκαταβολής ή υπογραφής"] = data.propertyDeadline;
    }

    try {
      const response = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok || (await response.json()).success !== true) {
        throw new Error("Web3Forms did not confirm the submission");
      }
    } catch {
      submissionLocked.current = false;
      setStatus("error");
      return;
    }

    setStatus("success");
    if (propertyPurchase && !data.botcheck) trackPropertyContact("generate_lead", source);
  }

  if (status === "success") {
    return (
      <div role="status" className="relative overflow-hidden bg-gradient-to-br from-primary to-primary/90 rounded-sm p-12 text-center shadow-xl">
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
    <form onSubmit={handleSubmit(onSubmit)} noValidate aria-busy={status === "sending"} className="space-y-5">
      {/* Honeypot — humans never see or fill this */}
      <input
        type="checkbox"
        tabIndex={-1}
        autoComplete="off"
        className="hidden"
        aria-hidden="true"
        {...register("botcheck")}
      />
      {propertyPurchase && (
        <fieldset className="space-y-4 rounded-sm border border-accent/30 bg-accent/5 px-4 pb-4">
          <legend className="px-2 text-sm font-semibold text-primary">{t("propertyTopic")}</legend>
          <div>
            <label htmlFor={`${fieldId}-area`} className="block text-sm font-medium text-gray-700 mb-1">{t("propertyArea")}</label>
            <input
              id={`${fieldId}-area`}
              {...register("propertyArea")}
              maxLength={120}
              className={inputClassName}
            />
          </div>
          <div>
            <label id={`${fieldId}-deadline-label`} htmlFor={`${fieldId}-deadline`} className="block text-sm font-medium text-gray-700 mb-1">{t("propertyDeadline")}</label>
            <Controller
              control={control}
              name="propertyDeadline"
              defaultValue=""
              render={({ field }) => (
                <ContactDatePicker id={`${fieldId}-deadline`} value={field.value ?? ""} onChange={field.onChange} />
              )}
            />
          </div>
        </fieldset>
      )}
      <div>
        <label htmlFor={`${fieldId}-name`} className="block text-sm font-medium text-gray-700 mb-1">{t("name")} *</label>
        <input
          id={`${fieldId}-name`}
          {...register("name", { required: t("required") })}
          autoComplete="name"
          required
          aria-invalid={Boolean(errors.name)}
          aria-describedby={errors.name ? `${fieldId}-name-error` : undefined}
          className={inputClassName}
          placeholder={t("name")}
        />
        {errors.name && <p id={`${fieldId}-name-error`} className="text-red-700 text-xs mt-1">{errors.name.message}</p>}
      </div>

      <div>
        <label htmlFor={`${fieldId}-email`} className="block text-sm font-medium text-gray-700 mb-1">{t("email")} *</label>
        <input
          id={`${fieldId}-email`}
          {...register("email", {
            required: t("required"),
            pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: t("invalidEmail") },
          })}
          type="email"
          autoComplete="email"
          required
          aria-invalid={Boolean(errors.email)}
          aria-describedby={errors.email ? `${fieldId}-email-error` : undefined}
          className={inputClassName}
          placeholder="email@example.com"
        />
        {errors.email && <p id={`${fieldId}-email-error`} className="text-red-700 text-xs mt-1">{errors.email.message}</p>}
      </div>

      <div>
        <label htmlFor={`${fieldId}-phone`} className="block text-sm font-medium text-gray-700 mb-1">{t("phone")}</label>
        <input
          id={`${fieldId}-phone`}
          {...register("phone")}
          type="tel"
          autoComplete="tel"
          className={inputClassName}
          placeholder="+30 69X XXX XXXX"
        />
      </div>

      <div>
        <label htmlFor={`${fieldId}-message`} className="block text-sm font-medium text-gray-700 mb-1">{t("message")} *</label>
        <textarea
          id={`${fieldId}-message`}
          {...register("message", { required: t("required") })}
          rows={5}
          required
          aria-invalid={Boolean(errors.message)}
          aria-describedby={errors.message ? `${fieldId}-message-error` : undefined}
          className={`${inputClassName} resize-none`}
          placeholder={t("message")}
        />
        {errors.message && <p id={`${fieldId}-message-error`} className="text-red-700 text-xs mt-1">{errors.message.message}</p>}
      </div>

      {status === "error" && (
        <p role="alert" className="rounded-sm border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {t("sendError")}
        </p>
      )}
      <button
        type="submit"
        disabled={status === "sending"}
        className="w-full bg-accent hover:bg-accent/90 disabled:opacity-60 text-white font-semibold py-4 rounded-sm transition-colors"
      >
        {status === "sending" ? t("sending") : t("send")}
      </button>
    </form>
  );
}
