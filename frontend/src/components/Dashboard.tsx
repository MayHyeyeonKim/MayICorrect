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
} from '@mui/material';
import { History, TrendingUp, School, Star } from '@mui/icons-material';

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

const Dashboard = ({ userName }: DashboardProps) => {
  const [history, setHistory] = useState<CorrectionHistory[]>([]);
  const [stats, setStats] = useState({
    totalCorrections: 0,
    thisWeek: 0,
    mostUsedCategory: '',
    improvementRate: 0,
  });

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
                        <Typography variant="body2" sx={{ maxWidth: 200, wordBreak: 'break-word', color: 'error.main' }}>
                          {item.userEnglish}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ maxWidth: 200, wordBreak: 'break-word', color: 'success.main', fontWeight: 'medium' }}>
                          {item.correctedSentence}
                        </Typography>
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
