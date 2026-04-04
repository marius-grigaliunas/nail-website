import { listDesignsForGallery } from "@/lib/appwrite-server";
import Image from "next/image";

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

        {designs.length === 0 ? (
          <p className="text-center text-sm text-zinc-500 dark:text-zinc-500">
            No designs to show yet. Add designs in the admin area, and allow public read on your
            designs table in Appwrite so the gallery can list rows without signing in.
          </p>
        ) : (
          <ul className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {designs.map((design) => {
              const urls =
                design.thumbnail_urls && design.thumbnail_urls.length > 0
                  ? design.thumbnail_urls
                  : design.image_urls;
              if (urls.length === 0) return null;
              return (
                <li
                  key={design.$id}
                  className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
                >
                  <div className="space-y-3 p-4">
                    <div>
                      <h2 className="font-medium text-zinc-900 dark:text-zinc-100">{design.name}</h2>
                      <p className="text-xs capitalize text-zinc-500 dark:text-zinc-400">
                        {design.shape.replace("-", " ")}
                        {design.price != null ? ` · ${design.price}` : ""}
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                      {urls.map((url, i) => (
                        <a
                          key={`${design.$id}-${i}`}
                          href={url}
                          target="_blank"
                          rel="noreferrer"
                          className="relative aspect-square overflow-hidden rounded-lg bg-zinc-100 dark:bg-zinc-900"
                        >
                          <Image
                            src={url}
                            alt={i === 0 ? `${design.name} nail design` : `${design.name} — image ${i + 1}`}
                            fill
                            className="object-cover"
                            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 200px"
                          />
                        </a>
                      ))}
                    </div>
                    {design.tags.length > 0 ? (
                      <ul className="flex flex-wrap gap-1.5">
                        {design.tags.map((tag) => (
                          <li
                            key={tag}
                            className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
                          >
                            {tag}
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </main>
    </div>
  );
}
