import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { CharacterService } from '../services/characterService.js';
import { ImageGenerationService } from '../services/imageGenerationService.js';
import { auth } from '../middleware/auth.js';
import { validateBody } from '../middleware/validation.js';

const router: Router = Router();
const characterService = new CharacterService();
const imageService = new ImageGenerationService();

// Validation schemas
const createCharacterSchema = z.object({
  name: z.string().min(1).max(100),
  race: z.string().min(1),
  subrace: z.string().optional(),
  class: z.string().min(1),
  subclass: z.string().optional(),
  background: z.string().min(1),
  strength: z.number().int().min(1).max(30),
  dexterity: z.number().int().min(1).max(30),
  constitution: z.number().int().min(1).max(30),
  intelligence: z.number().int().min(1).max(30),
  wisdom: z.number().int().min(1).max(30),
  charisma: z.number().int().min(1).max(30),
  skills: z.array(z.string()),
  equipment: z.array(z.unknown()).optional(),
  spellsKnown: z.array(z.string()).optional(),
  portraitUrl: z.string().url().optional(),
  appearance: z.unknown().optional(),
});

const updateCharacterSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  currentHitPoints: z.number().int().optional(),
  tempHitPoints: z.number().int().min(0).optional(),
  equipment: z.array(z.unknown()).optional(),
  spellsPrepared: z.array(z.string()).optional(),
  currency: z.object({
    cp: z.number().int().min(0),
    sp: z.number().int().min(0),
    gp: z.number().int().min(0),
    pp: z.number().int().min(0),
  }).optional(),
  portraitUrl: z.string().url().optional(),
  appearance: z.unknown().optional(),
});

// GET /characters - List user's characters
router.get('/', auth, async (req: Request, res: Response) => {
  try {
    const characters = await characterService.findByUser(req.user!.id);
    return res.json({ characters });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch characters' });
  }
});

// POST /characters - Create a new character
router.post('/', auth, validateBody(createCharacterSchema), async (req: Request, res: Response) => {
  try {
    const character = await characterService.create(req.user!.id, req.body);
    return res.status(201).json(character);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create character';
    return res.status(400).json({ error: message });
  }
});

// GET /characters/:id - Get a specific character
router.get('/:id', auth, async (req: Request<{ id: string }>, res: Response) => {
  try {
    const character = await characterService.findById(req.params.id, req.user!.id);
    if (!character) {
      return res.status(404).json({ error: 'Character not found' });
    }
    return res.json(character);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch character' });
  }
});

// PUT /characters/:id - Update a character
router.put('/:id', auth, validateBody(updateCharacterSchema), async (req: Request<{ id: string }>, res: Response) => {
  try {
    const character = await characterService.update(req.params.id, req.user!.id, req.body);
    return res.json(character);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update character';
    if (message.includes('not found')) {
      return res.status(404).json({ error: message });
    }
    return res.status(400).json({ error: message });
  }
});

// DELETE /characters/:id - Delete a character
router.delete('/:id', auth, async (req: Request<{ id: string }>, res: Response) => {
  try {
    await characterService.delete(req.params.id, req.user!.id);
    return res.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete character';
    if (message.includes('not found')) {
      return res.status(404).json({ error: message });
    }
    return res.status(400).json({ error: message });
  }
});

// POST /characters/:id/generate-images - Generate images for an existing character
router.post('/:id/generate-images', auth, async (req: Request<{ id: string }>, res: Response) => {
  try {
    const userId = req.user!.id;
    const characterId = req.params.id;

    // Get the character
    const character = await characterService.findById(characterId, userId);
    if (!character) {
      return res.status(404).json({ error: 'Character not found' });
    }

    // Check if character already has images (status = 'complete')
    if (character.status === 'complete' && character.portraitUrl) {
      return res.json({
        success: true,
        character,
        message: 'Character already has generated images',
      });
    }

    // Check if already generating
    if (character.status === 'generating') {
      return res.status(409).json({
        error: 'Image generation already in progress',
        status: 'generating',
      });
    }

    // Update status to 'generating'
    await characterService.updateStatus(characterId, userId, 'generating');

    // Generate images using the image generation service
    const result = await imageService.generateForCharacter(userId, character);

    // Update character with images and set status to 'complete'
    const updatedCharacter = await characterService.updateImages(
      characterId,
      userId,
      result.images.portrait,
      result.images.fullBodyUrls,
      result.source
    );

    return res.json({
      success: true,
      character: updatedCharacter,
      source: result.source,
      imagesGenerated: result.imagesGenerated,
      remaining: result.remaining,
      limit: result.limit,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to generate images';

    // Revert status on error
    try {
      await characterService.updateStatus(req.params.id, req.user!.id, 'draft');
    } catch {
      // Ignore revert errors
    }

    if (message.includes('limit')) {
      return res.status(403).json({ error: message, limitReached: true });
    }
    return res.status(500).json({ error: message });
  }
});

export default router;
