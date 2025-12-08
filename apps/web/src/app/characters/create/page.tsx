import { Suspense } from 'react';
import CharacterCreateContent from './CharacterCreateContent';

export const metadata = {
  title: 'Create Character | D&D Board',
  description: 'Create your D&D 5e character with our immersive character builder',
};

export default function CharacterCreatePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center relative">
        <div className="dnd-page-background" />
        <div className="w-16 h-16 spinner border-4" />
      </div>
    }>
      <CharacterCreateContent />
    </Suspense>
  );
}
