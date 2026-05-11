export function UploadSubmitStatus({
  submitError,
  submitSuccess,
}: {
  submitError: string | null;
  submitSuccess: boolean;
}) {
  return (
    <>
      {submitError ? (
        <p
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300"
        >
          {submitError}
        </p>
      ) : null}
      {submitSuccess ? (
        <p
          role="status"
          className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800 dark:border-green-900 dark:bg-green-950/40 dark:text-green-300"
        >
          Design saved to the database.
        </p>
      ) : null}
    </>
  );
}
