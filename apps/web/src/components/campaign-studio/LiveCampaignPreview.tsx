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
} from '@/stores/campaignStudioStore';

interface LiveCampaignPreviewProps {
  campaignName: string;
  campaignId?: string;
  content: ContentBlock[];
  onItemClick?: (item: ContentBlock) => void;
  onEdit?: (id: string) => void;
  onRegenerate?: (id: string) => void;
  onDelete?: (id: string) => void;
  onGenerateImage?: (id: string) => void;
  isGeneratingImage?: boolean;
  onOpenMapEditor?: (locationId: string, locationName: string) => void;
}

export function LiveCampaignPreview({
  campaignName,
  campaignId: _campaignId, // Available for future use
  content,
  onItemClick,
  onEdit,
  onRegenerate,
  onDelete,
  onGenerateImage,
  isGeneratingImage,
  onOpenMapEditor,
}: LiveCampaignPreviewProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Group content by type
  const setting = content.find((c) => c.type === 'setting');
  const locations = content.filter((c) => c.type === 'location');
  const npcs = content.filter((c) => c.type === 'npc');
  const encounters = content.filter((c) => c.type === 'encounter');
  const quests = content.filter((c) => c.type === 'quest');

  const isEmpty = content.length === 0;

  return (
    <div className="h-full flex flex-col bg-bg-card border-l border-border min-h-0">
      {/* Campaign Header */}
      <div className="flex-shrink-0 px-4 py-4 border-b border-border bg-gradient-to-r from-bg-elevated to-bg-card">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center">
            <span className="text-xl">🏰</span>
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-cinzel font-bold text-text-primary truncate">
              {campaignName || 'New Campaign'}
            </h2>
            <p className="text-xs text-text-muted">
              {content.length} item{content.length !== 1 ? 's' : ''} created
            </p>
          </div>
        </div>
      </div>

      {/* Content list - scrollbar at right edge, padding only on left */}
      <div className="flex-1 overflow-y-auto pr-1">
        <div className="pl-4 py-4 space-y-4">
        {isEmpty ? (
          <EmptyState />
        ) : (
          <AnimatePresence mode="popLayout">
            {/* Setting Section */}
            {setting && (
              <ContentSection
                key="setting"
                icon="🌍"
                title="Setting"
                count={1}
              >
                <SettingCard
                  contentId={setting.id}
                  data={setting.data as SettingData}
                  isExpanded={expandedId === setting.id}
                  onToggle={() => setExpandedId(expandedId === setting.id ? null : setting.id)}
                  onClick={() => onItemClick?.(setting)}
                  onEdit={() => onEdit?.(setting.id)}
                  onRegenerate={() => onRegenerate?.(setting.id)}
                  onGenerateImage={() => onGenerateImage?.(setting.id)}
                  isGeneratingImage={isGeneratingImage}
                />
              </ContentSection>
            )}

            {/* Locations Section */}
            {locations.length > 0 && (
              <ContentSection
                key="locations"
                icon="📍"
                title="Locations"
                count={locations.length}
              >
                {locations.map((item) => (
                  <LocationCard
                    key={item.id}
                    contentId={item.id}
                    data={item.data as LocationData}
                    isExpanded={expandedId === item.id}
                    onToggle={() => setExpandedId(expandedId === item.id ? null : item.id)}
                    onClick={() => onItemClick?.(item)}
                    onEdit={() => onEdit?.(item.id)}
                    onRegenerate={() => onRegenerate?.(item.id)}
                    onDelete={() => onDelete?.(item.id)}
                    onGenerateImage={() => onGenerateImage?.(item.id)}
                    isGeneratingImage={isGeneratingImage}
                    onOpenMapEditor={onOpenMapEditor ? () => onOpenMapEditor(item.id, (item.data as LocationData).name) : undefined}
                  />
                ))}
              </ContentSection>
            )}

            {/* NPCs Section */}
            {npcs.length > 0 && (
              <ContentSection
                key="npcs"
                icon="👤"
                title="NPCs"
                count={npcs.length}
              >
                {npcs.map((item) => (
                  <NPCCard
                    key={item.id}
                    contentId={item.id}
                    data={item.data as NPCData}
                    isExpanded={expandedId === item.id}
                    onToggle={() => setExpandedId(expandedId === item.id ? null : item.id)}
                    onClick={() => onItemClick?.(item)}
                    onEdit={() => onEdit?.(item.id)}
                    onRegenerate={() => onRegenerate?.(item.id)}
                    onDelete={() => onDelete?.(item.id)}
                    onGenerateImage={() => onGenerateImage?.(item.id)}
                    isGeneratingImage={isGeneratingImage}
                  />
                ))}
              </ContentSection>
            )}

            {/* Encounters Section */}
            {encounters.length > 0 && (
              <ContentSection
                key="encounters"
                icon="⚔️"
                title="Encounters"
                count={encounters.length}
              >
                {encounters.map((item) => (
                  <EncounterCard
                    key={item.id}
                    data={item.data as EncounterData}
                    isExpanded={expandedId === item.id}
                    onToggle={() => setExpandedId(expandedId === item.id ? null : item.id)}
                    onClick={() => onItemClick?.(item)}
                    onEdit={() => onEdit?.(item.id)}
                    onRegenerate={() => onRegenerate?.(item.id)}
                    onDelete={() => onDelete?.(item.id)}
                  />
                ))}
              </ContentSection>
            )}

            {/* Quests Section */}
            {quests.length > 0 && (
              <ContentSection
                key="quests"
                icon="📜"
                title="Quests"
                count={quests.length}
              >
                {quests.map((item) => (
                  <QuestCard
                    key={item.id}
                    data={item.data as QuestData}
                    isExpanded={expandedId === item.id}
                    onToggle={() => setExpandedId(expandedId === item.id ? null : item.id)}
                    onClick={() => onItemClick?.(item)}
                    onEdit={() => onEdit?.(item.id)}
                    onRegenerate={() => onRegenerate?.(item.id)}
                    onDelete={() => onDelete?.(item.id)}
                  />
                ))}
              </ContentSection>
            )}

            {/* Empty sections as placeholders */}
            {!setting && <EmptySection icon="🌍" title="Setting" hint="Describe your world" />}
            {locations.length === 0 && <EmptySection icon="📍" title="Locations" hint="Add places to explore" />}
            {npcs.length === 0 && <EmptySection icon="👤" title="NPCs" hint="Create characters" />}
            {encounters.length === 0 && <EmptySection icon="⚔️" title="Encounters" hint="Design challenges" />}
            {quests.length === 0 && <EmptySection icon="📜" title="Quests" hint="Plan adventures" />}
          </AnimatePresence>
        )}
        </div>
      </div>
    </div>
  );
}

