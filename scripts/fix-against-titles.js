const fs = require("fs");

const titles = {
  el: {
    dovalue: {
      seoTitle: "Δικηγόρος κατά doValue – Πλειστηριασμοί Θεσσαλονίκη",
      heroTitle: "Δικηγόρος κατά της doValue για Πλειστηριασμούς στη Θεσσαλονίκη",
    },
    intrum: {
      seoTitle: "Δικηγόρος κατά Intrum – Πλειστηριασμοί Θεσσαλονίκη",
      heroTitle: "Δικηγόρος κατά της Intrum για Πλειστηριασμούς στη Θεσσαλονίκη",
    },
    cepal: {
      seoTitle: "Δικηγόρος κατά Cepal – Πλειστηριασμοί Θεσσαλονίκη",
      heroTitle: "Δικηγόρος κατά της Cepal για Πλειστηριασμούς στη Θεσσαλονίκη",
    },
    qquant: {
      seoTitle: "Δικηγόρος κατά QQuant – Πλειστηριασμοί Θεσσαλονίκη",
      heroTitle: "Δικηγόρος κατά της QQuant για Απαιτήσεις και Πλειστηριασμούς στη Θεσσαλονίκη",
    },
  },
  en: {
    dovalue: {
      seoTitle: "Lawyer Against doValue – Foreclosures Thessaloniki",
      heroTitle: "Defence Lawyer Against doValue Foreclosures in Thessaloniki",
    },
    intrum: {
      seoTitle: "Lawyer Against Intrum – Foreclosures Thessaloniki",
      heroTitle: "Defence Lawyer Against Intrum Foreclosures in Thessaloniki",
    },
    cepal: {
      seoTitle: "Lawyer Against Cepal – Property Auctions Thessaloniki",
      heroTitle: "Defence Lawyer Against Cepal Auctions and Enforcement in Thessaloniki",
    },
    qquant: {
      seoTitle: "Lawyer Against QQuant – Debt Claims & Auctions Thessaloniki",
      heroTitle: "Defence Lawyer Against QQuant Claims and Auctions in Thessaloniki",
    },
  },
  de: {
    dovalue: {
      seoTitle: "Anwalt gegen doValue – Zwangsversteigerungen Thessaloniki",
      heroTitle: "Anwalt gegen doValue-Zwangsversteigerungen in Thessaloniki",
    },
    intrum: {
      seoTitle: "Anwalt gegen Intrum – Zwangsversteigerungen Thessaloniki",
      heroTitle: "Anwalt gegen Intrum-Zwangsversteigerungen in Thessaloniki",
    },
    cepal: {
      seoTitle: "Anwalt gegen Cepal – Zwangsversteigerungen Thessaloniki",
      heroTitle: "Anwalt gegen Cepal-Vollstreckungen und Zwangsversteigerungen in Thessaloniki",
    },
    qquant: {
      seoTitle: "Anwalt gegen QQuant – Forderungen & Zwangsversteigerungen Thessaloniki",
      heroTitle: "Anwalt gegen QQuant-Forderungen und Zwangsversteigerungen in Thessaloniki",
    },
  },
};

const base = "C:/Users/theob/Documents/law-firm-site/messages";

for (const lang of ["el", "en", "de"]) {
  const p = `${base}/${lang}.json`;
  const j = JSON.parse(fs.readFileSync(p, "utf8"));
  for (const ns of ["dovalue", "intrum", "cepal", "qquant"]) {
    j[ns].seoTitle = titles[lang][ns].seoTitle;
    j[ns].heroTitle = titles[lang][ns].heroTitle;
  }
  fs.writeFileSync(p, JSON.stringify(j, null, 2), "utf8");
  console.log(`${lang}.json updated`);
}
