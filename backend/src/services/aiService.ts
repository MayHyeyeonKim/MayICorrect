import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || '',
});

interface CorrectionResult {
    correctedSentence: string;
    explanation: string[];
    vocabulary: {
        expression: string;
        meaning: string;
        example: string;
    }[];
    tags: string[];
}

export async function correctEnglishWithOpenAI(koreanText: string, englishText: string): Promise<CorrectionResult> {
    try {
        const completion = await openai.chat.completions.create({
            model: 'gpt-3.5-turbo',
            messages: [
                {
                    role: 'system',
                    content: '당신은 한국인 영어 학습자를 위한 전문 영어 튜터입니다. 주어진 한국어 문장과 영어 번역을 바탕으로 자연스럽고 정확한 영어 교정을 제공해주세요.'
                },
                {
                    role: 'user',
                    content: `한국어 원문: "${koreanText}"
영어 번역: "${englishText}"

다음 JSON 형식으로 응답해주세요:
{
  "correctedEnglish": "교정된 자연스러운 영어 문장",
  "improvements": ["개선사항 1", "개선사항 2", "개선사항 3"],
  "vocabulary": [
    {"word": "단어", "meaning": "의미", "usage": "사용법 예시"},
    {"word": "단어2", "meaning": "의미2", "usage": "사용법 예시2"}
  ],
  "category": "일상대화|비즈니스|학술|여행|IT/기술|의료|음식|쇼핑|엔터테인먼트|기타"
}`
                }
            ],
            temperature: 0.7,
            max_tokens: 1000
        });

        const response = completion.choices[0]?.message?.content;
        if (!response) {
            throw new Error('No response from OpenAI');
        }

        try {
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0]);
                return {
                    correctedSentence: parsed.correctedEnglish || englishText,
                    explanation: Array.isArray(parsed.improvements) ? parsed.improvements : [],
                    vocabulary: Array.isArray(parsed.vocabulary) ? parsed.vocabulary.map((v: any) => ({
                        expression: v.word || '',
                        meaning: v.meaning || '',
                        example: v.usage || ''
                    })) : [],
                    tags: [parsed.category || '기타']
                };
            }
            
            return {
                correctedSentence: englishText,
                explanation: ["AI 응답을 파싱할 수 없습니다."],
                vocabulary: [],
                tags: ["오류"]
            };
        } catch (parseError) {
            console.error('Failed to parse OpenAI response:', parseError);
            return {
                correctedSentence: englishText,
                explanation: ["AI 응답 처리 중 오류가 발생했습니다."],
                vocabulary: [],
                tags: ["오류"]
            };
        }

    } catch (error) {
        console.error('OpenAI API error:', error);
        return {
            correctedSentence: englishText,
            explanation: ["AI 서비스에 일시적인 문제가 발생했습니다. 잠시 후 다시 시도해주세요."],
            vocabulary: [],
            tags: ["오류"]
        };
    }
}

export async function correctEnglish(korean: string, userEnglish: string): Promise<CorrectionResult> {
    if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.trim() !== '') {
        try {
            return await correctEnglishWithOpenAI(korean, userEnglish);
        } catch (error) {
            console.error('OpenAI API error:', error);
            return {
                correctedSentence: userEnglish,
                explanation: ["AI 서비스에 일시적인 문제가 발생했습니다. 잠시 후 다시 시도해주세요."],
                vocabulary: [],
                tags: ["오류"]
            };
        }
    }

    return {
        correctedSentence: userEnglish,
        explanation: ["OpenAI API 키가 설정되지 않았습니다. 환경 변수를 확인해주세요."],
        vocabulary: [],
        tags: ["설정 오류"]
    };
}


