import { Banner } from "@/components/Banner";
import { SiteNav } from "@/components/SiteNav";
import { SubscribeForm } from "@/features/subscriptions/components/SubscribeForm";
import { signFormTimestamp } from "@/server/security/spam";
import { getCurrentEdition } from "@/server/services/ride";

export default async function PublicLayout({ children }: LayoutProps<"/">) {
  const edition = await getCurrentEdition();
  return (
    <>
      <a
        href="#main"
        className="sr-only-focusable absolute top-2 left-2 z-50 rounded bg-accent px-4 py-2 text-night"
      >
        Skip to main content
      </a>
      <header>
        <Banner title={edition?.title ?? "Moonlight Ride"} />
        <SiteNav />
      </header>
      <main id="main" tabIndex={-1} className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:py-12">
        {children}
      </main>
      <footer className="border-t border-line bg-surface">
        <div className="mx-auto max-w-3xl space-y-8 px-4 py-8">
          <SubscribeForm formTs={signFormTimestamp()} />
          <p className="text-sm text-muted">
            The Moonlight Ride is a casual, free group ride held each fall near the full moon. Ride
            at your own pace and bring lights.
          </p>
        </div>
      </footer>
    </>
  );
}
