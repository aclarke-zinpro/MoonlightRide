import type { Metadata } from "next";
import { Banner } from "@/components/Banner";
import { SignInForm } from "@/features/auth/SignInForm";

export const metadata: Metadata = { title: "Organizer sign-in", robots: { index: false } };

export default async function LoginPage({ searchParams }: PageProps<"/admin/login">) {
  const { next } = await searchParams;
  return (
    <>
      <Banner title="Moonlight Ride" />
      <main id="main" className="mx-auto w-full max-w-md flex-1 space-y-6 px-4 py-12">
        <h1 className="text-3xl font-bold">Organizer sign-in</h1>
        <SignInForm next={typeof next === "string" ? next : undefined} />
      </main>
    </>
  );
}
