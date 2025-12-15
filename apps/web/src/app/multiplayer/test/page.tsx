'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useWebSocket } from '@/hooks/useWebSocket';
import { useMultiplayerStore } from '@/stores/multiplayerStore';
import { useAuthStore } from '@/stores/authStore';
import { PlayerList } from '@/components/multiplayer/PlayerList';
import { ChatPanel } from '@/components/multiplayer/ChatPanel';

export default function MultiplayerTestPage() {
  const [sessionName, setSessionName] = useState('Test Session');
  const [inviteCode, setInviteCode] = useState('');
  const [diceExpression, setDiceExpression] = useState('1d20');

  const { user, token } = useAuthStore();
  const isAuthenticated = !!user && !!token;
  const {
    connectionStatus,
    currentSession: session,
    players,
    diceResults,
    isReady,
  } = useMultiplayerStore();

  const {
    isConnected,
    isAuthenticated: wsAuthenticated,
    connect,
    disconnect,
    createSession,
    joinSession,
    leaveSession,
    sendChat,
    rollDice,
    setReady,
  } = useWebSocket();

  const handleCreateSession = () => {
    if (sessionName.trim()) {
      createSession(sessionName.trim());
    }
  };

  const handleJoinSession = () => {
    if (inviteCode.trim()) {
      joinSession(inviteCode.trim().toUpperCase());
    }
  };

  const handleRollDice = () => {
    if (session && diceExpression.trim()) {
      rollDice(session.id, diceExpression.trim(), 'Test roll');
    }
  };

  return (
    <div className="min-h-screen bg-bg-dark p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-cinzel font-bold text-text-primary mb-6">
          Multiplayer Test Page
        </h1>

        {/* Auth Status */}
        <div className="mb-6 p-4 bg-bg-card rounded-lg border border-border">
          <h2 className="text-lg font-medium text-text-primary mb-2">Authentication</h2>
          <div className="flex items-center gap-4 text-sm">
            <span className={isAuthenticated ? 'text-green-400' : 'text-red-400'}>
              {isAuthenticated ? '✓ Logged in' : '✗ Not logged in'}
            </span>
            {user && (
              <span className="text-text-secondary">as {user.email}</span>
            )}
          </div>
          {!isAuthenticated && (
            <p className="mt-2 text-yellow-400 text-sm">
              Please <a href="/login" className="underline">login</a> first to test multiplayer features.
            </p>
          )}
        </div>

        {/* Connection Status */}
        <div className="mb-6 p-4 bg-bg-card rounded-lg border border-border">
          <h2 className="text-lg font-medium text-text-primary mb-2">WebSocket Connection</h2>
          <div className="flex items-center gap-4">
            <span className={`px-2 py-1 rounded text-sm ${
              connectionStatus === 'authenticated' ? 'bg-green-500/20 text-green-400' :
              connectionStatus === 'connected' ? 'bg-blue-500/20 text-blue-400' :
              connectionStatus === 'connecting' ? 'bg-yellow-500/20 text-yellow-400' :
              connectionStatus === 'error' ? 'bg-red-500/20 text-red-400' :
              'bg-gray-500/20 text-gray-400'
            }`}>
              {connectionStatus}
            </span>

            {!isConnected ? (
              <motion.button
                onClick={connect}
                disabled={!isAuthenticated}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="px-4 py-2 bg-primary text-bg-dark rounded font-medium
                         disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Connect
              </motion.button>
            ) : (
              <motion.button
                onClick={disconnect}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="px-4 py-2 bg-red-500 text-white rounded font-medium"
              >
                Disconnect
              </motion.button>
            )}
          </div>
        </div>

        {/* Session Management */}
        {wsAuthenticated && !session && (
          <div className="mb-6 p-4 bg-bg-card rounded-lg border border-border">
            <h2 className="text-lg font-medium text-text-primary mb-4">Session</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Create Session */}
              <div>
                <h3 className="text-sm font-medium text-text-secondary mb-2">Create New Session</h3>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={sessionName}
                    onChange={(e) => setSessionName(e.target.value)}
                    placeholder="Session name"
                    className="flex-1 px-3 py-2 bg-white rounded border border-border
                             focus:border-primary focus:outline-none text-sm text-gray-900 placeholder:text-gray-400"
                  />
                  <motion.button
                    onClick={handleCreateSession}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="px-4 py-2 bg-primary text-bg-dark rounded font-medium"
                  >
                    Create
                  </motion.button>
                </div>
              </div>

              {/* Join Session */}
              <div>
                <h3 className="text-sm font-medium text-text-secondary mb-2">Join Existing Session</h3>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                    placeholder="Invite code (e.g., ABC123)"
                    maxLength={6}
                    className="flex-1 px-3 py-2 bg-white rounded border border-border
                             focus:border-primary focus:outline-none text-sm uppercase text-gray-900 placeholder:text-gray-400"
                  />
                  <motion.button
                    onClick={handleJoinSession}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="px-4 py-2 bg-green-600 text-white rounded font-medium"
                  >
                    Join
                  </motion.button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Active Session */}
        {session && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Session Info & Players */}
            <div className="lg:col-span-1 space-y-4">
              {/* Session Info */}
              <div className="p-4 bg-bg-card rounded-lg border border-border">
                <h2 className="text-lg font-medium text-text-primary mb-2">{session.name}</h2>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Invite Code:</span>
                    <code className="px-2 py-0.5 bg-bg-elevated rounded text-primary font-mono">
                      {session.inviteCode}
                    </code>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Status:</span>
                    <span className={session.status === 'active' ? 'text-green-400' : 'text-yellow-400'}>
                      {session.status}
                    </span>
                  </div>
                </div>
                <motion.button
                  onClick={() => leaveSession(session.id)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="mt-4 w-full px-4 py-2 bg-red-500/20 text-red-400 rounded
                           border border-red-500/30 hover:bg-red-500/30"
                >
                  Leave Session
                </motion.button>
              </div>

              {/* Player List */}
              <div className="p-4 bg-bg-card rounded-lg border border-border">
                <PlayerList
                  players={players}
                  hostUserId={players.find(p => p.isDM)?.userId}
                />
                <motion.button
                  onClick={() => setReady(session.id)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`mt-4 w-full px-4 py-2 rounded font-medium transition-colors ${
                    isReady
                      ? 'bg-green-500/20 text-green-400 border border-green-500/50'
                      : 'bg-primary text-bg-dark'
                  }`}
                >
                  {isReady ? '✓ Ready' : 'Set Ready'}
                </motion.button>
              </div>

              {/* Dice Roller */}
              <div className="p-4 bg-bg-card rounded-lg border border-border">
                <h3 className="text-sm font-medium text-text-secondary mb-2">Dice Roller</h3>
                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    value={diceExpression}
                    onChange={(e) => setDiceExpression(e.target.value)}
                    placeholder="e.g., 2d6+4"
                    className="flex-1 px-3 py-2 bg-white rounded border border-border
                             focus:border-primary focus:outline-none text-sm font-mono text-gray-900 placeholder:text-gray-400"
                  />
                  <motion.button
                    onClick={handleRollDice}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="px-4 py-2 bg-purple-600 text-white rounded font-medium"
                  >
                    Roll
                  </motion.button>
                </div>

                {/* Quick dice buttons */}
                <div className="flex flex-wrap gap-1">
                  {['1d4', '1d6', '1d8', '1d10', '1d12', '1d20', '1d100'].map(dice => (
                    <button
                      key={dice}
                      onClick={() => {
                        setDiceExpression(dice);
                        rollDice(session.id, dice, `Quick ${dice}`);
                      }}
                      className="px-2 py-1 text-xs bg-bg-elevated rounded hover:bg-bg-card
                               text-text-secondary hover:text-text-primary transition-colors"
                    >
                      {dice}
                    </button>
                  ))}
                </div>

                {/* Recent rolls */}
                {diceResults.length > 0 && (
                  <div className="mt-3 space-y-1 max-h-32 overflow-y-auto">
                    {diceResults.slice(-5).reverse().map((result, i) => (
                      <div key={i} className="text-sm flex justify-between">
                        <span className="text-text-secondary">
                          {result.playerName}: {result.dice}
                        </span>
                        <span className="font-mono text-primary font-bold">
                          {result.total}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Chat */}
            <div className="lg:col-span-2 bg-bg-card rounded-lg border border-border overflow-hidden">
              <div className="px-4 py-3 border-b border-border">
                <h2 className="font-medium text-text-primary">Chat</h2>
              </div>
              <ChatPanel
                sessionId={session.id}
                onSendMessage={(content, isInCharacter) => sendChat(session.id, content, isInCharacter)}
                maxHeight="400px"
              />
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="mt-6 p-4 bg-blue-500/10 rounded-lg border border-blue-500/30">
          <h3 className="text-blue-400 font-medium mb-2">How to Test</h3>
          <ol className="text-sm text-blue-300 space-y-1 list-decimal list-inside">
            <li>Login to your account (if not already)</li>
            <li>Click "Connect" to establish WebSocket connection</li>
            <li>Create a new session or join with an invite code</li>
            <li>Open this page in another browser/incognito to test with multiple users</li>
            <li>Try chatting, rolling dice, and toggling ready status</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
