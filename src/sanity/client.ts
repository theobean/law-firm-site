import { createClient } from "next-sanity";

const projectId = (process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "hwu5yvsr").trim();
const dataset = (process.env.NEXT_PUBLIC_SANITY_DATASET || "production").trim();

export const client = createClient({ projectId, dataset, apiVersion: "2024-01-01", useCdn: true });

const authorProjection = `author->{name, role, bio, image}`;

export async function getArticles() {
  return client.fetch(
    `*[_type == "article"] | order(publishedAt desc) {
      _id, title, slug, publishedAt, excerpt, mainImage, category, tags, body,
      ${authorProjection}
    }`
  );
}

export async function getArticle(slug: string) {
  return client.fetch(
    `*[_type == "article" && slug.current == $slug][0] {
      _id, title, slug, publishedAt, excerpt, mainImage, body, category, tags,
      ${authorProjection}
    }`,
    { slug }
  );
}

export async function getInterviews() {
  return client.fetch(
    `*[_type == "interview"] | order(date desc) {
      _id, title, youtubeUrl, show, date, description
    }`
  );
}

export async function getDecisions() {
  return client.fetch(
    `*[_type == "decision"] | order(date desc) {
      _id, title, date, court, category, description,
      "fileUrl": file.asset->url
    }`
  );
}

export async function getRelatedArticles(currentSlug: string, category: string, limit = 3) {
  return client.fetch(
    `*[_type == "article" && slug.current != $currentSlug && category == $category] | order(publishedAt desc)[0...$limit] {
      _id, title, slug, publishedAt, excerpt, mainImage, category
    }`,
    { currentSlug, category, limit }
  );
}
