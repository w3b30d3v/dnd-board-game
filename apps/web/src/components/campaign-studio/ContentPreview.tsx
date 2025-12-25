'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ContentBlock,
  SettingData,
  LocationData,
  NPCData,
  EncounterData,
  QuestData,
  CampaignPhase,
  PHASE_INFO,
} from '@/stores/campaignStudioStore';

interface ContentPreviewProps {
  content: ContentBlock[];
  currentPhase: CampaignPhase;
  onEdit?: (id: string) => void;
  onRegenerate?: (id: string) => void;
}

export function ContentPreview({
  content,
  currentPhase,
  onEdit,
  onRegenerate,
}: ContentPreviewProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Group content by type
  const grouped = content.reduce((acc, item) => {
    if (!acc[item.type]) acc[item.type] = [];
    acc[item.type].push(item);
    return acc;
  }, {} as Record<string, ContentBlock[]>);

  const isEmpty = content.length === 0;

  return (
    <div className="h-full flex flex-col bg-bg-card border-l border-border">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border bg-bg-elevated/50">
        <h2 className="text-sm font-semibold text-text-primary">
          Generated Content
        </h2>
        <p className="text-xs text-text-muted mt-0.5">
          {content.length} item{content.length !== 1 ? 's' : ''} created
        </p>
      </div>

      {/* Content list */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
        {isEmpty ? (
          <EmptyState phase={currentPhase} />
        ) : (
          <AnimatePresence mode="popLayout">
            {Object.entries(grouped).map(([type, items]) => (
              <ContentSection
                key={type}
                type={type as ContentBlock['type']}
                items={items}
                expandedId={expandedId}
                onToggle={(id) => setExpandedId(expandedId === id ? null : id)}
                onEdit={onEdit}
                onRegenerate={onRegenerate}
              />
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}

// Empty state component
function EmptyState({ phase }: { phase: CampaignPhase }) {
  const info = PHASE_INFO[phase];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center h-64 text-center"
    >
      <div className="w-16 h-16 rounded-full bg-bg-elevated flex items-center justify-center mb-4">
        <span className="text-3xl">{info.icon}</span>
      </div>
      <h3 className="text-sm font-medium text-text-primary mb-1">
        No content yet
      </h3>
      <p className="text-xs text-text-muted max-w-[200px]">
        Chat with Claude to generate {info.label.toLowerCase()} for your campaign
      </p>
    </motion.div>
  );
}

// Content section component
function ContentSection({
  type,
  items,
  expandedId,
  onToggle,
  onEdit,
  onRegenerate,
}: {
  type: ContentBlock['type'];
  items: ContentBlock[];
  expandedId: string | null;
  onToggle: (id: string) => void;
  onEdit?: (id: string) => void;
  onRegenerate?: (id: string) => void;
}) {
  const typeLabels: Record<ContentBlock['type'], { label: string; icon: string }> = {
    setting: { label: 'Setting', icon: '🌍' },
    location: { label: 'Locations', icon: '🗺️' },
    npc: { label: 'NPCs', icon: '👥' },
    encounter: { label: 'Encounters', icon: '⚔️' },
    quest: { label: 'Quests', icon: '🎯' },
    cutscene: { label: 'Cutscenes', icon: '🎬' },
  };

  const info = typeLabels[type];

  return (
    <div className="space-y-2">
      {/* Section header */}
      <div className="flex items-center gap-2 text-xs font-medium text-text-muted">
        <span>{info.icon}</span>
        <span>{info.label}</span>
        <span className="text-text-muted/50">({items.length})</span>
      </div>

      {/* Cards */}
      <div className="space-y-2">
        {items.map((item) => (
          <ContentCard
            key={item.id}
            content={item}
            isExpanded={expandedId === item.id}
            onToggle={() => onToggle(item.id)}
            onEdit={() => onEdit?.(item.id)}
            onRegenerate={() => onRegenerate?.(item.id)}
          />
        ))}
      </div>
    </div>
  );
}

// Individual content card
function ContentCard({
  content,
  isExpanded,
  onToggle,
  onEdit,
  onRegenerate,
}: {
  content: ContentBlock;
  isExpanded: boolean;
  onToggle: () => void;
  onEdit?: () => void;
  onRegenerate?: () => void;
}) {
  const getCardContent = () => {
    switch (content.type) {
      case 'setting':
        return <SettingCard data={content.data as SettingData} />;
      case 'location':
        return <LocationCard data={content.data as LocationData} />;
      case 'npc':
        return <NPCCard data={content.data as NPCData} />;
      case 'encounter':
        return <EncounterCard data={content.data as EncounterData} />;
      case 'quest':
        return <QuestCard data={content.data as QuestData} />;
      default:
        return null;
    }
  };

  const getName = () => {
    const data = content.data;
    return (data as SettingData | LocationData | NPCData | EncounterData | QuestData).name;
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="bg-bg-elevated border border-border rounded-lg overflow-hidden"
    >
      {/* Card header */}
      <button
        onClick={onToggle}
        className="w-full px-3 py-2 flex items-center justify-between hover:bg-bg-card/50 transition-colors"
      >
        <span className="text-sm font-medium text-text-primary truncate">
          {getName()}
        </span>
        <motion.svg
          animate={{ rotate: isExpanded ? 180 : 0 }}
          className="w-4 h-4 text-text-muted flex-shrink-0"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </motion.svg>
      </button>

      {/* Expandable content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="px-3 pb-3 border-t border-border/50">
              {getCardContent()}

              {/* Actions */}
              <div className="flex gap-2 mt-3 pt-2 border-t border-border/50">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit?.();
                  }}
                  className="flex-1 px-2 py-1.5 text-xs bg-bg-card hover:bg-border text-text-primary rounded transition-colors"
                >
                  Edit
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onRegenerate?.();
                  }}
                  className="flex-1 px-2 py-1.5 text-xs bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 rounded transition-colors"
                >
                  Regenerate
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// Type-specific card contents
function SettingCard({ data }: { data: SettingData }) {
  return (
    <div className="pt-3 space-y-2 text-xs">
      <p className="text-text-secondary line-clamp-3">{data.description}</p>
      <div className="flex flex-wrap gap-1">
        {data.themes?.map((theme, i) => (
          <span
            key={i}
            className="px-2 py-0.5 bg-purple-500/20 text-purple-400 rounded-full"
          >
            {theme}
          </span>
        ))}
      </div>
      <div className="flex gap-4 text-text-muted">
        <span>Tone: {data.tone}</span>
        <span>Era: {data.era}</span>
      </div>
    </div>
  );
}

function LocationCard({ data }: { data: LocationData }) {
  return (
    <div className="pt-3 space-y-2 text-xs">
      <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded text-[10px]">
        {data.type}
      </span>
      <p className="text-text-secondary line-clamp-3">{data.description}</p>
      {data.features?.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {data.features.slice(0, 3).map((feature, i) => (
            <span key={i} className="px-2 py-0.5 bg-bg-card text-text-muted rounded">
              {feature}
            </span>
          ))}
          {data.features.length > 3 && (
            <span className="px-2 py-0.5 text-text-muted">
              +{data.features.length - 3} more
            </span>
          )}
        </div>
      )}
    </div>
  );
}

function NPCCard({ data }: { data: NPCData }) {
  return (
    <div className="pt-3 space-y-2 text-xs">
      <div className="flex items-center gap-2">
        <span className="text-text-muted">{data.race}</span>
        {data.class && <span className="text-primary">{data.class}</span>}
        <span className="px-2 py-0.5 bg-green-500/20 text-green-400 rounded text-[10px]">
          {data.role}
        </span>
      </div>
      <p className="text-text-secondary line-clamp-2">{data.description}</p>
      {data.personality && (
        <div className="space-y-1">
          <p className="text-text-muted">
            <span className="text-text-secondary">Traits:</span>{' '}
            {data.personality.traits?.join(', ')}
          </p>
          <p className="text-text-muted">
            <span className="text-text-secondary">Flaw:</span> {data.personality.flaw}
          </p>
        </div>
      )}
    </div>
  );
}

function EncounterCard({ data }: { data: EncounterData }) {
  const difficultyColors = {
    easy: 'bg-green-500/20 text-green-400',
    medium: 'bg-yellow-500/20 text-yellow-400',
    hard: 'bg-orange-500/20 text-orange-400',
    deadly: 'bg-red-500/20 text-red-400',
  };

  return (
    <div className="pt-3 space-y-2 text-xs">
      <div className="flex items-center gap-2">
        <span className="px-2 py-0.5 bg-bg-card text-text-muted rounded text-[10px]">
          {data.type}
        </span>
        <span className={`px-2 py-0.5 rounded text-[10px] ${difficultyColors[data.difficulty]}`}>
          {data.difficulty}
        </span>
      </div>
      <p className="text-text-secondary line-clamp-2">{data.description}</p>
      {data.monsters && data.monsters.length > 0 && (
        <p className="text-text-muted">
          Enemies: {data.monsters.join(', ')}
        </p>
      )}
    </div>
  );
}

function QuestCard({ data }: { data: QuestData }) {
  const typeColors = {
    main: 'bg-primary/20 text-primary',
    side: 'bg-blue-500/20 text-blue-400',
    personal: 'bg-purple-500/20 text-purple-400',
  };

  return (
    <div className="pt-3 space-y-2 text-xs">
      <span className={`px-2 py-0.5 rounded text-[10px] ${typeColors[data.type]}`}>
        {data.type} quest
      </span>
      <p className="text-text-secondary line-clamp-2">{data.description}</p>
      {data.objectives && data.objectives.length > 0 && (
        <div className="space-y-1">
          <span className="text-text-muted">Objectives:</span>
          <ul className="list-disc list-inside text-text-secondary">
            {data.objectives.slice(0, 3).map((obj, i) => (
              <li key={i} className="truncate">{obj}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default ContentPreview;
