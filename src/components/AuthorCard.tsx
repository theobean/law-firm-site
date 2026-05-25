import Image from "next/image";
import { urlFor } from "@/sanity/image";
import { useTranslations } from "next-intl";

interface Author {
  name: string;
  role?: string;
  bio?: string;
  image?: { _type: string; asset: { _ref: string } } | null;
}

export default function AuthorCard({ author }: { author: Author }) {
  const t = useTranslations("blog");

  return (
    <div className="bg-gray-50 border border-gray-100 rounded-sm p-6 flex items-start gap-5">
      {author.image && (
        <div className="relative w-16 h-16 rounded-full overflow-hidden flex-shrink-0 bg-gray-200">
          <Image
            src={urlFor(author.image).width(128).height(128).url()}
            alt={author.name}
            fill
            className="object-cover"
          />
        </div>
      )}
      <div>
        <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">{t("byAuthor")}</p>
        <p className="font-bold text-primary text-lg">{author.name}</p>
        {author.role && <p className="text-accent text-sm font-semibold">{author.role}</p>}
        {author.bio && <p className="text-gray-600 text-sm mt-3 leading-relaxed">{author.bio}</p>}
      </div>
    </div>
  );
}
