import React from 'react';
import { 
  ShieldCheck, 
  Target, 
  Zap, 
  AlertTriangle, 
  BellOff,
  CheckCircle2,
  TrendingUp,
  Info
} from 'lucide-react';

export default function KpiCards({ kpis }) {
  const cards = [
    {
      title: "Rappel Global (Recall)",
      value: "0.91",
      percentage: "90.8%",
      description: "Pourcentage des pannes réelles interceptées avant incident",
      badge: "Priorité absolue",
      badgeColor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
      icon: ShieldCheck,
      iconColor: "text-emerald-400",
      borderColor: "hover:border-emerald-500/40",
      accentGlow: "from-emerald-500/10"
    },
    {
      title: "Précision (Precision)",
      value: "0.24",
      percentage: "23.6%",
      description: "Part des alertes émises correspondant à de réelles dégradations",
      badge: "Compromis métier",
      badgeColor: "bg-amber-500/10 text-amber-400 border-amber-500/20",
      icon: Target,
      iconColor: "text-amber-400",
      borderColor: "hover:border-amber-500/40",
      accentGlow: "from-amber-500/10"
    },
    {
      title: "F1-Score",
      value: "0.37",
      percentage: "0.374",
      description: "Moyenne harmonique entre Rappel et Précision",
      badge: "Seuil -0.05",
      badgeColor: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
      icon: Zap,
      iconColor: "text-indigo-400",
      borderColor: "hover:border-indigo-500/40",
      accentGlow: "from-indigo-500/10"
    },
    {
      title: "Anomalies Détectées",
      value: "2 446",
      subValue: "/ 2 694",
      description: "2 446 minutes de dégradation identifiées sur 2 694 au total",
      badge: "248 manquées (9.2%)",
      badgeColor: "bg-rose-500/10 text-rose-400 border-rose-500/20",
      icon: AlertTriangle,
      iconColor: "text-rose-400",
      borderColor: "hover:border-rose-500/40",
      accentGlow: "from-rose-500/10"
    },
    {
      title: "Fausses Alertes",
      value: "7 937",
      subValue: "alertes",
      description: "Alertes sur périodes normales (coût d'investigation toléré)",
      badge: "27.9% du temps normal",
      badgeColor: "bg-sky-500/10 text-sky-400 border-sky-500/20",
      icon: BellOff,
      iconColor: "text-sky-400",
      borderColor: "hover:border-sky-500/40",
      accentGlow: "from-sky-500/10"
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <div
            key={idx}
            className={`relative group rounded-xl bg-slate-900/70 border border-slate-800/80 p-4 shadow-lg transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl ${card.borderColor} overflow-hidden`}
          >
            {/* Top gradient glow on hover */}
            <div className={`absolute -top-12 -left-12 w-28 h-28 bg-gradient-to-br ${card.accentGlow} to-transparent rounded-full blur-2xl pointer-events-none group-hover:scale-150 transition-transform duration-500`} />

            <div className="flex items-start justify-between gap-2 mb-2">
              <span className="text-xs font-medium text-slate-400 line-clamp-1">
                {card.title}
              </span>
              <div className="p-1.5 rounded-lg bg-slate-800/80 border border-slate-700/60">
                <Icon className={`w-4 h-4 ${card.iconColor}`} />
              </div>
            </div>

            <div className="flex items-baseline gap-1.5 mb-1.5">
              <span className="text-2xl font-black tracking-tight text-white font-mono">
                {card.value}
              </span>
              {card.subValue && (
                <span className="text-xs font-semibold text-slate-400 font-mono">
                  {card.subValue}
                </span>
              )}
              {card.percentage && (
                <span className="text-xs font-medium text-slate-400 ml-auto font-mono">
                  ({card.percentage})
                </span>
              )}
            </div>

            <p className="text-[11px] leading-relaxed text-slate-400/90 mb-3 min-h-[32px]">
              {card.description}
            </p>

            <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-[11px]">
              <span className={`px-2 py-0.5 rounded-md border text-[10px] font-semibold ${card.badgeColor}`}>
                {card.badge}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
