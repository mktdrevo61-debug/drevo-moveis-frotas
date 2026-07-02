// src/components/UI/KPICard.jsx
/**
 * KPICard — reusable metric card for manager dashboards.
 *
 * Props:
 *   title    {string}  — Metric label
 *   value    {string}  — Large formatted value
 *   subtitle {string}  — Secondary context (e.g., "↑ 5% vs mês anterior")
 *   color    {string}  — Tailwind text color class for the value (e.g., 'text-fiori-blue')
 *   icon     {ReactNode} — Icon element rendered in the colored badge
 *   loading  {boolean} — Shows skeleton when true
 */

export default function KPICard({
  title,
  value,
  subtitle,
  color = 'text-fiori-gray',
  icon,
  loading = false,
}) {
  if (loading) {
    return (
      <div className="card flex flex-col gap-3 animate-pulse">
        <div className="flex items-center justify-between">
          <div className="h-4 bg-fiori-border rounded w-24" />
          <div className="w-10 h-10 bg-fiori-border rounded-xl" />
        </div>
        <div className="h-8 bg-fiori-border rounded w-32" />
        <div className="h-3 bg-fiori-border rounded w-20" />
      </div>
    );
  }

  return (
    <div className="card flex flex-col gap-2 hover:shadow-fiori-md transition-shadow duration-200">
      {/* Header row */}
      <div className="flex items-start justify-between">
        <p className="text-sm font-medium text-fiori-gray-mid leading-tight">{title}</p>
        {icon && (
          <span
            className={`
              flex items-center justify-center w-10 h-10 rounded-xl text-white text-lg
              ${color
                .replace('text-', 'bg-')
                .replace('fiori-blue', 'fiori-blue')
                || 'bg-fiori-blue'
              }
            `}
            style={{
              // Use inline style as fallback for dynamic color classes
              backgroundColor: colorToBg(color),
            }}
          >
            {icon}
          </span>
        )}
      </div>

      {/* Value */}
      <p className={`text-2xl font-bold leading-none ${color}`}>{value}</p>

      {/* Subtitle */}
      {subtitle && (
        <p className="text-xs text-fiori-gray-mid leading-tight">{subtitle}</p>
      )}
    </div>
  );
}

/**
 * Maps a Tailwind text color class to a hex color for inline bg.
 * Only covers Fiori design tokens.
 * @param {string} colorClass
 * @returns {string} hex color
 */
function colorToBg(colorClass) {
  const map = {
    'text-fiori-blue':   '#0070F2',
    'text-fiori-green':  '#30914C',
    'text-fiori-red':    '#BB0000',
    'text-fiori-orange': '#E76500',
    'text-fiori-yellow': '#C87B00',
    'text-fiori-gray':   '#32363A',
    'text-green-600':    '#16a34a',
    'text-blue-600':     '#2563eb',
    'text-red-600':      '#dc2626',
    'text-orange-500':   '#f97316',
  };
  return map[colorClass] ?? '#0070F2';
}
