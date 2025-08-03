import express from 'express';
import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';

const router = express.Router();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

router.post('/speak', async (req, res) => {
  try {
    const { text, voice = 'alloy' } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }

    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ error: 'OpenAI API key not configured' });
    }

    console.log(`🎤 TTS Request: "${text}" with voice: ${voice}`);

    // OpenAI TTS API 호출
    const mp3 = await openai.audio.speech.create({
      model: 'tts-1',
      voice: voice as 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer',
      input: text,
      response_format: 'mp3',
      speed: 0.9, // 약간 느리게 (0.25 ~ 4.0)
    });

    // 오디오 데이터를 버퍼로 변환
    const buffer = Buffer.from(await mp3.arrayBuffer());

    // 응답 헤더 설정
    res.set({
      'Content-Type': 'audio/mpeg',
      'Content-Length': buffer.length.toString(),
      'Cache-Control': 'public, max-age=3600', // 1시간 캐시
    });

    // 오디오 데이터 전송
    res.send(buffer);

  } catch (error) {
    console.error('❌ TTS Error:', error);
    
    if (error instanceof Error) {
      res.status(500).json({ 
        error: 'TTS 생성 중 오류가 발생했습니다', 
        details: error.message 
      });
    } else {
      res.status(500).json({ 
        error: 'TTS 생성 중 알 수 없는 오류가 발생했습니다' 
      });
    }
  }
});

// 사용 가능한 음성 목록 반환
router.get('/voices', (req, res) => {
  const voices = [
    { id: 'alloy', name: 'Alloy', description: '중성적이고 균형잡힌 음성' },
    { id: 'echo', name: 'Echo', description: '남성적이고 깊은 음성' },
    { id: 'fable', name: 'Fable', description: '따뜻하고 친근한 음성' },
    { id: 'onyx', name: 'Onyx', description: '남성적이고 강한 음성' },
    { id: 'nova', name: 'Nova', description: '여성적이고 부드러운 음성' },
    { id: 'shimmer', name: 'Shimmer', description: '여성적이고 밝은 음성' }
  ];
  
  res.json({ voices });
});

export default router;
