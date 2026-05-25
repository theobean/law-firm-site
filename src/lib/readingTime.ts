type PortableTextBlock = {
  _type: string;
  children?: Array<{ text?: string }>;
};

export function readingTime(blocks: PortableTextBlock[] | undefined, wordsPerMinute = 200): number {
  if (!blocks || blocks.length === 0) return 1;
  const text = blocks
    .filter((b) => b._type === "block")
    .flatMap((b) => b.children ?? [])
    .map((c) => c.text ?? "")
    .join(" ");
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / wordsPerMinute));
}
