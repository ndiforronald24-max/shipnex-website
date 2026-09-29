import { AlertCircle } from 'lucide-react';

interface ErrorMessageProps {
  title?: string;
  message: string;
  onRetry?: () => void;
}

export default function ErrorMessage({ title = 'Error', message, onRetry }: ErrorMessageProps) {
  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
      <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
      <div className="flex-1">
        <h4 className="font-medium text-red-800">{title}</h4>
        <p className="text-sm text-red-600 mt-1">{message}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="mt-3 text-sm font-medium text-red-700 hover:text-red-800 underline"
          >
            Try again
          </button>
        )}
      </div>
    </div>
  );
}

export function NotFound({ message = 'Page not found' }: { message?: string }) {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 px-4 text-center">
      <div className="text-6xl font-bold text-gray-200">404</div>
      <p className="text-gray-500">{message}</p>
    </div>
  );
}
