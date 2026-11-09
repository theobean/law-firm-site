// Public article identity bindings inspected through Sanity's tokenless API on
// 2026-11-09. Publishing another CMS record does not expand this allowlist.
const authorId = "df47781a-7dd9-4200-85f6-49c7d105c1e7";

export const APPROVED_OFFICE_ARTICLES = Object.freeze([
  ["15dd75f4-db64-4f8e-9d6b-9f5d022b00be", "dieksodos-i-pagida-oi-nees-tropopoiiseis-ston-eksodikastiko-mixanismo-kai-o-kindynos-gia-toys-daneioliptes"],
  ["5nMwddj4PAYYyyF46ckgPw", "olap-6-2026-funds-iraklis-dimosio-symferon-nomothetiki-paremvasi"],
  ["5nMwddj4PAYYyyF46JZjJ2", "olap-6-2026-nomos-katseli-atomiki-energeia-daneiolithpti"],
  ["e7fe758b-2926-442c-ab49-1d854e2376fe", "o-pleistiriasmos-einai-i-kalyteri-doyleia-poy-ekanan-pote-ta-funds-mexri-na-ton-stamatiseis"],
  ["8be4ab3d-45cf-44aa-b670-08d6b41159fc", "giati-kaneis-den-prepei-na-paradidetai-os-leia-sta-funds"],
  ["d1fca9c5-06ac-4185-a2fd-6b00f82589bb", "agora-akiniton-vimata"],
  ["75b17d53-1a02-4661-89f1-0ae221fd0fac", "idrysi-etaireias-stin-ellada-ti-prepei-na-gnorizete-prin-ksekinisete"],
  ["b15b6f02-28e8-491f-8be5-5b47c718005f", "eksodikastikos-mixanismos-rythmisis-ofeilon-pos-leitoyrgei-kai-poion-afora"],
  ["8004ddad-2e71-404a-af83-32bbf55ccbf8", "pote-mporo-na-stamatiso-enan-pleistiriasmo"],
  ["116ff15f-dfa7-4580-84bc-e9c6a63a475d", "nomos-katseli-2024-poios-dikaioytai-prostasia-kai-pos-leitoyrgei"],
  ["f8fda791-5bec-471d-a11f-795729542dbc", "agorase-to-xreos-moy-fund-ti-allazei-gia-mena"],
  ["8ab3c0dd-1d6c-406c-9d89-e05fc1b64b3a", "katasxethike-o-logariasmos-moy-ti-kano-tora"],
  ["55616cf5-79f0-48a0-bdb2-576fbd338c76", "ti-einai-i-anakopi-kai-pote-prepei-na-tin-kano"],
].map(([documentId, slug]) => Object.freeze({
  sourceId: `office-article-${documentId}`, documentId, slug, authorId,
})));
