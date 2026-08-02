export function Button({ variant = 'primary', className = '', ...props }) {
  const variants = {
    primary: 'bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700',
    secondary: 'bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-50',
    danger: 'text-red-600 hover:bg-red-50 px-3 py-1.5 rounded',
  };
  return <button className={`${variants[variant]} ${className}`} {...props} />;
}
