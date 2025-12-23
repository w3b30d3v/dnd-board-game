'use client';

import { motion } from 'framer-motion';
import { CampaignPhase, PHASE_ORDER, PHASE_INFO } from '@/stores/campaignStudioStore';

interface PhaseProgressProps {
  currentPhase: CampaignPhase;
  completedPhases: CampaignPhase[];
  onPhaseClick?: (phase: CampaignPhase) => void;
}

export function PhaseProgress({
  currentPhase,
  completedPhases,
  onPhaseClick,
}: PhaseProgressProps) {
  return (
    <div className="flex items-center justify-between px-4 py-3 bg-bg-elevated/50 border-b border-border overflow-x-auto">
      {PHASE_ORDER.map((phase, index) => {
        const info = PHASE_INFO[phase];
        const isCompleted = completedPhases.includes(phase);
        const isCurrent = phase === currentPhase;
        const isUpcoming = !isCompleted && !isCurrent;
        const canNavigate = isCompleted || index <= PHASE_ORDER.indexOf(currentPhase);

        return (
          <div key={phase} className="flex items-center">
            <motion.button
              onClick={() => canNavigate && onPhaseClick?.(phase)}
              disabled={!canNavigate}
              className={`
                relative flex flex-col items-center gap-1 px-3 py-2 rounded-lg
                transition-all duration-200 min-w-[80px]
                ${isCurrent ? 'bg-primary/20 ring-2 ring-primary/50' : ''}
                ${isCompleted ? 'opacity-100' : isUpcoming ? 'opacity-40' : ''}
                ${canNavigate ? 'cursor-pointer hover:bg-bg-elevated' : 'cursor-default'}
              `}
              whileHover={canNavigate ? { scale: 1.05 } : {}}
              whileTap={canNavigate ? { scale: 0.95 } : {}}
            >
              {/* Icon */}
              <span className="text-xl">{info.icon}</span>

              {/* Label */}
              <span
                className={`text-xs font-medium ${
                  isCurrent ? 'text-primary' : 'text-text-secondary'
                }`}
              >
                {info.label}
              </span>

              {/* Completion checkmark */}
              {isCompleted && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                  className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-green-500 flex items-center justify-center shadow-lg"
                >
                  <svg
                    className="w-3 h-3 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={3}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </motion.div>
              )}

              {/* Current indicator */}
              {isCurrent && !isCompleted && (
                <motion.div
                  className="absolute -bottom-1 w-8 h-1 bg-primary rounded-full"
                  layoutId="phaseIndicator"
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              )}
            </motion.button>

            {/* Connector line */}
            {index < PHASE_ORDER.length - 1 && (
              <div className="flex-shrink-0 w-8 h-0.5 mx-1 overflow-hidden">
                <motion.div
                  className={`h-full ${isCompleted ? 'bg-green-500' : 'bg-border'}`}
                  initial={{ width: 0 }}
                  animate={{ width: '100%' }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// Compact version for mobile
export function PhaseProgressCompact({
  currentPhase,
  completedPhases,
  progressPercent,
}: {
  currentPhase: CampaignPhase;
  completedPhases: CampaignPhase[];
  progressPercent: number;
}) {
  const info = PHASE_INFO[currentPhase];
  const currentIndex = PHASE_ORDER.indexOf(currentPhase);

  return (
    <div className="px-4 py-3 bg-bg-elevated/50 border-b border-border">
      {/* Current phase info */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-lg">{info.icon}</span>
          <div>
            <span className="text-sm font-medium text-text-primary">
              {info.label}
            </span>
            <span className="text-xs text-text-muted ml-2">
              Phase {currentIndex + 1} of {PHASE_ORDER.length}
            </span>
          </div>
        </div>
        <span className="text-sm text-primary font-medium">{progressPercent}%</span>
      </div>

      {/* Progress bar */}
      <div className="h-2 bg-bg-dark rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-purple-500 to-primary"
          initial={{ width: 0 }}
          animate={{ width: `${progressPercent}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>

      {/* Phase dots */}
      <div className="flex items-center justify-between mt-2">
        {PHASE_ORDER.map((phase, index) => {
          const isCompleted = completedPhases.includes(phase);
          const isCurrent = phase === currentPhase;

          return (
            <motion.div
              key={phase}
              className={`w-2 h-2 rounded-full transition-colors ${
                isCompleted
                  ? 'bg-green-500'
                  : isCurrent
                  ? 'bg-primary'
                  : 'bg-border'
              }`}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: index * 0.05 }}
            />
          );
        })}
      </div>
    </div>
  );
}

export default PhaseProgress;
