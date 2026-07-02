// src/components/UI/LoadingSpinner.jsx
/**
 * LoadingSpinner — centered animated spinner in SAP Fiori blue.
 * Props:
 *   size   — 'sm' | 'md' | 'lg' (default 'md')
 *   label  — optional accessible text below spinner
 *   fullPage — whether to center in the full viewport
 */

const SIZE_CLASSES = {
  sm: 'w-6 h-6 border-2',
  md: 'w-10 h-10 border-[3px]',
  lg: 'w-16 h-16 border-4',
};

export default function LoadingSpinner({
  size = 'md',
  label = 'Carregando...',
  fullPage = false,
}) {
  const spinnerClass = `
    ${SIZE_CLASSES[size] ?? SIZE_CLASSES.md}
    border-fiori-blue border-t-transparent rounded-full animate-spin
  `;

  const wrapper = fullPage
    ? 'fixed inset-0 flex flex-col items-center justify-center bg-fiori-gray-light/80 z-50'
    : 'flex flex-col items-center justify-center gap-3 py-8';

  return (
    <div className={wrapper} role="status" aria-label={label}>
      <div className={spinnerClass} />
      {label && (
        <p className="text-sm text-fiori-gray-mid font-medium mt-2">{label}</p>
      )}
    </div>
  );
}
