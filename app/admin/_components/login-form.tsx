export function LoginForm({
  email,
  password,
  error,
  bootstrapError,
  sessionCheck,
  submitting,
  onEmailChange,
  onPasswordChange,
  onSubmit,
}: {
  email: string;
  password: string;
  error: string | null;
  bootstrapError: string | null;
  sessionCheck: "pending" | "done";
  submitting: boolean;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onSubmit: () => Promise<void>;
}) {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-sm flex-col justify-center px-4 py-16">
      <h1 className="text-center text-2xl font-semibold tracking-tight">Admin</h1>
      <p className="mt-2 text-center text-sm text-neutral-600 dark:text-neutral-400">
        Sign in with the admin account.
      </p>
      {sessionCheck === "pending" ? (
        <p className="mt-2 text-center text-xs text-neutral-500 dark:text-neutral-500">
          Checking for an existing session…
        </p>
      ) : null}
      {bootstrapError ? (
        <p
          role="status"
          className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200"
        >
          {bootstrapError}
        </p>
      ) : null}
      <form
        method="post"
        onSubmit={(e) => {
          e.preventDefault();
          void onSubmit();
        }}
        className="mt-8 space-y-4"
      >
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
            onChange={(e) => onEmailChange(e.target.value)}
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
            onChange={(e) => onPasswordChange(e.target.value)}
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
