import express from 'express';
import { correctEnglish } from '../services/geminiService';

const router = express.Router();

interface CorrectionRequest {
  korean: string;
  userEnglish: string;
}

interface CorrectionResponse {
  success: boolean;
  correctedSentence?: string;
  explanation?: string[];
  vocabulary?: {
    expression: string;
    meaning: string;
    example: string;
  }[];
  tags?: string[];
  error?: string;
}

router.post('/correct', async (req: express.Request<{}, CorrectionResponse, CorrectionRequest>, res: express.Response<CorrectionResponse>) => {
  try {
    const { korean, userEnglish } = req.body;
    
    if (!korean || !userEnglish) {
      return res.status(400).json({
        success: false,
        error: 'Both Korean and user English text are required'
      });
    }

    const result = await correctEnglish(korean, userEnglish);

    res.json({
      success: true,
      correctedSentence: result.correctedSentence,
      explanation: result.explanation,
      vocabulary: result.vocabulary,
      tags: result.tags
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

export default router;
