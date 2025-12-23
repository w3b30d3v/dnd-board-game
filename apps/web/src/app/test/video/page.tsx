'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { CutscenePlayer, VideoGenerator } from '@/components/cutscene';
import type { CutscenePlayerProps } from '@/components/cutscene';

type TestStatus = CutscenePlayerProps['status'];

export default function VideoTestPage() {
  const [testStatus, setTestStatus] = useState<TestStatus>('PENDING');
  const [testProgress, setTestProgress] = useState(0.3);
  const [showGenerator, setShowGenerator] = useState(true);

  // Sample video URL for testing
  const sampleVideoUrl = 'https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4';

  return (
    <div className="min-h-screen bg-bg-dark p-6">
      {/* Header */}
      <div className="max-w-4xl mx-auto mb-8">
        <Link href="/dm" className="inline-flex items-center gap-2 text-text-secondary hover:text-text-primary mb-4">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to DM Dashboard
        </Link>
        <h1 className="text-3xl font-cinzel font-bold text-text-primary mb-2">
          Video Generation Test
        </h1>
        <p className="text-text-secondary">
          Test the CutscenePlayer and VideoGenerator components
        </p>
      </div>

      <div className="max-w-4xl mx-auto space-y-8">
        {/* VideoGenerator Component */}
        <section className="bg-bg-card border border-border rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-cinzel font-bold text-text-primary">
              VideoGenerator Component
            </h2>
            <button
              onClick={() => setShowGenerator(!showGenerator)}
              className="text-sm text-primary hover:underline"
            >
              {showGenerator ? 'Hide' : 'Show'}
            </button>
          </div>

          {showGenerator && (
            <VideoGenerator
              campaignId="test-campaign"
              onVideoGenerated={(url) => {
                console.log('Video generated:', url);
                alert(`Video generated: ${url}`);
              }}
            />
          )}
        </section>

        {/* CutscenePlayer States */}
        <section className="bg-bg-card border border-border rounded-xl p-6">
          <h2 className="text-xl font-cinzel font-bold text-text-primary mb-4">
            CutscenePlayer States
          </h2>

          {/* Controls */}
          <div className="mb-6 space-y-4">
            <div>
              <label className="block text-sm text-text-secondary mb-2">Test Status</label>
              <div className="flex flex-wrap gap-2">
                {(['PENDING', 'THROTTLED', 'RUNNING', 'SUCCEEDED', 'FAILED', 'CANCELLED'] as const).map((status) => (
                  <motion.button
                    key={status}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setTestStatus(status)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      testStatus === status
                        ? 'bg-primary text-bg-dark'
                        : 'bg-bg-elevated text-text-secondary hover:bg-border'
                    }`}
                  >
                    {status}
                  </motion.button>
                ))}
              </div>
            </div>

            {(testStatus === 'RUNNING' || testStatus === 'PENDING') && (
              <div>
                <label className="block text-sm text-text-secondary mb-2">
                  Progress: {Math.round(testProgress * 100)}%
                </label>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.1}
                  value={testProgress}
                  onChange={(e) => setTestProgress(parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>
            )}
          </div>

          {/* Player Preview */}
          <div className="max-w-2xl">
            <CutscenePlayer
              status={testStatus}
              progress={testProgress}
              videoUrl={testStatus === 'SUCCEEDED' ? sampleVideoUrl : undefined}
              error={testStatus === 'FAILED' ? 'Content moderation failed: The prompt was rejected due to policy violations.' : undefined}
              title="Test Cutscene - Dragon Reveal"
              onClose={() => console.log('Close clicked')}
            />
          </div>
        </section>

        {/* API Status Check */}
        <section className="bg-bg-card border border-border rounded-xl p-6">
          <h2 className="text-xl font-cinzel font-bold text-text-primary mb-4">
            API Endpoints
          </h2>

          <div className="space-y-3">
            <ApiEndpointTest
              name="Runway Status (No Auth)"
              url="/test/runway"
              method="GET"
            />
            <ApiEndpointTest
              name="Video Service Status"
              url="/ai/video/status"
              method="GET"
              requiresAuth
            />
            <ApiEndpointTest
              name="Scene Presets"
              url="/ai/video/presets"
              method="GET"
              requiresAuth
            />
          </div>
        </section>

        {/* Usage Instructions */}
        <section className="bg-bg-card border border-border rounded-xl p-6">
          <h2 className="text-xl font-cinzel font-bold text-text-primary mb-4">
            Usage Instructions
          </h2>

          <div className="prose prose-invert prose-sm max-w-none">
            <h3 className="text-text-primary">Import Components</h3>
            <pre className="bg-bg-elevated p-3 rounded-lg overflow-x-auto text-sm">
{`import { CutscenePlayer, VideoGenerator } from '@/components/cutscene';
import { useVideoGeneration, useVideoPresets } from '@/hooks/useVideoGeneration';`}
            </pre>

            <h3 className="text-text-primary mt-4">Basic Usage</h3>
            <pre className="bg-bg-elevated p-3 rounded-lg overflow-x-auto text-sm">
{`// Video Generator with callback
<VideoGenerator
  campaignId="your-campaign-id"
  onVideoGenerated={(url) => console.log('Video ready:', url)}
/>

// Standalone Player
<CutscenePlayer
  status="SUCCEEDED"
  videoUrl="https://..."
  title="Scene Title"
  onClose={() => {}}
/>`}
            </pre>

            <h3 className="text-text-primary mt-4">Using the Hook</h3>
            <pre className="bg-bg-elevated p-3 rounded-lg overflow-x-auto text-sm">
{`const { task, isGenerating, generateFromPreset } = useVideoGeneration();

// Generate from preset
await generateFromPreset({
  preset: 'dragonReveal',
  duration: 6,
});

// Check status
if (task?.status === 'SUCCEEDED') {
  console.log('Video URL:', task.videoUrl);
}`}
            </pre>
          </div>
        </section>
      </div>
    </div>
  );
}

// API Endpoint Test Component
function ApiEndpointTest({
  name,
  url,
  method,
  requiresAuth,
}: {
  name: string;
  url: string;
  method: string;
  requiresAuth?: boolean;
}) {
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const AI_SERVICE_URL = process.env.NEXT_PUBLIC_AI_SERVICE_URL || 'http://localhost:4003';

  const testEndpoint = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const headers: HeadersInit = {};

      if (requiresAuth) {
        const storage = localStorage.getItem('auth-storage');
        if (storage) {
          const parsed = JSON.parse(storage);
          const token = parsed.state?.token;
          if (token) {
            headers['Authorization'] = `Bearer ${token}`;
          }
        }
      }

      const response = await fetch(`${AI_SERVICE_URL}${url}`, {
        method,
        headers,
      });

      const data = await response.json();
      setResult(JSON.stringify(data, null, 2));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-bg-elevated rounded-lg p-4">
      <div className="flex items-center justify-between mb-2">
        <div>
          <span className="font-medium text-text-primary">{name}</span>
          <span className="ml-2 text-xs text-text-muted">{method} {url}</span>
          {requiresAuth && (
            <span className="ml-2 px-1.5 py-0.5 text-xs bg-yellow-500/20 text-yellow-400 rounded">
              Auth Required
            </span>
          )}
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={testEndpoint}
          disabled={loading}
          className="px-3 py-1 bg-primary text-bg-dark rounded text-sm font-medium disabled:opacity-50"
        >
          {loading ? 'Testing...' : 'Test'}
        </motion.button>
      </div>

      {error && (
        <div className="mt-2 p-2 bg-red-500/10 border border-red-500/30 rounded text-sm text-red-400">
          {error}
        </div>
      )}

      {result && (
        <pre className="mt-2 p-2 bg-bg-dark rounded text-xs text-text-secondary overflow-x-auto max-h-40">
          {result}
        </pre>
      )}
    </div>
  );
}
