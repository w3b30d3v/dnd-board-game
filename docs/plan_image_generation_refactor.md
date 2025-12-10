# Plan: Image Generation Flow Refactor

## Problem Statement

Currently, the character creation flow has these issues:
1. **Images regenerate on navigation** - Going back from Review to CharacterDetails triggers new image generation
2. **Images generated before confirmation** - AI credits are consumed even if user abandons character creation
3. **No persistence** - Generated images aren't stored with the character, so they're regenerated each time
4. **No trading card until images exist** - The CharacterTradingCard requires images to be meaningful

## Proposed Solution

### New Flow

```
1. Character Creation Wizard (no images generated)
   - RaceSelection
   - ClassSelection
   - AbilityScores
   - BackgroundSelection
   - SkillSelection
   - SpellSelection (casters only)
   - CharacterDetails → Show placeholder/preview ONLY
   - ReviewCharacter → "Create Character" button

2. On "Create Character" click:
   - Save character to database with status = 'draft'
   - Redirect to Dashboard with `?characterId=xxx&generateImages=true`

3. Dashboard detects new character needing images:
   - Show character card with "Generating Images..." state
   - Call API to generate images
   - API saves images to character record in database
   - Update UI to show final character with images
   - Character status changes to 'complete'

4. Character Trading Card:
   - Only available for characters with images (status = 'complete')
   - Uses stored images from database
```

### Database Changes

Add `status` field to Character model:
```prisma
model Character {
  // ... existing fields
  status        String    @default("draft") // draft, generating, complete
  // portraitUrl, fullBodyUrls, imageSource already exist
}
```

### API Changes

1. **POST /characters** - Create character in draft mode (no images yet)
2. **POST /characters/:id/generate-images** - New endpoint to generate images for existing character
3. **GET /characters/:id** - Returns character with image status

### Frontend Changes

1. **CharacterDetails.tsx**
   - Remove `useEffect` that auto-generates images on mount
   - Show DiceBear placeholder only (no AI generation)
   - Remove `hasAttemptedGeneration` ref
   - Keep personality generation (that's separate)

2. **CharacterWizard.tsx**
   - Update `createCharacter` to redirect with `generateImages=true` param

3. **DashboardContent.tsx** (or new component)
   - Detect characters needing image generation
   - Show loading state during generation
   - Trigger image generation API call
   - Update UI when complete

4. **CharacterCard component** (new)
   - Display character on dashboard
   - Show "Generating Images..." during generation
   - Show "View Trading Card" button when images are ready

### Implementation Order

1. Add `status` field to Character schema
2. Create `/characters/:id/generate-images` API endpoint
3. Update CharacterDetails to NOT auto-generate images
4. Update CharacterWizard to redirect with flag
5. Update Dashboard to handle image generation flow
6. Add CharacterCard component with trading card modal trigger

### Benefits

- **No wasted credits** - Images only generated after user confirms character
- **Consistent images** - Images stored permanently with character
- **Better UX** - User sees creation progress on dashboard
- **Trading cards work** - Images available from database for card display
