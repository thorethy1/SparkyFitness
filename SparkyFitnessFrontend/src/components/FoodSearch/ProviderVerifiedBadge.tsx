import { Badge } from '@/components/ui/badge';
import { CheckCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface ProviderVerifiedBadgeProps {
  className?: string;
  compact?: boolean;
}

const ProviderVerifiedBadge = ({
  className = '',
  compact = false,
}: ProviderVerifiedBadgeProps) => {
  const { t } = useTranslation();

  return (
    <Badge
      variant="outline"
      className={`inline-flex items-center gap-1 border-emerald-500/30 bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 ${className}`}
      data-testid="provider-verified-badge"
    >
      <CheckCircle className="h-3 w-3" aria-hidden="true" />
      {!compact ? t('enhancedFoodSearch.verified', 'Verified') : null}
    </Badge>
  );
};

export default ProviderVerifiedBadge;