// Empty state for no content at all
function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center h-64 text-center px-4"
    >
      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center mb-4">
        <span className="text-3xl">✨</span>
      </div>
      <h3 className="text-sm font-medium text-text-primary mb-1">
        Start Building Your Campaign
      </h3>
      <p className="text-xs text-text-muted max-w-[220px]">
        Chat with the AI assistant to describe your world, characters, and adventures. Your campaign will take shape here.
      </p>
    </motion.div>
  );
}

// Empty section placeholder
function EmptySection({ icon, title, hint }: { icon: string; title: string; hint: string }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-3 rounded-lg border border-dashed border-border/50 bg-bg-elevated/30"
    >
      <div className="flex items-center gap-2 text-text-muted">
        <span className="text-lg opacity-50">{icon}</span>
        <span className="text-sm font-medium">{title}</span>
        <span className="text-xs text-text-muted/60 ml-auto">{hint}</span>
      </div>
    </motion.div>
  );
}

// Content section wrapper
function ContentSection({
  icon,
  title,
  count,
  children,
}: {
  icon: string;
  title: string;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-2"
    >
      <div className="flex items-center gap-2 text-xs font-medium text-text-secondary">
        <span>{icon}</span>
        <span>{title}</span>
        <span className="px-1.5 py-0.5 bg-bg-elevated rounded text-text-muted text-[10px]">
          {count}
        </span>
      </div>
      <div className="space-y-2">{children}</div>
    </motion.div>
  );
}

// Base card component props
interface BaseCardProps {
  contentId?: string;
  isExpanded: boolean;
  onToggle: () => void;
  onClick?: () => void;
  onEdit?: () => void;
  onRegenerate?: () => void;
  onDelete?: () => void;
  onGenerateImage?: () => void;
  isGeneratingImage?: boolean;
  onOpenMapEditor?: () => void;
}

