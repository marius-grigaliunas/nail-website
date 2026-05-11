import { listDesignsForGallery } from "@/lib/appwrite-server";
import { DesignGallery } from "./_components/design-gallery";

/** Always load designs from Appwrite at request time (not only at build). */
export const dynamic = "force-dynamic";

export default async function Home() {
  const designs = await listDesignsForGallery();

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 font-sans dark:bg-black">
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 py-10 sm:px-6 lg:px-8">
        <header className="mb-10 text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-3xl">
            Nail designs
          </h1>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            Gallery from your catalog
          </p>
        </header>

        <DesignGallery designs={designs} />
      </main>
    </div>
  );
}
