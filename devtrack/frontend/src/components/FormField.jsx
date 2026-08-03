export function FormField({ label, error, children }) {
  return (
    <div className="space-y-1 mb-4">
      <label className="text-sm font-medium text-gray-700">{label}</label>
      {children}
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
