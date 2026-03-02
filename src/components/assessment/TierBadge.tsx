'use client';

interface TierBadgeProps {
  tier: number | null | undefined;
}

export function TierBadge({ tier }: TierBadgeProps) {
  if (!tier) return null;

  const config: Record<number, { label: string; bg: string; text: string; title: string }> = {
    1: { label: 'T1', bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-300', title: 'Tier 1: AI Fully Automates' },
    2: { label: 'T2', bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-300', title: 'Tier 2: AI Drafts, Human Validates' },
    3: { label: 'T3', bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-700 dark:text-orange-300', title: 'Tier 3: Human Must Answer' },
  };

  const c = config[tier] || config[3];

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${c.bg} ${c.text}`}
      title={c.title}
    >
      {c.label}
    </span>
  );
}
