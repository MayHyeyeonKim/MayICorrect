import { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Button,
  Alert,
  LinearProgress,
  IconButton,
  Tooltip,
  CircularProgress,
} from '@mui/material';
import { History, TrendingUp, School, Star, VolumeUp } from '@mui/icons-material';

interface CorrectionHistory {
  id: string;
  date: string;
  korean: string;
  userEnglish: string;
  correctedSentence: string;
  tags: string[];
  timestamp: Date;
}

interface DashboardProps {
  userName: string;
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
      correctedDiff.push({ type: 'added', text: originalCorrectedWords[correctedIndex] });
      correctedIndex++;
    } else if (correctedIndex >= correctedWords.length) {
      userDiff.push({ type: 'removed', text: originalUserWords[userIndex] });
      userIndex++;
    } else if (userWords[userIndex] === correctedWords[correctedIndex]) {
      userDiff.push({ type: 'same', text: originalUserWords[userIndex] });
      correctedDiff.push({ type: 'same', text: originalCorrectedWords[correctedIndex] });
      userIndex++;
      correctedIndex++;
    } else {
      let found = false;
      
      for (let i = correctedIndex; i < Math.min(correctedIndex + 3, correctedWords.length); i++) {
        if (userWords[userIndex] === correctedWords[i]) {
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
        let userFound = false;
        for (let i = userIndex; i < Math.min(userIndex + 3, userWords.length); i++) {
          if (correctedWords[correctedIndex] === userWords[i]) {
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
              padding: '1px 3px', 
              borderRadius: '2px',
              fontWeight: 'bold',
              fontSize: '0.875rem'
            };
            break;
          case 'added':
            style = { 
              backgroundColor: '#e8f5e8', 
              color: '#2e7d32', 
              padding: '1px 3px', 
              borderRadius: '2px',
              fontWeight: 'bold',
              fontSize: '0.875rem'
            };
            break;
          case 'removed':
            style = { 
              backgroundColor: '#ffebee', 
              color: '#c62828', 
              textDecoration: 'line-through',
              padding: '1px 3px', 
              borderRadius: '2px',
              fontSize: '0.875rem'
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

const Dashboard = ({ userName }: DashboardProps) => {
  const [history, setHistory] = useState<CorrectionHistory[]>([]);
  const [stats, setStats] = useState({
    totalCorrections: 0,
    thisWeek: 0,
    mostUsedCategory: '',
    improvementRate: 0,
  });
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);
  const [loadingAudio, setLoadingAudio] = useState<string | null>(null);

  useEffect(() => {
    const savedHistory = localStorage.getItem('correctionHistory');
    if (savedHistory) {
      const parsedHistory = JSON.parse(savedHistory).map((item: { 
        id: string; 
        date: string; 
        korean: string; 
        userEnglish: string; 
        correctedSentence: string; 
        tags: string[]; 
        timestamp: string; 
      }) => ({
        ...item,
        timestamp: new Date(item.timestamp)
      }));
      setHistory(parsedHistory);
      calculateStats(parsedHistory);
    }
  }, []);

  const calculateStats = (historyData: CorrectionHistory[]) => {
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    const thisWeekCorrections = historyData.filter(
      item => item.timestamp >= oneWeekAgo
    ).length;

    const categories = historyData.flatMap(item => item.tags);
    const categoryCount = categories.reduce((acc: Record<string, number>, cat) => {
      acc[cat] = (acc[cat] || 0) + 1;
      return acc;
    }, {});
    
    const mostUsed = Object.keys(categoryCount).reduce((a, b) => 
      categoryCount[a] > categoryCount[b] ? a : b, '일상대화'
    );

    setStats({
      totalCorrections: historyData.length,
      thisWeek: thisWeekCorrections,
      mostUsedCategory: mostUsed,
      improvementRate: Math.min(95, Math.floor((thisWeekCorrections / Math.max(1, historyData.length)) * 100)),
    });
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem('correctionHistory');
    setStats({
      totalCorrections: 0,
      thisWeek: 0,
      mostUsedCategory: '',
      improvementRate: 0,
    });
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
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
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main' }}>
          📊 {userName}님의 학습 대시보드
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          영어 교정 히스토리와 학습 통계를 확인해보세요!
        </Typography>
      </Box>

      {/* 통계 카드 */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ background: 'linear-gradient(135deg, #d63031 0%, #e17055 100%)', color: 'white' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
                    {stats.totalCorrections}
                  </Typography>
                  <Typography variant="body2">
                    총 교정 횟수
                  </Typography>
                </Box>
                <History sx={{ fontSize: 40, opacity: 0.8 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ background: 'linear-gradient(135deg, #fab1a0 0%, #fdcb6e 100%)', color: 'white' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
                    {stats.thisWeek}
                  </Typography>
                  <Typography variant="body2">
                    이번 주 교정
                  </Typography>
                </Box>
                <TrendingUp sx={{ fontSize: 40, opacity: 0.8 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ background: 'linear-gradient(135deg, #00b894 0%, #55a3ff 100%)', color: 'white' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h6" component="div" sx={{ fontWeight: 'bold' }}>
                    {stats.mostUsedCategory}
                  </Typography>
                  <Typography variant="body2">
                    자주 사용하는 분야
                  </Typography>
                </Box>
                <School sx={{ fontSize: 40, opacity: 0.8 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ background: 'linear-gradient(135deg, #6c5ce7 0%, #a29bfe 100%)', color: 'white' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
                    {stats.improvementRate}%
                  </Typography>
                  <Typography variant="body2">
                    학습 진도율
                  </Typography>
                </Box>
                <Star sx={{ fontSize: 40, opacity: 0.8 }} />
              </Box>
              <LinearProgress 
                variant="determinate" 
                value={stats.improvementRate} 
                sx={{ mt: 1, backgroundColor: 'rgba(255,255,255,0.3)' }}
              />
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* 교정 히스토리 */}
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h5" component="h2" sx={{ fontWeight: 'bold' }}>
              📝 교정 히스토리
            </Typography>
            {history.length > 0 && (
              <Button 
                variant="outlined" 
                color="error" 
                onClick={clearHistory}
                size="small"
              >
                히스토리 초기화
              </Button>
            )}
          </Box>

          {history.length === 0 ? (
            <Alert severity="info" sx={{ textAlign: 'center' }}>
              <Typography variant="body1">
                아직 교정 기록이 없습니다. 영어 교정을 받아보세요! 🚀
              </Typography>
            </Alert>
          ) : (
            <TableContainer component={Paper} sx={{ maxHeight: 600 }}>
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell><strong>날짜</strong></TableCell>
                    <TableCell><strong>한국어 원문</strong></TableCell>
                    <TableCell><strong>입력한 영어</strong></TableCell>
                    <TableCell><strong>교정된 영어</strong></TableCell>
                    <TableCell><strong>분야</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {history
                    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
                    .map((item) => (
                    <TableRow key={item.id} hover>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {formatDate(item.timestamp)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ maxWidth: 200, wordBreak: 'break-word' }}>
                          {item.korean}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ maxWidth: 200, wordBreak: 'break-word' }}>
                          <DiffText diff={createDiff(item.userEnglish, item.correctedSentence).userDiff} />
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body2" sx={{ maxWidth: 200, wordBreak: 'break-word', fontWeight: 'medium' }}>
                            <DiffText diff={createDiff(item.userEnglish, item.correctedSentence).correctedDiff} />
                          </Typography>
                          <Tooltip title="교정된 문장 듣기">
                            <IconButton
                              size="small"
                              onClick={() => speakText(item.correctedSentence)}
                              disabled={loadingAudio === item.correctedSentence}
                              sx={{ 
                                color: 'primary.main',
                                '&:hover': {
                                  backgroundColor: 'primary.light',
                                  color: 'white'
                                }
                              }}
                            >
                              {loadingAudio === item.correctedSentence ? (
                                <CircularProgress size={16} />
                              ) : (
                                <VolumeUp fontSize="small" />
                              )}
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {item.tags.map((tag, index) => (
                            <Chip
                              key={index}
                              label={tag}
                              size="small"
                              color="primary"
                              variant="outlined"
                            />
                          ))}
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>
    </Container>
  );
};

export default Dashboard;
