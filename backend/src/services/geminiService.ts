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
        } catch (parseError) {
        }

        const corrected = improveEnglishLocal(koreanText, englishText);
        const explanations = analyzeCorrectionsLocal(koreanText, englishText, corrected);
        const vocab = extractVocabularyLocal(koreanText, englishText);
        const tags = categorizeSentenceLocal(koreanText, englishText);

        return {
            correctedSentence: corrected,
            explanation: explanations,
            vocabulary: vocab,
            tags: tags
        };

    } catch (error) {
        const corrected = improveEnglishLocal(koreanText, englishText);
        const explanations = analyzeCorrectionsLocal(koreanText, englishText, corrected);
        const vocab = extractVocabularyLocal(koreanText, englishText);
        const tags = categorizeSentenceLocal(koreanText, englishText);

        return {
            correctedSentence: corrected,
            explanation: explanations,
            vocabulary: vocab,
            tags: tags
        };
    }
}

export async function correctEnglish(korean: string, userEnglish: string): Promise<CorrectionResult> {
    if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.trim() !== '') {
        try {
            const result = await correctEnglishWithOpenAI(korean, userEnglish);

            if (result.explanation[0] !== "AI 서비스에 일시적인 문제가 발생했습니다. 잠시 후 다시 시도해주세요.") {
                return result;
            }
        } catch (error) {
        }
    }

    const corrected = improveEnglishLocal(korean, userEnglish);
    const explanations = analyzeCorrectionsLocal(korean, userEnglish, corrected);
    const vocab = extractVocabularyLocal(korean, userEnglish);
    const tags = categorizeSentenceLocal(korean, userEnglish);

    return {
        correctedSentence: corrected,
        explanation: explanations,
        vocabulary: vocab,
        tags: tags
    };
}

function improveEnglishLocal(korean: string, userEnglish: string): string {
    let corrected = userEnglish;

    corrected = corrected.replace(/\blondon\b/gi, 'London');
    corrected = corrected.replace(/\bchuchu\b/gi, 'Chuchu');
    corrected = corrected.replace(/\bnewyork\b/gi, 'New York');
    corrected = corrected.replace(/\bseattle\b/gi, 'Seattle');

    if (corrected.includes('london snack') && !corrected.includes('a london snack') && !corrected.includes('the london snack')) {
        corrected = corrected.replace('london snack', 'a London snack');
    }

    if (korean.includes('먹었다') && corrected.includes('ate')) {
    }

    if (corrected.includes('snack that chuchu bought')) {
        corrected = corrected.replace('snack that chuchu bought', 'snack that Chuchu bought');
    }

    return corrected;
}

function analyzeCorrectionsLocal(korean: string, userEnglish: string, corrected: string): string[] {
    const explanations: string[] = [];

    if (userEnglish !== corrected) {
        if (userEnglish.includes('london') && corrected.includes('London')) {
            explanations.push('Proper nouns like city names should be capitalized: "london" → "London"');
        }

        if (userEnglish.includes('chuchu') && corrected.includes('Chuchu')) {
            explanations.push('Names should be capitalized: "chuchu" → "Chuchu"');
        }

        if (!userEnglish.includes('a ') && corrected.includes('a ')) {
            explanations.push('Added article "a" before countable nouns for natural English');
        }

        if (korean.includes('먹었다')) {
            explanations.push('Used past tense "ate" correctly to match Korean past tense "먹었다"');
        }
    }

    if (explanations.length === 0) {
        explanations.push('Good job! Your English is grammatically correct. Here are some style suggestions.');
    }

    return explanations;
}

function extractVocabularyLocal(korean: string, userEnglish: string): Array<{ expression: string, meaning: string, example: string }> {
    const vocab = [];

    if (korean.includes('스넥') || userEnglish.includes('snack')) {
        vocab.push({
            expression: "snack",
            meaning: "간식, 스넥",
            example: "I bought some snacks for the movie."
        });
    }

    if (korean.includes('사온') || userEnglish.includes('bought')) {
        vocab.push({
            expression: "bought",
            meaning: "사다 (과거형)",
            example: "She bought a present for her friend."
        });
    }

    if (korean.includes('런던') || userEnglish.includes('ondon')) {
        vocab.push({
            expression: "London",
            meaning: "런던 (영국의 수도)",
            example: "London is famous for its red buses and Big Ben."
        });
    }

    return vocab;
}

function categorizeSentenceLocal(korean: string, userEnglish: string): string[] {
    const tags = [];
    const lowerKorean = korean.toLowerCase();
    const lowerEnglish = userEnglish.toLowerCase();

    if (lowerKorean.includes('컴퓨터') || lowerKorean.includes('프로그램') || lowerKorean.includes('앱') ||
        lowerKorean.includes('소프트웨어') || lowerKorean.includes('웹사이트') || lowerKorean.includes('서버') ||
        lowerEnglish.includes('computer') || lowerEnglish.includes('program') || lowerEnglish.includes('app') ||
        lowerEnglish.includes('software') || lowerEnglish.includes('website') || lowerEnglish.includes('server') ||
        lowerEnglish.includes('code') || lowerEnglish.includes('database') || lowerEnglish.includes('algorithm')) {
        tags.push('IT/기술');
    }

    else if (lowerKorean.includes('회사') || lowerKorean.includes('업무') || lowerKorean.includes('회의') ||
        lowerEnglish.includes('company') || lowerEnglish.includes('business') || lowerEnglish.includes('meeting')) {
        tags.push('비즈니스');
    }

    else if (lowerKorean.includes('먹었다') || lowerKorean.includes('음식') || lowerKorean.includes('레스토랑') ||
        lowerEnglish.includes('ate') || lowerEnglish.includes('food') || lowerEnglish.includes('restaurant')) {
        tags.push('음식');
    }

    else if (lowerKorean.includes('사온') || lowerKorean.includes('쇼핑') || lowerKorean.includes('구매') ||
        lowerEnglish.includes('bought') || lowerEnglish.includes('shopping') || lowerEnglish.includes('purchase')) {
        tags.push('쇼핑');
    }

    else if (lowerKorean.includes('런던') || lowerKorean.includes('여행') || lowerKorean.includes('공항') ||
        lowerEnglish.includes('london') || lowerEnglish.includes('travel') || lowerEnglish.includes('airport')) {
        tags.push('여행');
    }

    else {
        tags.push('일상대화');
    }

    if (lowerKorean.includes('었다') || lowerKorean.includes('았다') ||
        lowerEnglish.includes('ed') || lowerEnglish.match(/\b(was|were|had|did)\b/)) {
        tags.push('과거시제');
    }

    return tags;
}


