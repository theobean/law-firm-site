"use client";

import { useState } from "react";
import { GraduationCap, ChevronDown } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";

interface Member {
  key: "ioannis" | "georgios" | "lamprinι";
  initials: string;
  photo?: string;
}

const members: Member[] = [
  { key: "ioannis", initials: "ΙΠ", photo: "/δικηγορος.png" },
  { key: "georgios", initials: "ΛΓ" },
  { key: "lamprinι", initials: "ΠΛ" },
];

function TeamCard({ member }: { member: Member }) {
  const t = useTranslations("team");
  const [open, setOpen] = useState(false);

  const name = t(`${member.key}.name`);
  const role = t(`${member.key}.role`);
  const bio = t(`${member.key}.bio`);
  // next-intl raw array access
  const edu0 = t.raw(`${member.key}.edu`) as string[];
  // Optional specializations (only some members have them)
  let specializations: string[] = [];
  try { specializations = t.raw(`${member.key}.specializations`) as string[]; } catch { /* not all members have this */ }

  return (
    <div className="group flex flex-col border border-gray-100 rounded-sm overflow-hidden hover:border-accent/40 hover:shadow-lg transition-all duration-300">
      {/* Portrait */}
      <div className="relative aspect-[3/4] bg-primary overflow-hidden">
        {member.photo ? (
          <Image
            src={member.photo}
            alt={name}
            fill
            className="object-cover object-top transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <span className="absolute inset-0 flex items-center justify-center text-accent font-playfair font-bold text-7xl opacity-20 select-none">
            {member.initials}
          </span>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-primary/60 via-transparent to-transparent" />
      </div>

      {/* Info */}
      <div className="p-5 flex flex-col gap-1">
        <h3 className="text-xl font-playfair font-bold text-primary leading-tight">{name}</h3>
        <p className="text-accent text-xs font-semibold tracking-wide uppercase mb-2">{role}</p>
        <p className="text-gray-600 text-sm leading-relaxed">{bio}</p>

        {/* Specializations badges */}
        {specializations.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {specializations.map((s, i) => (
              <span key={i} className="text-[10px] font-semibold tracking-wide bg-accent/10 text-accent border border-accent/20 px-2 py-0.5 rounded-sm">
                {s}
              </span>
            ))}
          </div>
        )}

        {/* Expandable education */}
        <button
          onClick={() => setOpen(!open)}
          className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-primary/60 hover:text-accent transition-colors"
        >
          <GraduationCap size={13} />
          {t("educationLabel")}
          <ChevronDown
            size={13}
            className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          />
        </button>

        <div
          className={`overflow-hidden transition-all duration-300 ease-in-out ${
            open ? "max-h-40 opacity-100 mt-2" : "max-h-0 opacity-0"
          }`}
        >
          <ul className="space-y-1.5 border-l-2 border-accent/30 pl-3">
            {edu0.map((item, i) => (
              <li key={i} className="text-gray-600 text-xs leading-snug">
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

export default function TeamGrid() {
  const t = useTranslations("team");

  return (
    <section className="max-w-6xl mx-auto px-6 py-20">
      <div className="mb-12">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-px bg-accent" />
          <p className="text-accent text-sm font-semibold tracking-widest uppercase">
            {t("sectionTitle")}
          </p>
        </div>
        <h2 className="text-3xl font-playfair font-bold text-primary">
          {t("sectionSubtitle")}
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {members.map((m) => (
          <TeamCard key={m.key} member={m} />
        ))}
      </div>
    </section>
  );
}
