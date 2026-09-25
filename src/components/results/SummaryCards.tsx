import React from 'react';
import { Globe, ShieldCheck, Lock, Unlock, CheckCircle2, Clock } from 'lucide-react';
import type { ScanSummary } from '../../types/scanner';

interface SummaryCardsProps {
  summary: ScanSummary;
}

export const SummaryCards: React.FC<SummaryCardsProps> = ({ summary }) => {
  const durationSec = (summary.durationMs / 1000).toFixed(1);

  const cards = [
    {
      label: 'Candidates Scanned',
      value: summary.totalChecked.toLocaleString(),
      icon: Globe,
      color: 'text-gray-300',
      bgColor: 'bg-gray-800/60',
      borderColor: 'border-gray-800',
    },
    {
      label: 'Subdomains Found',
      value: summary.subdomainsFound.toLocaleString(),
      icon: ShieldCheck,
      color: 'text-cyan-400',
      bgColor: 'bg-cyan-500/10',
      borderColor: 'border-cyan-500/30',
    },
    {
      label: 'HTTPS Active',
      value: summary.httpsCount.toLocaleString(),
      icon: Lock,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/10',
      borderColor: 'border-emerald-500/30',
    },
    {
      label: 'HTTP Active',
      value: summary.httpCount.toLocaleString(),
      icon: Unlock,
      color: 'text-amber-400',
      bgColor: 'bg-amber-500/10',
      borderColor: 'border-amber-500/30',
    },
    {
      label: 'Successful (2xx)',
      value: summary.successfulCount.toLocaleString(),
      icon: CheckCircle2,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/30',
    },
    {
      label: 'Total Duration',
      value: `${durationSec}s`,
      icon: Clock,
      color: 'text-gray-300',
      bgColor: 'bg-gray-800/60',
      borderColor: 'border-gray-800',
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <div
            key={idx}
            className={`rounded-lg p-3.5 border ${card.borderColor} ${card.bgColor} backdrop-blur-sm transition-all hover:border-gray-700`}
          >
            <div className="flex items-center justify-between text-xs text-gray-400 mb-1.5">
              <span className="truncate">{card.label}</span>
              <Icon className={`h-4 w-4 shrink-0 ${card.color}`} />
            </div>
            <div className="text-xl sm:text-2xl font-bold font-mono tracking-tight text-white tabular-nums">
              {card.value}
            </div>
          </div>
        );
      })}
    </div>
  );
};
