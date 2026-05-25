import imageUrlBuilder from "@sanity/image-url";
import { createClient } from "next-sanity";

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ?? "placeholder";
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production";

const builder = imageUrlBuilder(
  createClient({ projectId, dataset, apiVersion: "2024-01-01", useCdn: true })
);

export function urlFor(source: any) {
  return builder.image(source);
}
