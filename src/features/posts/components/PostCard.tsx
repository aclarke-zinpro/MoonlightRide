import Link from "next/link";
import { formatShortDate } from "@/lib/dates";

export function PostCard(props: { title: string; slug: string; summary: string; publishedAt: Date | null }) {
  const { title, slug, summary, publishedAt } = props;
  return (
    <article className="space-y-2 rounded-lg border border-line bg-surface p-5">
      {publishedAt ? (
        <p className="text-sm text-muted">
          <time dateTime={publishedAt.toISOString()}>{formatShortDate(publishedAt)}</time>
        </p>
      ) : null}
      <h2 className="text-2xl font-bold">
        <Link href={`/updates/${slug}`} className="text-accent no-underline hover:underline">
          {title}
        </Link>
      </h2>
      {summary ? <p>{summary}</p> : null}
    </article>
  );
}
