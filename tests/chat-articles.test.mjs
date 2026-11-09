import assert from "node:assert/strict";
import { test } from "node:test";
import { APPROVED_OFFICE_ARTICLES } from "../src/lib/chat/article-catalog.mjs";
import { getPublicArticleSources } from "../src/lib/chat/articles.mjs";
import { ChatAccessError, getPublicChatPrincipal } from "../src/lib/chat/access.mjs";

const principal = getPublicChatPrincipal();
const now = () => Date.parse("2026-11-09T00:00:00Z");
const fixture = (index = 0, extra = {}) => ({
  _id: APPROVED_OFFICE_ARTICLES[index].documentId,
  slug: APPROVED_OFFICE_ARTICLES[index].slug,
  authorId: APPROVED_OFFICE_ARTICLES[index].authorId,
  title: "Νόμος Κατσέλη και υπερχρεωμένα νοικοκυριά",
  publishedAt: "2026-06-01T12:00:00Z",
  excerpt: "Γενική ενημέρωση για τον νόμο Κατσέλη.",
  content: "Το δημοσιευμένο άρθρο εξηγεί τον νόμο Κατσέλη (Ν. 3869/2010).",
  ...extra,
});
const read = (records, question = "Τι είναι ο νόμος Κατσέλη;") =>
  getPublicArticleSources(principal, question, { now, fetcher: async () => Response.json({ result: records }) });

test("the reviewed article registry has immutable exact identity bindings", () => {
  assert.equal(APPROVED_OFFICE_ARTICLES.length, 13);
  assert.equal(new Set(APPROVED_OFFICE_ARTICLES.map(({ documentId }) => documentId)).size, 13);
  assert.ok(Object.isFrozen(APPROVED_OFFICE_ARTICLES));
  for (const binding of APPROVED_OFFICE_ARTICLES) {
    assert.ok(Object.isFrozen(binding));
    assert.equal(binding.sourceId, `office-article-${binding.documentId}`);
    assert.match(binding.slug, /^[a-z0-9]+(?:-[a-z0-9]+)*$/);
    assert.equal(binding.authorId, "df47781a-7dd9-4200-85f6-49c7d105c1e7");
  }
  assert.throws(() => { APPROVED_OFFICE_ARTICLES[0].slug = "unapproved"; }, TypeError);
});

test("authorizes the public principal before any article network reader", async () => {
  let calls = 0;
  const options = { now, fetcher: async () => { calls += 1; return Response.json({ result: [fixture()] }); } };
  for (const forged of [undefined, null, {}, { role: "admin" }, { ...principal }]) {
    await assert.rejects(getPublicArticleSources(forged, "Νόμος Κατσέλη", options), ChatAccessError);
    await assert.rejects(getPublicArticleSources(forged, "", options), ChatAccessError);
  }
  assert.equal(calls, 0);
});

test("queries only fixed public published article bindings without credentials or private fields", async () => {
  let request;
  const result = await getPublicArticleSources(principal, "Νόμος Κατσέλη CLIENT_QUESTION_SENTINEL", {
    now, fetcher: async (url, options) => {
      request = { url: new URL(url), options };
      return Response.json({ result: [fixture(0, { internalNotes: "PRIVATE_SENTINEL" })] });
    },
  });
  assert.equal(request.url.origin, "https://hwu5yvsr.api.sanity.io");
  assert.equal(request.url.pathname, "/v2024-01-01/data/query/production");
  assert.equal(request.url.username, "");
  assert.equal(request.url.password, "");
  assert.equal(request.url.searchParams.get("perspective"), "published");
  assert.deepEqual(JSON.parse(request.url.searchParams.get("$approved")), APPROVED_OFFICE_ARTICLES.map(({ documentId, slug, authorId }) => ({ documentId, slug, authorId })));
  assert.equal(JSON.parse(request.url.searchParams.get("$now")), "2026-11-09T00:00:00.000Z");
  const query = request.url.searchParams.get("query");
  for (const required of ['_type == "article"', '!(_id in path("drafts.**"))', '!(_id in path("versions.**"))',
    "dateTime(publishedAt) <= dateTime($now)", "_id in $approved[].documentId", "documentId == ^._id", "slug == ^.slug.current", "authorId == ^.author._ref", '"content": pt::text(body)']) {
    assert.ok(query.includes(required), required);
  }
  assert.ok(!/image|internalNotes|bio|seo|CLIENT_QUESTION_SENTINEL/.test(query));
  assert.equal(request.options.method, "GET");
  assert.equal(request.options.cache, "no-store");
  assert.equal(request.options.redirect, "error");
  assert.equal(request.options.credentials, "omit");
  assert.deepEqual(request.options.headers, { Accept: "application/json" });
  assert.ok(request.options.signal instanceof AbortSignal);
  assert.deepEqual(Object.keys(result[0]), ["id", "title", "url", "content"]);
  assert.equal(result[0].id, APPROVED_OFFICE_ARTICLES[0].sourceId);
  assert.equal(result[0].url, `https://ioannispapaioannou.lawyer/el/blog/${APPROVED_OFFICE_ARTICLES[0].slug}`);
  assert.ok(result[0].content.startsWith("ΑΡΘΡΟ ΤΟΥ ΓΡΑΦΕΙΟΥ — "));
  assert.match(result[0].content, /Ιωάννη Παπαϊωάννου.*2026-06-01/u);
  assert.match(result[0].content, /άποψης.*όχι επίσημο κείμενο νόμου/u);
  assert.ok(!JSON.stringify(result).includes("PRIVATE_SENTINEL"));
});

