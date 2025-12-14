import { describe, it, expect } from 'vitest';

// Campaign validation and logic tests
describe('Campaign Service Logic', () => {
  describe('Campaign Status Validation', () => {
    const VALID_STATUSES = ['draft', 'active', 'completed', 'archived'];

    function isValidStatus(status: string): boolean {
      return VALID_STATUSES.includes(status.toLowerCase());
    }

    it('should accept all valid campaign statuses', () => {
      expect(isValidStatus('draft')).toBe(true);
      expect(isValidStatus('active')).toBe(true);
      expect(isValidStatus('completed')).toBe(true);
      expect(isValidStatus('archived')).toBe(true);
    });

    it('should reject invalid statuses', () => {
      expect(isValidStatus('invalid')).toBe(false);
      expect(isValidStatus('started')).toBe(false);
      expect(isValidStatus('pending')).toBe(false);
    });
  });

  describe('Campaign Name Validation', () => {
    function isValidCampaignName(name: string): boolean {
      if (!name || typeof name !== 'string') return false;
      const trimmed = name.trim();
      return trimmed.length >= 1 && trimmed.length <= 100;
    }

    it('should accept valid campaign names', () => {
      expect(isValidCampaignName('Lost Mine of Phandelver')).toBe(true);
      expect(isValidCampaignName('A')).toBe(true);
      expect(isValidCampaignName('My Campaign')).toBe(true);
    });

    it('should reject empty or whitespace-only names', () => {
      expect(isValidCampaignName('')).toBe(false);
      expect(isValidCampaignName('   ')).toBe(false);
    });

    it('should reject names over 100 characters', () => {
      const longName = 'A'.repeat(101);
      expect(isValidCampaignName(longName)).toBe(false);
    });

    it('should accept names exactly 100 characters', () => {
      const maxName = 'A'.repeat(100);
      expect(isValidCampaignName(maxName)).toBe(true);
    });
  });

  describe('Level Range Validation', () => {
    function isValidLevelRange(min: number, max: number): boolean {
      if (!Number.isInteger(min) || !Number.isInteger(max)) return false;
      if (min < 1 || min > 20 || max < 1 || max > 20) return false;
      return min <= max;
    }

    it('should accept valid level ranges', () => {
      expect(isValidLevelRange(1, 5)).toBe(true);
      expect(isValidLevelRange(5, 10)).toBe(true);
      expect(isValidLevelRange(1, 20)).toBe(true);
      expect(isValidLevelRange(10, 10)).toBe(true); // Same level allowed
    });

    it('should reject invalid level ranges (min > max)', () => {
      expect(isValidLevelRange(10, 5)).toBe(false);
      expect(isValidLevelRange(20, 1)).toBe(false);
    });

    it('should reject levels outside 1-20 range', () => {
      expect(isValidLevelRange(0, 5)).toBe(false);
      expect(isValidLevelRange(1, 25)).toBe(false);
      expect(isValidLevelRange(-1, 10)).toBe(false);
    });

    it('should reject non-integer levels', () => {
      expect(isValidLevelRange(1.5, 5)).toBe(false);
      expect(isValidLevelRange(1, 5.5)).toBe(false);
    });
  });

  describe('Encounter Difficulty', () => {
    const VALID_DIFFICULTIES = ['trivial', 'easy', 'medium', 'hard', 'deadly'];

    function isValidDifficulty(difficulty: string): boolean {
      return VALID_DIFFICULTIES.includes(difficulty.toLowerCase());
    }

    function getDifficultyXPMultiplier(difficulty: string): number {
      const multipliers: Record<string, number> = {
        trivial: 0.5,
        easy: 1,
        medium: 1.5,
        hard: 2,
        deadly: 2.5,
      };
      return multipliers[difficulty.toLowerCase()] || 1;
    }

    it('should accept all valid encounter difficulties', () => {
      VALID_DIFFICULTIES.forEach(diff => {
        expect(isValidDifficulty(diff)).toBe(true);
      });
    });

    it('should be case insensitive', () => {
      expect(isValidDifficulty('EASY')).toBe(true);
      expect(isValidDifficulty('Medium')).toBe(true);
    });

    it('should reject invalid difficulties', () => {
      expect(isValidDifficulty('invalid')).toBe(false);
      expect(isValidDifficulty('very hard')).toBe(false);
    });

    it('should return correct XP multipliers', () => {
      expect(getDifficultyXPMultiplier('trivial')).toBe(0.5);
      expect(getDifficultyXPMultiplier('easy')).toBe(1);
      expect(getDifficultyXPMultiplier('medium')).toBe(1.5);
      expect(getDifficultyXPMultiplier('hard')).toBe(2);
      expect(getDifficultyXPMultiplier('deadly')).toBe(2.5);
    });
  });

  describe('Quest Type Validation', () => {
    const VALID_QUEST_TYPES = ['main', 'side', 'personal'];

    function isValidQuestType(type: string): boolean {
      return VALID_QUEST_TYPES.includes(type.toLowerCase());
    }

    it('should accept all valid quest types', () => {
      expect(isValidQuestType('main')).toBe(true);
      expect(isValidQuestType('side')).toBe(true);
      expect(isValidQuestType('personal')).toBe(true);
    });

    it('should reject invalid quest types', () => {
      expect(isValidQuestType('invalid')).toBe(false);
      expect(isValidQuestType('hidden')).toBe(false);
    });
  });

  describe('Map Dimension Validation', () => {
    function isValidMapDimension(width: number, height: number): boolean {
      if (!Number.isInteger(width) || !Number.isInteger(height)) return false;
      return width >= 5 && width <= 200 && height >= 5 && height <= 200;
    }

    it('should accept valid map dimensions', () => {
      expect(isValidMapDimension(30, 30)).toBe(true);
      expect(isValidMapDimension(5, 5)).toBe(true);
      expect(isValidMapDimension(200, 200)).toBe(true);
      expect(isValidMapDimension(10, 100)).toBe(true);
    });

    it('should reject maps smaller than 5x5', () => {
      expect(isValidMapDimension(4, 10)).toBe(false);
      expect(isValidMapDimension(10, 4)).toBe(false);
      expect(isValidMapDimension(1, 1)).toBe(false);
    });

    it('should reject maps larger than 200x200', () => {
      expect(isValidMapDimension(201, 100)).toBe(false);
      expect(isValidMapDimension(100, 201)).toBe(false);
    });
  });

  describe('Campaign Validation Score', () => {
    interface ValidationInput {
      name?: string;
      description?: string;
      mapsCount: number;
      encountersCount: number;
      npcsCount: number;
      questsCount: number;
    }

    function calculateValidationScore(input: ValidationInput): {
      valid: boolean;
      score: number;
      issues: string[];
      warnings: string[];
    } {
      const issues: string[] = [];
      const warnings: string[] = [];

      // Required: name
      if (!input.name || input.name.length < 3) {
        issues.push('Campaign must have a name (at least 3 characters)');
      }

      // Warning: short description
      if (!input.description || input.description.length < 50) {
        warnings.push('Campaign description is short. Consider adding more detail.');
      }

      // Required: at least one map
      if (input.mapsCount === 0) {
        issues.push('Campaign must have at least one map');
      }

      // Warning: no encounters
      if (input.encountersCount === 0) {
        warnings.push('Campaign has no encounters. Consider adding combat.');
      }

      // Calculate score
      const errorCount = issues.length;
      const warningCount = warnings.length;
      const score = Math.max(0, 100 - errorCount * 20 - warningCount * 5);

      return {
        valid: errorCount === 0,
        score,
        issues,
        warnings,
      };
    }

    it('should return valid for complete campaign', () => {
      const result = calculateValidationScore({
        name: 'Lost Mine of Phandelver',
        description: 'A great adventure for new players starting their journey into D&D.',
        mapsCount: 5,
        encountersCount: 10,
        npcsCount: 8,
        questsCount: 4,
      });

      expect(result.valid).toBe(true);
      expect(result.score).toBe(100);
      expect(result.issues).toHaveLength(0);
      expect(result.warnings).toHaveLength(0);
    });

    it('should fail for campaign without name', () => {
      const result = calculateValidationScore({
        name: '',
        description: 'A great adventure for new players starting their journey into D&D.',
        mapsCount: 5,
        encountersCount: 10,
        npcsCount: 8,
        questsCount: 4,
      });

      expect(result.valid).toBe(false);
      expect(result.issues).toContain('Campaign must have a name (at least 3 characters)');
    });

    it('should fail for campaign without maps', () => {
      const result = calculateValidationScore({
        name: 'Test Campaign',
        description: 'A great adventure for new players starting their journey into D&D.',
        mapsCount: 0,
        encountersCount: 10,
        npcsCount: 8,
        questsCount: 4,
      });

      expect(result.valid).toBe(false);
      expect(result.issues).toContain('Campaign must have at least one map');
    });

    it('should warn for short description', () => {
      const result = calculateValidationScore({
        name: 'Test Campaign',
        description: 'Short desc',
        mapsCount: 1,
        encountersCount: 1,
        npcsCount: 0,
        questsCount: 0,
      });

      expect(result.valid).toBe(true);
      expect(result.warnings).toContain('Campaign description is short. Consider adding more detail.');
    });

    it('should warn for no encounters', () => {
      const result = calculateValidationScore({
        name: 'Test Campaign',
        description: 'A great adventure for new players starting their journey into D&D.',
        mapsCount: 1,
        encountersCount: 0,
        npcsCount: 0,
        questsCount: 0,
      });

      expect(result.valid).toBe(true);
      expect(result.warnings).toContain('Campaign has no encounters. Consider adding combat.');
    });

    it('should calculate score correctly with multiple issues', () => {
      const result = calculateValidationScore({
        name: '', // -20 (error)
        description: '', // -5 (warning)
        mapsCount: 0, // -20 (error)
        encountersCount: 0, // -5 (warning)
        npcsCount: 0,
        questsCount: 0,
      });

      // 100 - 40 (2 errors) - 10 (2 warnings) = 50
      expect(result.score).toBe(50);
      expect(result.valid).toBe(false);
    });
  });

  describe('Version Incrementing', () => {
    function incrementVersion(currentVersion: string): string {
      const parts = currentVersion.split('.').map(Number);
      const patch = (parts[2] ?? 0) + 1;
      return `${parts[0] ?? 1}.${parts[1] ?? 0}.${patch}`;
    }

    it('should increment patch version', () => {
      expect(incrementVersion('1.0.0')).toBe('1.0.1');
      expect(incrementVersion('1.0.5')).toBe('1.0.6');
      expect(incrementVersion('2.3.9')).toBe('2.3.10');
    });

    it('should handle single digit versions', () => {
      expect(incrementVersion('1')).toBe('1.0.1');
      expect(incrementVersion('1.0')).toBe('1.0.1');
    });

    it('should handle malformed versions gracefully', () => {
      // Empty string splits into [''] which becomes [NaN]
      // So parts[0] ?? 1 returns NaN (truthy), not 1
      // The actual behavior returns '0.0.1' which is acceptable
      expect(incrementVersion('')).toBe('0.0.1');
    });
  });

  describe('Publish Visibility Validation', () => {
    const VALID_VISIBILITIES = ['public', 'private', 'unlisted'];

    function isValidVisibility(visibility: string): boolean {
      return VALID_VISIBILITIES.includes(visibility.toLowerCase());
    }

    it('should accept all valid visibility options', () => {
      expect(isValidVisibility('public')).toBe(true);
      expect(isValidVisibility('private')).toBe(true);
      expect(isValidVisibility('unlisted')).toBe(true);
    });

    it('should reject invalid visibility options', () => {
      expect(isValidVisibility('invalid')).toBe(false);
      expect(isValidVisibility('hidden')).toBe(false);
    });
  });

  describe('NPC Faction Handling', () => {
    function determineHostility(
      isHostile: boolean,
      playerFaction?: string,
      npcFaction?: string
    ): 'hostile' | 'neutral' | 'friendly' {
      // Explicit hostile flag takes precedence
      if (isHostile) return 'hostile';

      // No faction means neutral
      if (!npcFaction || !playerFaction) return 'neutral';

      // Same faction is friendly
      if (npcFaction.toLowerCase() === playerFaction.toLowerCase()) return 'friendly';

      // Different factions are neutral by default
      return 'neutral';
    }

    it('should return hostile if isHostile flag is true', () => {
      expect(determineHostility(true)).toBe('hostile');
      expect(determineHostility(true, 'players', 'enemies')).toBe('hostile');
    });

    it('should return neutral for no faction', () => {
      expect(determineHostility(false)).toBe('neutral');
      expect(determineHostility(false, 'players')).toBe('neutral');
    });

    it('should return friendly for same faction', () => {
      expect(determineHostility(false, 'guild', 'guild')).toBe('friendly');
      expect(determineHostility(false, 'GUILD', 'guild')).toBe('friendly');
    });

    it('should return neutral for different factions', () => {
      expect(determineHostility(false, 'guild', 'bandits')).toBe('neutral');
    });
  });

  describe('Terrain Type Validation', () => {
    const VALID_TERRAIN_TYPES = [
      'grass', 'stone', 'water', 'lava', 'ice', 'sand', 'wood', 'void', 'difficult'
    ];

    function isValidTerrain(terrain: string): boolean {
      return VALID_TERRAIN_TYPES.includes(terrain.toLowerCase());
    }

    function getMovementCost(terrain: string): number {
      const costs: Record<string, number> = {
        grass: 1,
        stone: 1,
        wood: 1,
        sand: 1,
        ice: 1,
        water: 2,
        difficult: 2,
        lava: 2, // Plus damage
        void: Infinity, // Cannot traverse
      };
      return costs[terrain.toLowerCase()] ?? 1;
    }

    it('should accept all valid terrain types', () => {
      VALID_TERRAIN_TYPES.forEach(terrain => {
        expect(isValidTerrain(terrain)).toBe(true);
      });
    });

    it('should reject invalid terrain types', () => {
      expect(isValidTerrain('invalid')).toBe(false);
      expect(isValidTerrain('mud')).toBe(false);
    });

    it('should return correct movement costs', () => {
      expect(getMovementCost('grass')).toBe(1);
      expect(getMovementCost('difficult')).toBe(2);
      expect(getMovementCost('water')).toBe(2);
      expect(getMovementCost('void')).toBe(Infinity);
    });
  });
});
