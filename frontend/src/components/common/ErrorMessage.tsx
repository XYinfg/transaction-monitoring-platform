interface ErrorMessageProps {
  title?: string;
  message: string;
  retry?: () => void;
}

export default function ErrorMessage({
  title = 'Error',
  message,
  retry
}: ErrorMessageProps) {
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 p-6">
      <div className="flex items-start">
        <div className="flex-shrink-0 text-2xl">❌</div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-red-800">{title}</h3>
          <div className="mt-2 text-sm text-red-700">{message}</div>
          {retry && (
            <div className="mt-4">
              <button onClick={retry} className="btn-sm btn-secondary">
                Try again
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
