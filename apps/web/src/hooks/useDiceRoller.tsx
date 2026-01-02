'use client';

import { useState, useCallback, createContext, useContext, ReactNode } from 'react';
import { DiceRoller, DiceType, DiceRollResult, RollContext } from '@/components/dice/DiceRoller';

interface DiceRollRequest {
  dice?: DiceType;
  count?: number;
  modifier?: number;
  advantage?: boolean;
  disadvantage?: boolean;
  rollType?: string;
  rollContext?: string;
  gameContext?: RollContext;
  forceAnimation?: boolean;
}

interface DiceRollerContextType {
  roll: (request?: DiceRollRequest) => Promise<DiceRollResult>;
  rollAttack: (modifier: number, advantage?: boolean, disadvantage?: boolean, context?: string) => Promise<DiceRollResult>;
  rollSavingThrow: (modifier: number, saveName: string, advantage?: boolean, disadvantage?: boolean) => Promise<DiceRollResult>;
  rollAbilityCheck: (modifier: number, abilityName: string, advantage?: boolean, disadvantage?: boolean) => Promise<DiceRollResult>;
  rollDamage: (dice: DiceType, count: number, modifier?: number, damageType?: string) => Promise<DiceRollResult>;
  rollInitiative: (modifier: number, characterName?: string) => Promise<DiceRollResult>;
  isRolling: boolean;
}

const DiceRollerContext = createContext<DiceRollerContextType | null>(null);

export function DiceRollerProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentRequest, setCurrentRequest] = useState<DiceRollRequest>({});
  const [resolvePromise, setResolvePromise] = useState<((result: DiceRollResult) => void) | null>(null);

  const roll = useCallback((request: DiceRollRequest = {}): Promise<DiceRollResult> => {
    return new Promise((resolve) => {
      setCurrentRequest(request);
      setResolvePromise(() => resolve);
      setIsOpen(true);
    });
  }, []);

  const handleComplete = useCallback((result: DiceRollResult) => {
    if (resolvePromise) {
      resolvePromise(result);
      setResolvePromise(null);
    }
  }, [resolvePromise]);

  const handleClose = useCallback(() => {
    setIsOpen(false);
  }, []);

  // Convenience methods for common roll types
  const rollAttack = useCallback(
    (modifier: number, advantage = false, disadvantage = false, context?: string) => {
      return roll({
        dice: 'd20',
        modifier,
        advantage,
        disadvantage,
        rollType: 'Attack Roll',
        rollContext: context || 'Attack',
        gameContext: 'combat',
      });
    },
    [roll]
  );

  const rollSavingThrow = useCallback(
    (modifier: number, saveName: string, advantage = false, disadvantage = false) => {
      return roll({
        dice: 'd20',
        modifier,
        advantage,
        disadvantage,
        rollType: 'Saving Throw',
        rollContext: saveName,
        gameContext: 'combat',
      });
    },
    [roll]
  );

  const rollAbilityCheck = useCallback(
    (modifier: number, abilityName: string, advantage = false, disadvantage = false) => {
      return roll({
        dice: 'd20',
        modifier,
        advantage,
        disadvantage,
        rollType: 'Ability Check',
        rollContext: abilityName,
        gameContext: 'exploration',
      });
    },
    [roll]
  );

  const rollDamage = useCallback(
    (dice: DiceType, count: number, modifier = 0, damageType?: string) => {
      return roll({
        dice,
        count,
        modifier,
        rollType: 'Damage',
        rollContext: damageType ? `${damageType} damage` : 'Damage',
        gameContext: 'combat',
      });
    },
    [roll]
  );

  const rollInitiative = useCallback(
    (modifier: number, characterName?: string) => {
      return roll({
        dice: 'd20',
        modifier,
        rollType: 'Initiative',
        rollContext: characterName || 'Initiative',
        gameContext: 'important',
        forceAnimation: true, // Initiative is always animated - it's dramatic!
      });
    },
    [roll]
  );

  const value: DiceRollerContextType = {
    roll,
    rollAttack,
    rollSavingThrow,
    rollAbilityCheck,
    rollDamage,
    rollInitiative,
    isRolling: isOpen,
  };

  return (
    <DiceRollerContext.Provider value={value}>
      {children}
      <DiceRoller
        isOpen={isOpen}
        onClose={handleClose}
        onComplete={handleComplete}
        dice={currentRequest.dice}
        count={currentRequest.count}
        modifier={currentRequest.modifier}
        advantage={currentRequest.advantage}
        disadvantage={currentRequest.disadvantage}
        rollType={currentRequest.rollType}
        rollContext={currentRequest.rollContext}
        gameContext={currentRequest.gameContext}
        forceAnimation={currentRequest.forceAnimation}
        autoRoll
      />
    </DiceRollerContext.Provider>
  );
}

export function useDiceRoller() {
  const context = useContext(DiceRollerContext);
  if (!context) {
    throw new Error('useDiceRoller must be used within a DiceRollerProvider');
  }
  return context;
}
