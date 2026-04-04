"use client";

import { account } from "@/lib/appwrite";
import { fetchWithAppwriteJwt } from "@/lib/fetch-with-appwrite-jwt";
import { AppwriteException } from "appwrite";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type AuthState = "loading" | "signed-in" | "signed-out";
type ServerGate = "idle" | "ok" | "error";

function useObjectUrls(files: File[]) {
  const urls = useMemo(() => files.map((f) => URL.createObjectURL(f)), [files]);
  useEffect(() => {
    return () => {
      for (const u of urls) URL.revokeObjectURL(u);
    };
  }, [urls]);
  return urls;
}

export function AdminClient() {
  const [auth, setAuth] = useState<AuthState>("loading");
  const [serverGate, setServerGate] = useState<ServerGate>("idle");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [adminPanel, setAdminPanel] = useState<"home" | "upload">("home");
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);
  const [designName, setDesignName] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagDraft, setTagDraft] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewUrls = useObjectUrls(uploadFiles);

  const refreshSession = useCallback(async () => {
    setError(null);
    try {
      await account.get();
      setAuth("signed-in");
    } catch {
      setAuth("signed-out");
    }
  }, []);

  useEffect(() => {
    void refreshSession();
  }, [refreshSession]);

  useEffect(() => {
    if (auth !== "signed-in") {
      setServerGate("idle");
      return;
    }
    setServerGate("idle");
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetchWithAppwriteJwt("/api/admin/me");
        if (!cancelled) {
          setServerGate(res.ok ? "ok" : "error");
        }
      } catch {
        if (!cancelled) setServerGate("error");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [auth]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await account.createEmailPasswordSession({ email, password });
      await refreshSession();
    } catch (err) {
      const message =
        err instanceof AppwriteException
          ? err.message
          : "Could not sign in. Check your email and password.";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleLogout() {
    setSubmitting(true);
    setError(null);
    try {
      await account.deleteSession({ sessionId: "current" });
    } catch {
      // Session may already be invalid; still treat as signed out locally.
    } finally {
      setSubmitting(false);
      setAuth("signed-out");
      setAdminPanel("home");
      setUploadFiles([]);
      setDesignName("");
      setTags([]);
      setTagDraft("");
    }
  }

  function addFilesFromList(list: FileList | File[]) {
    const incoming = Array.from(list).filter((f) => f.type.startsWith("image/"));
    if (incoming.length === 0) return;
    setUploadFiles((prev) => {
      const next = [...prev, ...incoming];
      const seen = new Set<string>();
      return next.filter((f) => {
        const key = `${f.name}-${f.size}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    });
  }

  function removeFileAt(index: number) {
    setUploadFiles((prev) => prev.filter((_, i) => i !== index));
  }

  function commitTagFromDraft() {
    const raw = tagDraft.trim().replace(/^#/, "");
    if (!raw) return;
    const parts = raw
      .split(/[,;]+/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (parts.length === 0) return;
    setTags((prev) => {
      const seen = new Set(prev.map((t) => t.toLowerCase()));
      const out = [...prev];
      for (const p of parts) {
        const k = p.toLowerCase();
        if (!seen.has(k)) {
          seen.add(k);
          out.push(p);
        }
      }
      return out;
    });
    setTagDraft("");
  }

  function removeTag(tag: string) {
    setTags((prev) => prev.filter((t) => t !== tag));
  }

  function handleTagKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      commitTagFromDraft();
    }
    if (e.key === "Backspace" && tagDraft === "" && tags.length > 0) {
      setTags((prev) => prev.slice(0, -1));
    }
  }

  function handleUploadFormSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (uploadFiles.length === 0) return;
    // Wire to storage/API when backend is ready.
  }

  if (auth === "loading") {
    return (
      <div className="flex min-h-[50vh] items-center justify-center px-4">
        <p className="text-sm text-neutral-500 dark:text-neutral-400">Loading…</p>
      </div>
    );
  }

  if (auth === "signed-in") {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] flex-1">
        <aside
          className="flex w-56 shrink-0 flex-col border-r border-neutral-200 bg-neutral-50/80 dark:border-neutral-800 dark:bg-neutral-950/50"
          aria-label="Admin tools"
        >
          <div className="border-b border-neutral-200 px-4 py-4 dark:border-neutral-800">
            <p className="text-xs font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
              Tools
            </p>
          </div>
          <nav className="flex flex-1 flex-col gap-1 p-3">
            <button
              type="button"
              onClick={() => setAdminPanel("upload")}
              className={`rounded-lg px-3 py-2.5 text-left text-sm font-medium transition ${
                adminPanel === "upload"
                  ? "bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900"
                  : "text-neutral-700 hover:bg-neutral-200/80 dark:text-neutral-300 dark:hover:bg-neutral-800"
              }`}
            >
              Upload
            </button>
            <button
              type="button"
              onClick={() => void handleLogout()}
              disabled={submitting}
              className="mt-auto rounded-lg border border-neutral-300 bg-transparent px-3 py-2.5 text-left text-sm font-medium text-neutral-800 transition hover:bg-neutral-200/80 disabled:opacity-50 dark:border-neutral-600 dark:text-neutral-200 dark:hover:bg-neutral-800"
            >
              {submitting ? "Signing out…" : "Log out"}
            </button>
          </nav>
        </aside>

        <main className="min-w-0 flex-1 px-4 py-8 sm:px-8">
          <div className="mx-auto max-w-2xl">
            <h1 className="text-2xl font-semibold tracking-tight">Admin</h1>
            {serverGate === "ok" ? (
              <p className="mt-2 text-sm text-green-700 dark:text-green-400">
                Server verified your session (JWT to /api/admin/me).
              </p>
            ) : serverGate === "error" ? (
              <p className="mt-2 text-sm text-amber-700 dark:text-amber-400" role="status">
                Could not verify server JWT. Check the network tab and Appwrite project settings.
              </p>
            ) : (
              <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">Checking server…</p>
            )}

            {adminPanel === "home" ? (
              <p className="mt-8 text-sm text-neutral-600 dark:text-neutral-400">
                Choose <span className="font-medium text-neutral-800 dark:text-neutral-200">Upload</span> in the
                sidebar to add nail designs.
              </p>
            ) : (
              <form onSubmit={(e) => void handleUploadFormSubmit(e)} className="mt-8 space-y-8">
                <div>
                  <label className="block text-sm font-medium">Images</label>
                  <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                    Drag files here or click to browse.
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                      accept="image/*"
                    multiple
                    className="sr-only"
                    aria-label="Choose images"
                    onChange={(e) => {
                      const list = e.target.files;
                      if (list?.length) addFilesFromList(list);
                      e.target.value = "";
                    }}
                  />
                  <div
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        fileInputRef.current?.click();
                      }
                    }}
                    onClick={() => fileInputRef.current?.click()}
                    onDragEnter={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setDragActive(true);
                    }}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    onDragLeave={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragActive(false);
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setDragActive(false);
                      if (e.dataTransfer.files?.length) addFilesFromList(e.dataTransfer.files);
                    }}
                    className={`mt-3 flex min-h-[140px] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-8 text-center text-sm transition ${
                      dragActive
                        ? "border-neutral-500 bg-neutral-100 dark:border-neutral-400 dark:bg-neutral-900"
                        : "border-neutral-300 bg-neutral-50/50 hover:border-neutral-400 dark:border-neutral-600 dark:bg-neutral-900/30 dark:hover:border-neutral-500"
                    }`}
                  >
                    Drop images here or click to select
                  </div>
                </div>

                {uploadFiles.length > 0 ? (
                  <div>
                    <p className="text-sm font-medium">Preview</p>
                    <ul className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
                      {uploadFiles.map((file, index) => (
                        <li
                          key={`${file.name}-${file.size}-${index}`}
                          className="group relative overflow-hidden rounded-lg border border-neutral-200 bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-900"
                        >
                          {/* Blob previews: next/image is awkward with object URLs */}
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={previewUrls[index]}
                            alt=""
                            className="aspect-square w-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => removeFileAt(index)}
                            className="absolute right-1 top-1 rounded bg-black/60 px-2 py-0.5 text-xs text-white opacity-0 transition group-hover:opacity-100 focus:opacity-100"
                          >
                            Remove
                          </button>
                          <p className="truncate px-2 py-1 text-xs text-neutral-600 dark:text-neutral-400">
                            {file.name}
                          </p>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                <div>
                  <label htmlFor="design-name" className="block text-sm font-medium">
                    Design name
                  </label>
                  <input
                    id="design-name"
                    name="designName"
                    type="text"
                    value={designName}
                    onChange={(e) => setDesignName(e.target.value)}
                    placeholder="e.g. Snowy Mountains"
                    className="mt-2 w-full rounded-lg border border-neutral-300 bg-transparent px-3 py-2 text-sm outline-none ring-offset-background focus:ring-2 focus:ring-neutral-400 dark:border-neutral-600"
                  />
                </div>

                <div>
                  <label htmlFor="design-tags" className="block text-sm font-medium">
                    Tags
                  </label>
                  <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                    Type a tag and press Enter or comma. Use semicolons for several at once.
                  </p>
                  <div className="mt-2 flex min-h-[42px] flex-wrap gap-2 rounded-lg border border-neutral-300 bg-transparent px-2 py-1.5 dark:border-neutral-600">
                    {tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 rounded-md bg-neutral-200 px-2 py-0.5 text-xs font-medium text-neutral-800 dark:bg-neutral-700 dark:text-neutral-100"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => removeTag(tag)}
                          className="rounded p-0.5 hover:bg-neutral-300 dark:hover:bg-neutral-600"
                          aria-label={`Remove tag ${tag}`}
                        >
                          ×
                        </button>
                      </span>
                    ))}
                    <input
                      id="design-tags"
                      type="text"
                      value={tagDraft}
                      onChange={(e) => setTagDraft(e.target.value)}
                      onKeyDown={handleTagKeyDown}
                      onBlur={() => commitTagFromDraft()}
                      placeholder={"Add tag…"}
                      className="min-w-[120px] flex-1 bg-transparent py-1 text-sm outline-none"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="submit"
                    disabled={uploadFiles.length === 0}
                    className="rounded-lg bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-white"
                  >
                    Save design
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setUploadFiles([]);
                      setDesignName("");
                      setTags([]);
                      setTagDraft("");
                    }}
                    className="text-sm text-neutral-600 underline-offset-2 hover:underline dark:text-neutral-400"
                  >
                    Clear form
                  </button>
                </div>
              </form>
            )}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-sm flex-col justify-center px-4 py-16">
      <h1 className="text-center text-2xl font-semibold tracking-tight">Admin</h1>
      <p className="mt-2 text-center text-sm text-neutral-600 dark:text-neutral-400">
        Sign in with the admin account.
      </p>
      <form onSubmit={(e) => void handleLogin(e)} className="mt-8 space-y-4">
        <div>
          <label htmlFor="admin-email" className="block text-sm font-medium">
            Email
          </label>
          <input
            id="admin-email"
            name="email"
            type="email"
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="mt-1 w-full rounded-lg border border-neutral-300 bg-transparent px-3 py-2 text-sm outline-none ring-offset-background focus:ring-2 focus:ring-neutral-400 dark:border-neutral-600"
          />
        </div>
        <div>
          <label htmlFor="admin-password" className="block text-sm font-medium">
            Password
          </label>
          <input
            id="admin-password"
            name="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="mt-1 w-full rounded-lg border border-neutral-300 bg-transparent px-3 py-2 text-sm outline-none ring-offset-background focus:ring-2 focus:ring-neutral-400 dark:border-neutral-600"
          />
        </div>
        {error ? (
          <p role="alert" className="text-sm text-red-600 dark:text-red-400">
            {error}
          </p>
        ) : null}
        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-lg bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-neutral-800 disabled:opacity-50 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-white"
        >
          {submitting ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </div>
  );
}
