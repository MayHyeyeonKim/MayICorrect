import { useState } from 'react';
import {
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Chip,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Stack,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Send as SendIcon,
  Refresh as RefreshIcon,
  CheckCircle as CheckCircleIcon,
  Lightbulb as LightbulbIcon,
  MenuBook as MenuBookIcon,
  Label as LabelIcon,
  AutoAwesome as AutoAwesomeIcon,
  VolumeUp as VolumeUpIcon,
} from '@mui/icons-material';

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

interface DiffResult {
  type: 'same' | 'changed' | 'added' | 'removed';
  text: string;
}

// 두 문장의 차이점을 비교하는 함수
const createDiff = (userText: string, correctedText: string): { userDiff: DiffResult[], correctedDiff: DiffResult[] } => {
  const userWords = userText.toLowerCase().split(/\s+/);
  const correctedWords = correctedText.toLowerCase().split(/\s+/);
  const originalUserWords = userText.split(/\s+/);
  const originalCorrectedWords = correctedText.split(/\s+/);
  
  const userDiff: DiffResult[] = [];
  const correctedDiff: DiffResult[] = [];
  
  let userIndex = 0;
  let correctedIndex = 0;
  
  while (userIndex < userWords.length || correctedIndex < correctedWords.length) {
    if (userIndex >= userWords.length) {
      // 교정된 문장에만 남은 단어들 (추가된 단어)
      correctedDiff.push({ type: 'added', text: originalCorrectedWords[correctedIndex] });
      correctedIndex++;
    } else if (correctedIndex >= correctedWords.length) {
      // 사용자 문장에만 남은 단어들 (삭제된 단어)
      userDiff.push({ type: 'removed', text: originalUserWords[userIndex] });
      userIndex++;
    } else if (userWords[userIndex] === correctedWords[correctedIndex]) {
      // 같은 단어
      userDiff.push({ type: 'same', text: originalUserWords[userIndex] });
      correctedDiff.push({ type: 'same', text: originalCorrectedWords[correctedIndex] });
      userIndex++;
      correctedIndex++;
    } else {
      // 다른 단어 - 간단한 휴리스틱으로 처리
      let found = false;
      
      // 교정된 문장에서 현재 사용자 단어를 찾아보기
      for (let i = correctedIndex; i < Math.min(correctedIndex + 3, correctedWords.length); i++) {
        if (userWords[userIndex] === correctedWords[i]) {
          // 중간에 추가된 단어들
          for (let j = correctedIndex; j < i; j++) {
            correctedDiff.push({ type: 'added', text: originalCorrectedWords[j] });
          }
          userDiff.push({ type: 'same', text: originalUserWords[userIndex] });
          correctedDiff.push({ type: 'same', text: originalCorrectedWords[i] });
          correctedIndex = i + 1;
          userIndex++;
          found = true;
          break;
        }
      }
      
      if (!found) {
        // 사용자 문장에서 현재 교정 단어를 찾아보기
        let userFound = false;
        for (let i = userIndex; i < Math.min(userIndex + 3, userWords.length); i++) {
          if (correctedWords[correctedIndex] === userWords[i]) {
            // 중간에 삭제된 단어들
            for (let j = userIndex; j < i; j++) {
              userDiff.push({ type: 'removed', text: originalUserWords[j] });
            }
            userDiff.push({ type: 'same', text: originalUserWords[i] });
            correctedDiff.push({ type: 'same', text: originalCorrectedWords[correctedIndex] });
            userIndex = i + 1;
            correctedIndex++;
            userFound = true;
            break;
          }
        }
        
        if (!userFound) {
          // 변경된 단어로 처리
          userDiff.push({ type: 'changed', text: originalUserWords[userIndex] });
          correctedDiff.push({ type: 'changed', text: originalCorrectedWords[correctedIndex] });
          userIndex++;
          correctedIndex++;
        }
      }
    }
  }
  
  return { userDiff, correctedDiff };
};