// Setting Card
function SettingCard({
  data,
  isExpanded,
  onToggle,
  onClick,
  onEdit,
  onRegenerate,
  onGenerateImage,
  isGeneratingImage,
}: BaseCardProps & { data: SettingData }) {
  const hasImage = !!data.imageUrl;

  return (
    <motion.div
      layout
      className="bg-bg-elevated border border-border rounded-lg overflow-hidden hover:border-primary/30 transition-colors"
    >
      <button
        onClick={onToggle}
        className="w-full px-3 py-2.5 flex items-center justify-between hover:bg-bg-card/50 transition-colors"
      >
        <div className="flex items-center gap-2 min-w-0">
          {hasImage && (
            <img
              src={data.imageUrl}
              alt={data.name}
              className="w-8 h-8 rounded object-cover"
            />
          )}
          <span className="text-sm font-medium text-text-primary truncate">
            {data.name}
          </span>
          {data.tone && (
            <span className="px-1.5 py-0.5 text-[10px] bg-purple-500/20 text-purple-400 rounded">
              {data.tone}
            </span>
          )}
        </div>
        <ChevronIcon isExpanded={isExpanded} />
      </button>

      <AnimatePresence>
        {isExpanded && (
          <ExpandedContent>
            {hasImage && (
              <img
                src={data.imageUrl}
                alt={data.name}
                className="w-full h-32 rounded-lg object-cover mb-2"
              />
            )}
            <p className="text-xs text-text-secondary line-clamp-3 mb-2">
              {data.description}
            </p>
            {data.themes && data.themes.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-2">
                {data.themes.map((theme, i) => (
                  <span
                    key={i}
                    className="px-2 py-0.5 text-[10px] bg-primary/20 text-primary rounded-full"
                  >
                    {theme}
                  </span>
                ))}
              </div>
            )}
            <CardActions
              onClick={onClick}
              onEdit={onEdit}
              onRegenerate={onRegenerate}
              onGenerateImage={onGenerateImage}
              isGeneratingImage={isGeneratingImage}
              hasImage={hasImage}
            />
          </ExpandedContent>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// Location Card
function LocationCard({
  data,
  isExpanded,
  onToggle,
  onClick,
  onEdit,
  onRegenerate,
  onDelete,
  onGenerateImage,
  isGeneratingImage,
  onOpenMapEditor,
}: BaseCardProps & { data: LocationData }) {
  const hasImage = !!(data as LocationData & { imageUrl?: string }).imageUrl;

  return (
    <motion.div
      layout
      className="bg-bg-elevated border border-border rounded-lg overflow-hidden hover:border-primary/30 transition-colors"
    >
      <button
        onClick={onToggle}
        className="w-full px-3 py-2.5 flex items-center justify-between hover:bg-bg-card/50 transition-colors"
      >
        <div className="flex items-center gap-2 min-w-0">
          {hasImage && (
            <img
              src={(data as LocationData & { imageUrl?: string }).imageUrl}
              alt={data.name}
              className="w-8 h-8 rounded object-cover"
            />
          )}
          <span className="text-sm font-medium text-text-primary truncate">
            {data.name}
          </span>
          <span className="px-1.5 py-0.5 text-[10px] bg-blue-500/20 text-blue-400 rounded">
            {data.type}
          </span>
        </div>
        <ChevronIcon isExpanded={isExpanded} />
      </button>

      <AnimatePresence>
        {isExpanded && (
          <ExpandedContent>
            {hasImage && (
              <img
                src={(data as LocationData & { imageUrl?: string }).imageUrl}
                alt={data.name}
                className="w-full h-32 rounded-lg object-cover mb-2"
              />
            )}
            <p className="text-xs text-text-secondary line-clamp-2 mb-2">
              {data.description}
            </p>
            {data.features && data.features.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-2">
                {data.features.slice(0, 4).map((feature, i) => (
                  <span key={i} className="px-2 py-0.5 text-[10px] bg-bg-card text-text-muted rounded">
                    {feature}
                  </span>
                ))}
              </div>
            )}
            <CardActions
              onClick={onClick}
              onEdit={onEdit}
              onRegenerate={onRegenerate}
              onDelete={onDelete}
              onGenerateImage={onGenerateImage}
              isGeneratingImage={isGeneratingImage}
              hasImage={hasImage}
              onOpenMapEditor={onOpenMapEditor}
            />
          </ExpandedContent>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// NPC Card
function NPCCard({
  data,
  isExpanded,
  onToggle,
  onClick,
  onEdit,
  onRegenerate,
  onDelete,
  onGenerateImage,
  isGeneratingImage,
}: BaseCardProps & { data: NPCData }) {
  const hasPortrait = !!(data as NPCData & { portraitUrl?: string }).portraitUrl;
  const portraitUrl = (data as NPCData & { portraitUrl?: string }).portraitUrl;

  return (
    <motion.div
      layout
      className="bg-bg-elevated border border-border rounded-lg overflow-hidden hover:border-primary/30 transition-colors"
    >
      <button
        onClick={onToggle}
        className="w-full px-3 py-2.5 flex items-center justify-between hover:bg-bg-card/50 transition-colors"
      >
        <div className="flex items-center gap-2 min-w-0">
          {hasPortrait ? (
            <img
              src={portraitUrl}
              alt={data.name}
              className="w-8 h-8 rounded-full object-cover"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-500/30 to-green-600/30 flex items-center justify-center text-xs text-green-400">
              {data.name.charAt(0).toUpperCase()}
            </div>
          )}
          <span className="text-sm font-medium text-text-primary truncate">
            {data.name}
          </span>
          <span className="text-[10px] text-text-muted">{data.race}</span>
          <span className="px-1.5 py-0.5 text-[10px] bg-green-500/20 text-green-400 rounded">
            {data.role}
          </span>
        </div>
        <ChevronIcon isExpanded={isExpanded} />
      </button>

      <AnimatePresence>
        {isExpanded && (
          <ExpandedContent>
            {hasPortrait && (
              <div className="flex justify-center mb-2">
                <img
                  src={portraitUrl}
                  alt={data.name}
                  className="w-24 h-24 rounded-lg object-cover border border-border"
                />
              </div>
            )}
            <p className="text-xs text-text-secondary line-clamp-2 mb-2">
              {data.description}
            </p>
            {data.personality?.traits && (
              <p className="text-xs text-text-muted mb-2">
                <span className="text-text-secondary">Traits:</span> {data.personality.traits.join(', ')}
              </p>
            )}
            <CardActions
              onClick={onClick}
              onEdit={onEdit}
              onRegenerate={onRegenerate}
              onDelete={onDelete}
              onGenerateImage={onGenerateImage}
              isGeneratingImage={isGeneratingImage}
              hasImage={hasPortrait}
            />
          </ExpandedContent>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// Encounter Card
function EncounterCard({
  data,
  isExpanded,
  onToggle,
  onClick,
  onEdit,
  onRegenerate,
  onDelete,
}: BaseCardProps & { data: EncounterData }) {
  const difficultyColors = {
    easy: 'bg-green-500/20 text-green-400',
    medium: 'bg-yellow-500/20 text-yellow-400',
    hard: 'bg-orange-500/20 text-orange-400',
    deadly: 'bg-red-500/20 text-red-400',
  };

  return (
    <motion.div
      layout
      className="bg-bg-elevated border border-border rounded-lg overflow-hidden hover:border-primary/30 transition-colors"
    >
      <button
        onClick={onToggle}
        className="w-full px-3 py-2.5 flex items-center justify-between hover:bg-bg-card/50 transition-colors"
      >
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-sm font-medium text-text-primary truncate">
            {data.name}
          </span>
          <span className={`px-1.5 py-0.5 text-[10px] rounded ${difficultyColors[data.difficulty]}`}>
            {data.difficulty}
          </span>
        </div>
        <ChevronIcon isExpanded={isExpanded} />
      </button>

      <AnimatePresence>
        {isExpanded && (
          <ExpandedContent>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-1.5 py-0.5 text-[10px] bg-bg-card text-text-muted rounded">
                {data.type}
              </span>
            </div>
            <p className="text-xs text-text-secondary line-clamp-2 mb-2">
              {data.description}
            </p>
            {data.monsters && data.monsters.length > 0 && (
              <p className="text-xs text-text-muted mb-2">
                <span className="text-text-secondary">Enemies:</span> {data.monsters.join(', ')}
              </p>
            )}
            <CardActions onClick={onClick} onEdit={onEdit} onRegenerate={onRegenerate} onDelete={onDelete} />
          </ExpandedContent>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// Quest Card
function QuestCard({
  data,
  isExpanded,
  onToggle,
  onClick,
  onEdit,
  onRegenerate,
  onDelete,
}: BaseCardProps & { data: QuestData }) {
  const typeColors = {
    main: 'bg-primary/20 text-primary',
    side: 'bg-blue-500/20 text-blue-400',
    personal: 'bg-purple-500/20 text-purple-400',
  };

  return (
    <motion.div
      layout
      className="bg-bg-elevated border border-border rounded-lg overflow-hidden hover:border-primary/30 transition-colors"
    >
      <button
        onClick={onToggle}
        className="w-full px-3 py-2.5 flex items-center justify-between hover:bg-bg-card/50 transition-colors"
      >
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-sm font-medium text-text-primary truncate">
            {data.name}
          </span>
          <span className={`px-1.5 py-0.5 text-[10px] rounded ${typeColors[data.type]}`}>
            {data.type}
          </span>
        </div>
        <ChevronIcon isExpanded={isExpanded} />
      </button>

      <AnimatePresence>
        {isExpanded && (
          <ExpandedContent>
            <p className="text-xs text-text-secondary line-clamp-2 mb-2">
              {data.description}
            </p>
            {data.objectives && data.objectives.length > 0 && (
              <div className="mb-2">
                <span className="text-[10px] text-text-muted">Objectives:</span>
                <ul className="list-disc list-inside text-xs text-text-secondary mt-1">
                  {data.objectives.slice(0, 3).map((obj, i) => (
                    <li key={i} className="truncate">{obj}</li>
                  ))}
                </ul>
              </div>
            )}
            <CardActions onClick={onClick} onEdit={onEdit} onRegenerate={onRegenerate} onDelete={onDelete} />
          </ExpandedContent>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// Shared components
function ChevronIcon({ isExpanded }: { isExpanded: boolean }) {
  return (
    <motion.svg
      animate={{ rotate: isExpanded ? 180 : 0 }}
      className="w-4 h-4 text-text-muted flex-shrink-0"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </motion.svg>
  );
}

function ExpandedContent({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: 'auto', opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      <div className="px-3 pb-3 pt-2 border-t border-border/50">
        {children}
      </div>
    </motion.div>
  );
}

function CardActions({
  onClick,
  onEdit,
  onRegenerate,
  onDelete,
  onGenerateImage,
  isGeneratingImage,
  hasImage,
  onOpenMapEditor,
}: {
  onClick?: () => void;
  onEdit?: () => void;
  onRegenerate?: () => void;
  onDelete?: () => void;
  onGenerateImage?: () => void;
  isGeneratingImage?: boolean;
  hasImage?: boolean;
  onOpenMapEditor?: () => void;
}) {
  return (
    <div className="flex gap-2 pt-2 border-t border-border/30">
      {onClick && (
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={(e) => {
            e.stopPropagation();
            onClick();
          }}
          className="flex-1 px-2 py-1.5 text-xs bg-primary/20 hover:bg-primary/30 text-primary rounded transition-colors"
        >
          Discuss
        </motion.button>
      )}
      {onEdit && (
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
          className="flex-1 px-2 py-1.5 text-xs bg-bg-card hover:bg-border text-text-primary rounded transition-colors"
        >
          Edit
        </motion.button>
      )}
      {onGenerateImage && (
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={(e) => {
            e.stopPropagation();
            onGenerateImage();
          }}
          disabled={isGeneratingImage}
          className="px-2 py-1.5 text-xs bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title={hasImage ? 'Regenerate Image' : 'Generate AI Image'}
        >
          {isGeneratingImage ? '⏳' : hasImage ? '🖼️' : '✨'}
        </motion.button>
      )}
      {onOpenMapEditor && (
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={(e) => {
            e.stopPropagation();
            onOpenMapEditor();
          }}
          className="px-2 py-1.5 text-xs bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 rounded transition-colors"
          title="Open in Map Editor"
        >
          🗺️
        </motion.button>
      )}
      {onRegenerate && (
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={(e) => {
            e.stopPropagation();
            onRegenerate();
          }}
          className="px-2 py-1.5 text-xs bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 rounded transition-colors"
          title="Regenerate with AI"
        >
          🔄
        </motion.button>
      )}
      {onDelete && (
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="px-2 py-1.5 text-xs bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded transition-colors"
          title="Delete"
        >
          🗑️
        </motion.button>
      )}
    </div>
  );
}

export default LiveCampaignPreview;
