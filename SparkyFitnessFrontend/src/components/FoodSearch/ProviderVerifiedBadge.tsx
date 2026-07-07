import { cn } from '@/lib/utils';

interface ProviderVerifiedBadgeProps {
  className?: string;
  compact?: boolean;
  size?: 'sm' | 'md';
}

const SIZE_MAP = {
  sm: { badge: 18, stroke: 2.55 },
  md: { badge: 22, stroke: 2.75 },
} as const;

const sealPath =
  'M10.82 2.6 Q12 1.75 13.18 2.6 Q15.27 4.1 16.7 4.34 Q19.25 4.75 19.48 6.18 Q19.9 8.73 20.75 9.91 Q22.25 12 21.4 13.18 Q19.9 15.27 19.66 16.7 Q19.25 19.25 17.82 19.48 Q15.27 19.9 14.09 20.75 Q12 22.25 10.82 21.4 Q8.73 19.9 7.3 19.66 Q4.75 19.25 4.52 17.82 Q4.1 15.27 3.25 14.09 Q1.75 12 2.6 10.82 Q4.1 8.73 4.34 7.3 Q4.75 4.75 6.18 4.52 Q8.73 4.1 9.91 3.25 Z';

const checkPath = 'M7.15 12.25l2.95 3.05 6.75-6.95';

const ProviderVerifiedBadge = ({
  className = '',
  size = 'sm',
}: ProviderVerifiedBadgeProps) => {
  const dimensions = SIZE_MAP[size];

  return (
    <span
      role="img"
      aria-label="Verified food"
      className={cn(
        'inline-flex shrink-0 items-center justify-center',
        className
      )}
      data-testid="provider-verified-badge"
      style={{
        width: dimensions.badge,
        height: dimensions.badge,
        filter: 'drop-shadow(0 0.5px 1.5px rgb(135 146 227 / 0.24))',
      }}
    >
      <svg
        width={dimensions.badge}
        height={dimensions.badge}
        viewBox="0 0 24 24"
        aria-hidden="true"
        focusable="false"
      >
        <path d={sealPath} fill="var(--color-calories, #8792E3)" />
        <path
          d={checkPath}
          fill="none"
          stroke="#FFFFFF"
          strokeWidth={dimensions.stroke}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
};

export default ProviderVerifiedBadge;
