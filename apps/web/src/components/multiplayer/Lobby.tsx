'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useMultiplayerStore } from '@/stores/multiplayerStore';
import { useWebSocket } from '@/hooks/useWebSocket';
import { PlayerList } from './PlayerList';
import { ChatPanel } from './ChatPanel';

interface LobbyProps {
  sessionId: string;
  sessionName: string;
  inviteCode: string;
  onStartGame?: () => void;
  onLeave?: () => void;
}

export function Lobby({
  sessionId,
  sessionName,
  inviteCode,
  onStartGame,
  onLeave,
}: LobbyProps) {
  const [copied, setCopied] = useState(false);

  const { players, isHost, isReady } = useMultiplayerStore();
  const { setReady, sendChat, leaveSession } = useWebSocket();

  const handleCopyInvite = async () => {
    await navigator.clipboard.writeText(inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleToggleReady = () => {
    setReady(sessionId);
  };

  const handleLeave = () => {
    leaveSession(sessionId);
    onLeave?.();
  };

  const allPlayersReady = players
    .filter((p) => !p.isDM)
    .every((p) => p.isReady);

  const canStart = isHost && allPlayersReady && players.length >= 2;

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-cinzel font-bold text-text-primary">
            {sessionName}
          </h1>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-sm text-text-secondary">Invite Code:</span>
            <code className="px-2 py-1 bg-bg-elevated rounded text-primary font-mono">
              {inviteCode}
            </code>
            <motion.button
              onClick={handleCopyInvite}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-2 py-1 text-xs bg-primary/10 text-primary rounded hover:bg-primary/20"
            >
              {copied ? 'Copied!' : 'Copy'}
            </motion.button>
          </div>
        </div>

        <motion.button
          onClick={handleLeave}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="px-4 py-2 bg-red-500/10 text-red-400 rounded-lg border border-red-500/30
                   hover:bg-red-500/20 transition-colors"
        >
          Leave Session
        </motion.button>
      </div>

      {/* Main content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Player list */}
        <div className="lg:col-span-1 bg-bg-card rounded-xl p-4 border border-border">
          <PlayerList
            players={players}
            hostUserId={players.find((p) => p.isDM)?.userId}
          />

          {/* Ready button for non-hosts */}
          {!isHost && (
            <motion.button
              onClick={handleToggleReady}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`
                w-full mt-4 px-4 py-3 rounded-lg font-medium transition-colors
                ${isReady
                  ? 'bg-green-500/20 text-green-400 border border-green-500/50'
                  : 'bg-primary text-bg-dark'
                }
              `}
            >
              {isReady ? '✓ Ready' : 'Ready Up'}
            </motion.button>
          )}

          {/* Start game button for host */}
          {isHost && (
            <motion.button
              onClick={onStartGame}
              disabled={!canStart}
              whileHover={canStart ? { scale: 1.02 } : {}}
              whileTap={canStart ? { scale: 0.98 } : {}}
              className={`
                w-full mt-4 px-4 py-3 rounded-lg font-medium transition-colors
                ${canStart
                  ? 'bg-primary text-bg-dark hover:bg-primary-light'
                  : 'bg-gray-500/20 text-gray-500 cursor-not-allowed'
                }
              `}
            >
              {canStart
                ? 'Start Game'
                : players.length < 2
                  ? 'Waiting for players...'
                  : 'Waiting for players to ready up...'}
            </motion.button>
          )}
        </div>

        {/* Chat panel */}
        <div className="lg:col-span-2 bg-bg-card rounded-xl border border-border overflow-hidden">
          <div className="px-4 py-3 border-b border-border">
            <h2 className="font-medium text-text-primary">Chat</h2>
          </div>
          <ChatPanel
            sessionId={sessionId}
            onSendMessage={(content, isInCharacter) => sendChat(sessionId, content, isInCharacter)}
            maxHeight="350px"
          />
        </div>
      </div>

      {/* Tips */}
      <div className="mt-6 p-4 bg-blue-500/10 rounded-lg border border-blue-500/30">
        <p className="text-sm text-blue-300">
          <strong>Tip:</strong> Share the invite code with your friends to let them join.
          Once everyone is ready, the host can start the game.
        </p>
      </div>
    </div>
  );
}
