type SettingsAlertProps = {
  error?: string;
  message?: string;
};

export function SettingsAlert({ error, message }: SettingsAlertProps) {
  if (!error && !message) return null;

  if (error) {
    return (
      <div
        role="alert"
        className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300"
      >
        {error}
      </div>
    );
  }

  return (
    <div
      role="status"
      className="mb-6 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-300"
    >
      {message}
    </div>
  );
}
