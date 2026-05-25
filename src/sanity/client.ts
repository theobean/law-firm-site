import { createClient } from "next-sanity";

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production";

export const client = projectId
  ? createClient({ projectId, dataset, apiVersion: "2024-01-01", useCdn: true })
  : null;

const authorProjection = `author->{name, role, bio, image}`;

export async function getArticles() {
  if (!client) return [];
  return client.fetch(
    `*[_type == "article"] | order(publishedAt desc) {
      _id, title, slug, publishedAt, excerpt, mainImage, category, tags,
      ${authorProjection}
    }`
  );
}

export async function getArticle(slug: string) {
  if (!client) return null;
  return client.fetch(
    `*[_type == "article" && slug.current == $slug][0] {
      _id, title, slug, publishedAt, excerpt, mainImage, body, category, tags,
      ${authorProjection}
    }`,
    { slug }
  );
}

export async function getRelatedArticles(currentSlug: string, category: string, limit = 3) {
  if (!client) return [];
  return client.fetch(
    `*[_type == "article" && slug.current != $currentSlug && category == $category] | order(publishedAt desc)[0...$limit] {
      _id, title, slug, publishedAt, excerpt, mainImage, category
    }`,
    { currentSlug, category, limit }
  );
}