test("rejects unknown, swapped, draft, future and malformed records as a whole", async () => {
  const invalid = [
    { _id: "unapproved" }, { _id: `drafts.${fixture()._id}` }, { _id: `versions.release.${fixture()._id}` },
    { slug: APPROVED_OFFICE_ARTICLES[1].slug }, { authorId: "unapproved-author" },
    { publishedAt: "2027-01-01T00:00:00Z" }, { publishedAt: "2026-02-30T00:00:00Z" },
    // This appears lexically earlier than now but denotes a future instant.
    { publishedAt: "2026-11-08T23:30:00-02:00" },
    { publishedAt: null }, { publishedAt: "invalid" }, { content: {} },
    { content: "\ud800" }, { content: " " }, { content: "α".repeat(100_001) },
    { title: "x".repeat(201) }, { excerpt: "x".repeat(2001) },
  ];
  for (const mutation of invalid) {
    assert.deepEqual(await read([fixture(1), fixture(0, mutation)]), [], JSON.stringify(Object.keys(mutation)));
  }
  assert.deepEqual(await read([fixture(), fixture()]), [], "duplicate identities fail closed");
  assert.deepEqual(await read([null]), []);
});

test("finds a relevant late paragraph in an older article across the entire approved corpus", async () => {
  const records = APPROVED_OFFICE_ARTICLES.map((_, index) => fixture(index, {
    title: "Δημοσιευμένος σχολιασμός", excerpt: "", content: "Άσχετη εισαγωγή χωρίς το συγκεκριμένο θέμα.",
    publishedAt: index === 12 ? "2025-01-01T00:00:00Z" : "2026-06-01T00:00:00Z",
  }));
  records[12].content = "Γενική εισαγωγή χωρίς το συγκεκριμένο θέμα. ".repeat(300) +
    "\n\nLATE_PARAGRAPH Ο νόμος Κατσέλη (3869/2010) εξετάζεται στο τελευταίο μέρος του άρθρου.";
  const result = await read(records, "ΚΑΤΣΕΛΗ 3869");
  assert.equal(result.length, 1);
  assert.equal(result[0].id, APPROVED_OFFICE_ARTICLES[12].sourceId);
  assert.match(result[0].content, /LATE_PARAGRAPH/);
});

test("retrieval tolerates Greek accents and inflection and English or German topic words", async () => {
  const records = [fixture(0, { title: "Πλειστηριασμός ακινήτου", excerpt: "", content: "Το άρθρο εξηγεί γενικά τους πλειστηριασμούς και την επικοινωνία με δικηγόρο." })];
  for (const question of ["ΠΛΕΙΣΤΗΡΙΑΣΜΟΣ", "πλειστηριασμούς", "How does an auction work?", "Was ist eine Zwangsversteigerung?"]) {
    const result = await read(records, question);
    assert.equal(result.length, 1, question);
    assert.match(result[0].content, /πλειστηριασμούς/u);
  }
  assert.deepEqual(await read(records, "weather tomorrow"), []);
});

test("limits selected sources and complete Unicode excerpts to the provider budget", async () => {
  const records = [0, 1, 2].map((index) => fixture(index, {
    content: "Κατσέλη🙂 και κείμενο. ".repeat(3000),
  }));
  const result = await read(records);
  assert.equal(result.length, 2);
  assert.ok(result.reduce((sum, source) => sum + Array.from(source.content).length, 0) <= 3000);
  assert.ok(result.reduce((sum, source) => sum + new TextEncoder().encode(source.content).byteLength, 0) <= 6000);
  for (const source of result) {
    assert.ok(!/[\uD800-\uDFFF]/u.test(source.content));
    assert.ok(source.title.length <= 200);
  }
});

test("uses current reader content on each request rather than a stale in-memory article snapshot", async () => {
  let calls = 0;
  const options = { now, fetcher: async () => {
    calls += 1;
    return Response.json({ result: [fixture(0, { content: `Κατσέλη UPDATE_${calls}` })] });
  } };
  const first = await getPublicArticleSources(principal, "Κατσέλη", options);
  const second = await getPublicArticleSources(principal, "Κατσέλη", options);
  assert.match(first[0].content, /UPDATE_1/);
  assert.match(second[0].content, /UPDATE_2/);
  assert.equal(calls, 2);
});

test("fails closed on HTTP, schema, JSON and bounded streamed response failures without retries", async () => {
  const responses = [
    () => new Response("unavailable", { status: 503 }),
    () => new Response(null, { status: 302, headers: { location: "https://private.example/" } }),
    () => new Response("<html>no</html>", { headers: { "content-type": "text/html" } }),
    () => new Response("not json", { headers: { "content-type": "application/json" } }),
    () => Response.json({ result: {} }),
    () => Response.json({ result: [fixture()] }, { headers: { "content-length": String(512 * 1024 + 1) } }),
    () => new Response('"' + "x".repeat(512 * 1024) + '"', { headers: { "content-type": "application/json" } }),
    () => { throw new Error("network"); },
  ];
  for (const response of responses) {
    let calls = 0;
    assert.deepEqual(await getPublicArticleSources(principal, "Κατσέλη", { now, fetcher: async () => { calls += 1; return response(); } }), []);
    assert.equal(calls, 1);
  }
});

test("a stalled reader aborts within the three-second request limit", { timeout: 4500 }, async () => {
  let signal;
  let calls = 0;
  const started = performance.now();
  const result = await getPublicArticleSources(principal, "Κατσέλη", {
    now, fetcher: async (_url, options) => {
      calls += 1;
      signal = options.signal;
      return new Promise(() => {});
    },
  });
  assert.deepEqual(result, []);
  assert.equal(calls, 1);
  assert.equal(signal.aborted, true);
  assert.ok(performance.now() - started < 4000);
});