// Diff 결과를 렌더링하는 컴포넌트
const DiffText: React.FC<{ diff: DiffResult[] }> = ({ diff }) => {
  return (
    <span>
      {diff.map((item, index) => {
        let style: React.CSSProperties = {};
        
        switch (item.type) {
          case 'same':
            style = {};
            break;
          case 'changed':
            style = { 
              backgroundColor: '#ffebee', 
              color: '#c62828', 
              padding: '2px 4px', 
              borderRadius: '3px',
              fontWeight: 'bold'
            };
            break;
          case 'added':
            style = { 
              backgroundColor: '#e8f5e8', 
              color: '#2e7d32', 
              padding: '2px 4px', 
              borderRadius: '3px',
              fontWeight: 'bold'
            };
            break;
          case 'removed':
            style = { 
              backgroundColor: '#ffebee', 
              color: '#c62828', 
              textDecoration: 'line-through',
              padding: '2px 4px', 
              borderRadius: '3px'
            };
            break;
        }
        
        return (
          <span key={index} style={style}>
            {item.text}
            {index < diff.length - 1 ? ' ' : ''}
          </span>
        );
      })}
    </span>
  );
};

const EnglishTutor: React.FC = () => {
  const [korean, setKorean] = useState('');
  const [userEnglish, setUserEnglish] = useState('');
  const [result, setResult] = useState<CorrectionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);
  const [loadingAudio, setLoadingAudio] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!korean.trim() || !userEnglish.trim()) {
      setError('한국어 문장과 영어 번역을 모두 입력해주세요.');
      return;
    }

    setLoading(true);
    setError(null);
    
    const requestData = {
      korean: korean.trim(),
      userEnglish: userEnglish.trim(),
    };
    
    try {
      const response = await fetch('http://localhost:3001/api/correct', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`서버 오류: ${response.status} - ${errorText}`);
      }

      const data: CorrectionResult = await response.json();
      setResult(data);
      
      const historyItem = {
        id: Date.now().toString(),
        date: new Date().toISOString(),
        korean: korean.trim(),
        userEnglish: userEnglish.trim(),
        correctedSentence: data.correctedSentence,
        tags: data.tags,
        timestamp: new Date(),
      };

      const existingHistory = JSON.parse(localStorage.getItem('correctionHistory') || '[]');
      const updatedHistory = [historyItem, ...existingHistory].slice(0, 100);
      localStorage.setItem('correctionHistory', JSON.stringify(updatedHistory));
      
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        setError('서버에 연결할 수 없습니다. 백엔드 서버가 실행 중인지 확인해주세요.');
      } else {
        setError(`요청 처리 중 오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setKorean('');
    setUserEnglish('');
    setResult(null);
    setError(null);
  };

  const speakText = async (text: string) => {
    try {
      // 현재 재생 중인 오디오가 있으면 중지
      if (currentAudio) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
        setCurrentAudio(null);
      }

      // 로딩 시작
      setLoadingAudio(text);

      const response = await fetch('http://localhost:3001/api/speak', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          text: text,
          voice: 'nova' // 여성적이고 부드러운 음성 사용
        }),
      });

      if (!response.ok) {
        throw new Error(`TTS API 오류: ${response.status}`);
      }

      // 오디오 blob 생성
      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      
      // 새로운 오디오 객체 생성
      const audio = new Audio(audioUrl);
      setCurrentAudio(audio);
      
      // 로딩 완료
      setLoadingAudio(null);
      
      // 오디오 재생
      await audio.play();
      
      // 재생 완료 후 정리
      audio.addEventListener('ended', () => {
        URL.revokeObjectURL(audioUrl);
        setCurrentAudio(null);
      });

      // 오디오 에러 처리
      audio.addEventListener('error', () => {
        URL.revokeObjectURL(audioUrl);
        setCurrentAudio(null);
      });

    } catch (error) {
      console.error('TTS 오류:', error);
      alert('음성 재생 중 오류가 발생했습니다.');
      setCurrentAudio(null);
      setLoadingAudio(null);
    }
  };

  return (
    <Box>
      <Alert 
        severity="info" 
        sx={{ mb: 3 }}
        icon={<AutoAwesomeIcon />}
      >
        <Typography variant="body2">
          <strong>🚀 AI 영어 교정 시스템</strong>
          <br />
          한국어 문장과 영어 번역을 입력하면 AI가 자연스러운 영어로 교정해드립니다.
        </Typography>
      </Alert>
      {/* Input Section */}
      <Paper elevation={3} sx={{ p: 4, mb: 4 }}>
        <form onSubmit={handleSubmit}>
          <Stack spacing={3}>
            <TextField
              label="한국어 문장"
              multiline
              rows={3}
              value={korean}
              onChange={(e) => setKorean(e.target.value)}
              placeholder="예: 오늘 너무 피곤해서 아무것도 하기 싫었어"
              fullWidth
              variant="outlined"
            />

            <TextField
              label="나의 영어 번역"
              multiline
              rows={3}
              value={userEnglish}
              onChange={(e) => setUserEnglish(e.target.value)}
              placeholder="예: I was very tired today so I didn't want to do anything"
              fullWidth
              variant="outlined"
            />

            {error && (
              <Alert severity="error" onClose={() => setError(null)}>
                {error}
              </Alert>
            )}

            <Stack direction="row" spacing={2}>
              <Button
                type="submit"
                variant="contained"
                size="large"
                disabled={loading}
                startIcon={loading ? <CircularProgress size={20} /> : <SendIcon />}
                sx={{ flex: 1 }}
              >
                {loading ? '교정 중...' : '교정받기'}
              </Button>
              <Button
                type="button"
                variant="outlined"
                size="large"
                onClick={handleReset}
                startIcon={<RefreshIcon />}
              >
                초기화
              </Button>
            </Stack>
          </Stack>
        </form>
      </Paper>

      {/* Results Section */}
      {result && (
        <Stack spacing={3}>
          {/* Corrected Sentence */}
          <Card elevation={2}>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <CheckCircleIcon color="success" sx={{ mr: 1 }} />
                <Typography variant="h6" component="h3">
                  📝 Sentence Comparison
                </Typography>
              </Box>
              
              {/* Original User Input */}
              <Box mb={2}>
                <Typography variant="subtitle2" sx={{ mb: 1, color: 'text.secondary' }}>
                  Your Translation:
                </Typography>
                <Paper
                  sx={{
                    p: 2,
                    backgroundColor: '#fff3e0',
                    borderLeft: '4px solid #ff9800',
                  }}
                >
                  <Typography variant="body1" sx={{ lineHeight: 1.6 }}>
                    <DiffText diff={createDiff(userEnglish, result.correctedSentence).userDiff} />
                  </Typography>
                </Paper>
              </Box>

              {/* Corrected Sentence */}
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 1, color: 'text.secondary' }}>
                  Corrected Sentence:
                </Typography>
                <Paper
                  sx={{
                    p: 2,
                    backgroundColor: '#e8f5e8',
                    borderLeft: '4px solid #4caf50',
                  }}
                >
                  <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Typography variant="body1" sx={{ lineHeight: 1.6, flex: 1 }}>
                      <DiffText diff={createDiff(userEnglish, result.correctedSentence).correctedDiff} />
                    </Typography>
                    <Tooltip title="교정된 문장 듣기">
                      <IconButton
                        onClick={() => speakText(result.correctedSentence)}
                        disabled={loadingAudio === result.correctedSentence}
                        sx={{ 
                          ml: 2,
                          color: 'success.main',
                          backgroundColor: 'rgba(76, 175, 80, 0.1)',
                          '&:hover': {
                            backgroundColor: 'success.main',
                            color: 'white'
                          }
                        }}
                      >
                        {loadingAudio === result.correctedSentence ? (
                          <CircularProgress size={24} />
                        ) : (
                          <VolumeUpIcon />
                        )}
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Paper>
              </Box>
              
              {/* Legend */}
              <Box mt={2} display="flex" flexWrap="wrap" gap={1}>
                <Chip
                  size="small"
                  label="Changed"
                  sx={{ 
                    backgroundColor: '#ffebee', 
                    color: '#c62828',
                    fontWeight: 'bold'
                  }}
                />
                <Chip
                  size="small"
                  label="Added"
                  sx={{ 
                    backgroundColor: '#e8f5e8', 
                    color: '#2e7d32',
                    fontWeight: 'bold'
                  }}
                />
                <Chip
                  size="small"
                  label="Removed"
                  sx={{ 
                    backgroundColor: '#ffebee', 
                    color: '#c62828',
                    textDecoration: 'line-through'
                  }}
                />
              </Box>
            </CardContent>
          </Card>

          {/* Explanation */}
          <Card elevation={2}>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <LightbulbIcon color="warning" sx={{ mr: 1 }} />
                <Typography variant="h6" component="h3">
                  🔍 Explanation
                </Typography>
              </Box>
              <Stack spacing={1}>
                {result.explanation.map((item, index) => (
                  <Alert 
                    key={index} 
                    severity="info" 
                    variant="outlined"
                    icon={false}
                    sx={{ 
                      backgroundColor: '#fff3cd',
                      borderLeft: '4px solid #ffc107',
                      '& .MuiAlert-message': { width: '100%' }
                    }}
                  >
                    💡 {item}
                  </Alert>
                ))}
              </Stack>
            </CardContent>
          </Card>

          {/* Vocabulary */}
          {result.vocabulary.length > 0 && (
            <Card elevation={2}>
              <CardContent>
                <Box display="flex" alignItems="center" mb={2}>
                  <MenuBookIcon color="primary" sx={{ mr: 1 }} />
                  <Typography variant="h6" component="h3">
                    📘 Vocabulary & Idioms to Learn
                  </Typography>
                </Box>
                <TableContainer component={Paper} variant="outlined">
                  <Table>
                    <TableHead>
                      <TableRow sx={{ backgroundColor: '#1976d2' }}>
                        <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>
                          Expression
                        </TableCell>
                        <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>
                          Meaning
                        </TableCell>
                        <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>
                          Example Sentence
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {result.vocabulary.map((vocab, index) => (
                        <TableRow
                          key={index}
                          sx={{
                            '&:hover': { backgroundColor: '#e3f2fd' },
                            '&:nth-of-type(even)': { backgroundColor: '#f8f9fa' },
                          }}
                        >
                          <TableCell>
                            <Chip
                              label={vocab.expression}
                              variant="outlined"
                              color="primary"
                              sx={{ fontFamily: 'monospace', fontWeight: 'bold' }}
                            />
                          </TableCell>
                          <TableCell sx={{ color: '#2e7d32', fontWeight: 500 }}>
                            {vocab.meaning}
                          </TableCell>
                          <TableCell>
                            <Box display="flex" alignItems="center" justifyContent="space-between">
                              <Typography 
                                variant="body2" 
                                sx={{ fontStyle: 'italic', color: '#666', flex: 1 }}
                              >
                                {vocab.example}
                              </Typography>
                              <Tooltip title="예시 문장 듣기">
                                <IconButton
                                  size="small"
                                  onClick={() => speakText(vocab.example)}
                                  disabled={loadingAudio === vocab.example}
                                  sx={{ 
                                    ml: 1,
                                    color: 'primary.main',
                                    '&:hover': {
                                      backgroundColor: 'primary.light',
                                      color: 'white'
                                    }
                                  }}
                                >
                                  {loadingAudio === vocab.example ? (
                                    <CircularProgress size={16} />
                                  ) : (
                                    <VolumeUpIcon fontSize="small" />
                                  )}
                                </IconButton>
                              </Tooltip>
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          )}

          {/* Tags */}
          <Card elevation={2}>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <LabelIcon color="secondary" sx={{ mr: 1 }} />
                <Typography variant="h6" component="h3">
                  🏷️ Suggested Tags
                </Typography>
              </Box>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                {result.tags.map((tag, index) => (
                  <Chip
                    key={index}
                    label={`[${tag}]`}
                    variant="filled"
                    sx={{
                      background: 'linear-gradient(135deg, #6f42c1, #5a32a3)',
                      color: 'white',
                      fontWeight: 500,
                    }}
                  />
                ))}
              </Stack>
            </CardContent>
          </Card>
        </Stack>
      )}
    </Box>
  );
};

export default EnglishTutor;