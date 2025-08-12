import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { supabase } from '../lib/supabase';

// ========================================
// 타입 정의
// ========================================

interface DashboardStats {
    // 서비스 현황
    totalTests: number;
    publishedTests: number;
    todayResponses: number;
    weeklyResponses: number;
    todayVisitors: number;
    activeUsers7Days: number;

    // 성과 지표
    avgCompletionTime: number;
    totalCompletions: number;
    weeklyCompletionRate: number;
}

interface PopularTest {
    id: string;
    title: string;
    category: string;
    thumbnailUrl?: string;
    recentResponses: number;
    totalResponses: number;
    conversionRate: number;
    rank: number;
}

interface ChannelAnalytics {
    channel: string;
    visitors: number;
    percentage: number;
    trend: 'up' | 'down' | 'stable';
}

interface AlertItem {
    id: string;
    type: 'error' | 'warning' | 'info' | 'security';
    title: string;
    message: string;
    severity: number;
    createdAt: string;
    status: 'active' | 'acknowledged' | 'resolved';
}

interface SystemHealth {
    database: 'healthy' | 'warning' | 'error';
    api: 'healthy' | 'warning' | 'error';
    storage: 'healthy' | 'warning' | 'error';
    avgResponseTime: number;
    errorCount: number;
}

interface UserSegment {
    segment: string;
    percentage: number;
    change: number; // 전주 대비 변화율
}

// ========================================
// 메인 대시보드 컴포넌트
// ========================================

export function DashboardPage() {
    const [stats, setStats] = useState<DashboardStats>({
        totalTests: 0,
        publishedTests: 0,
        todayResponses: 0,
        weeklyResponses: 0,
        todayVisitors: 0,
        activeUsers7Days: 0,
        avgCompletionTime: 0,
        totalCompletions: 0,
        weeklyCompletionRate: 0,
    });

    const [popularTests, setPopularTests] = useState<PopularTest[]>([]);
    const [channelAnalytics, setChannelAnalytics] = useState<ChannelAnalytics[]>([]);
    const [alerts, setAlerts] = useState<AlertItem[]>([]);
    const [systemHealth, setSystemHealth] = useState<SystemHealth>({
        database: 'healthy',
        api: 'healthy',
        storage: 'healthy',
        avgResponseTime: 0,
        errorCount: 0,
    });
    const [userSegments, setUserSegments] = useState<UserSegment[]>([]);
    const [loading, setLoading] = useState(true);
    const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

    // ========================================
    // 데이터 로딩 함수들
    // ========================================

    const loadDashboardStats = async () => {
        try {
            // 1. 전체 테스트 통계
            const { data: testStats } = await supabase.from('tests').select('status').in('status', ['published', 'draft', 'archived']);

            const totalTests = testStats?.length || 0;
            const publishedTests = testStats?.filter((t) => t.status === 'published').length || 0;

            // 2. 오늘 응답 수
            const today = new Date().toISOString().split('T')[0];
            const { data: todayResponses } = await supabase
                .from('test_responses')
                .select('id')
                .gte('started_at', `${today}T00:00:00`)
                .lt('started_at', `${today}T23:59:59`);

            // 3. 이번 주 응답 수
            const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
            const { data: weeklyResponses } = await supabase.from('test_responses').select('id, status').gte('started_at', weekAgo);

            // 4. 오늘 방문자 수
            const { data: todayAnalytics } = await supabase
                .from('daily_analytics')
                .select('unique_visitors')
                .eq('date', today)
                .is('hour', null)
                .single();

            // 5. 활성 사용자 (7일)
            const { data: activeUsers } = await supabase
                .from('test_responses')
                .select('user_id, session_id')
                .gte('started_at', weekAgo)
                .not('user_id', 'is', null);

            // 6. 평균 완료 시간 및 완료율
            const { data: completionStats } = await supabase
                .from('test_responses')
                .select('total_time_seconds, status')
                .eq('status', 'completed')
                .not('total_time_seconds', 'is', null);

            const avgCompletionTime =
                completionStats && completionStats.length > 0
                    ? Math.round(completionStats.reduce((acc, r) => acc + (r.total_time_seconds || 0), 0) / completionStats.length)
                    : 0;

            const weeklyCompletions = weeklyResponses?.filter((r) => r.status === 'completed').length || 0;
            const weeklyStarts = weeklyResponses?.length || 1;
            const weeklyCompletionRate = Math.round((weeklyCompletions / weeklyStarts) * 100);

            setStats({
                totalTests,
                publishedTests,
                todayResponses: todayResponses?.length || 0,
                weeklyResponses: weeklyResponses?.length || 0,
                todayVisitors: todayAnalytics?.unique_visitors || 0,
                activeUsers7Days: new Set(activeUsers?.map((u) => u.user_id || u.session_id)).size,
                avgCompletionTime,
                totalCompletions: completionStats?.length || 0,
                weeklyCompletionRate,
            });
        } catch (error) {
            console.error('통계 데이터 로딩 실패:', error);
        }
    };

    const loadPopularTests = async () => {
        try {
            const { data: popularTestsData } = await supabase.from('popular_tests_7days').select('*').limit(5);

            if (popularTestsData) {
                const formattedTests: PopularTest[] = popularTestsData.map((test, index) => ({
                    id: test.id,
                    title: test.title,
                    category: test.category,
                    thumbnailUrl: test.thumbnail_url,
                    recentResponses: test.recent_responses,
                    totalResponses: test.total_responses,
                    conversionRate: test.conversion_rate,
                    rank: index + 1,
                }));
                setPopularTests(formattedTests);
            }
        } catch (error) {
            console.error('인기 테스트 데이터 로딩 실패:', error);
        }
    };

    const loadChannelAnalytics = async () => {
        try {
            // 최근 7일 채널별 데이터 집계
            const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

            const { data: analyticsData } = await supabase
                .from('daily_analytics')
                .select('traffic_sources')
                .gte('date', weekAgo)
                .is('hour', null);

            if (analyticsData) {
                const channelTotals: Record<string, number> = {};
                let totalVisitors = 0;

                analyticsData.forEach((day) => {
                    const sources = day.traffic_sources as Record<string, number>;
                    Object.entries(sources).forEach(([channel, count]) => {
                        channelTotals[channel] = (channelTotals[channel] || 0) + count;
                        totalVisitors += count;
                    });
                });

                const channelData: ChannelAnalytics[] = Object.entries(channelTotals)
                    .map(([channel, visitors]) => ({
                        channel,
                        visitors,
                        percentage: Math.round((visitors / totalVisitors) * 100),
                        trend: 'stable' as const, // 실제로는 전주 대비 계산 필요
                    }))
                    .sort((a, b) => b.visitors - a.visitors);

                setChannelAnalytics(channelData);
            }
        } catch (error) {
            console.error('채널 분석 데이터 로딩 실패:', error);
        }
    };

    const loadAlerts = async () => {
        try {
            const { data: alertsData } = await supabase
                .from('admin_alerts')
                .select('*')
                .eq('status', 'active')
                .order('severity', { ascending: false })
                .order('created_at', { ascending: false })
                .limit(5);

            if (alertsData) {
                setAlerts(alertsData);
            }
        } catch (error) {
            console.error('알림 데이터 로딩 실패:', error);
        }
    };

    const loadSystemHealth = async () => {
        try {
            const { data: healthData } = await supabase
                .from('system_health')
                .select('*')
                .order('timestamp', { ascending: false })
                .limit(1)
                .single();

            if (healthData) {
                setSystemHealth({
                    database: healthData.database_status,
                    api: healthData.api_status,
                    storage: healthData.storage_status,
                    avgResponseTime: healthData.avg_response_time_ms,
                    errorCount: healthData.error_count,
                });
            }
        } catch (error) {
            console.error('시스템 상태 데이터 로딩 실패:', error);
        }
    };

    const loadUserSegments = async () => {
        try {
            // 간단한 세그먼트 분석 (실제로는 더 복잡한 로직 필요)
            const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

            const { data: segmentData } = await supabase
                .from('test_responses')
                .select('device_type, result_type')
                .gte('started_at', weekAgo)
                .not('device_type', 'is', null);

            if (segmentData) {
                const deviceCounts: Record<string, number> = {};
                segmentData.forEach((response) => {
                    deviceCounts[response.device_type] = (deviceCounts[response.device_type] || 0) + 1;
                });

                const total = segmentData.length;
                const segments: UserSegment[] = Object.entries(deviceCounts).map(([device, count]) => ({
                    segment: `${device} 사용자`,
                    percentage: Math.round((count / total) * 100),
                    change: Math.random() * 10 - 5, // 실제로는 전주 대비 계산
                }));

                setUserSegments(segments);
            }
        } catch (error) {
            console.error('사용자 세그먼트 데이터 로딩 실패:', error);
        }
    };

    // ========================================
    // 데이터 로딩 및 새로고침
    // ========================================

    const loadAllData = async () => {
        setLoading(true);
        try {
            await Promise.all([
                loadDashboardStats(),
                loadPopularTests(),
                loadChannelAnalytics(),
                loadAlerts(),
                loadSystemHealth(),
                loadUserSegments(),
            ]);
            setLastUpdated(new Date());
        } catch (error) {
            console.error('대시보드 데이터 로딩 실패:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadAllData();

        // 5분마다 자동 새로고침
        const interval = setInterval(() => {
            loadAllData();
        }, 5 * 60 * 1000);

        return () => clearInterval(interval);
    }, []);

    // ========================================
    // 유틸리티 함수들
    // ========================================

    const formatTime = (seconds: number) => {
        const minutes = Math.floor(seconds / 60);
        return `${minutes}분 ${seconds % 60}초`;
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'healthy':
                return 'text-green-600 bg-green-50';
            case 'warning':
                return 'text-yellow-600 bg-yellow-50';
            case 'error':
                return 'text-red-600 bg-red-50';
            default:
                return 'text-gray-600 bg-gray-50';
        }
    };

    const getSeverityIcon = (severity: number) => {
        if (severity >= 4) return '🚨';
        if (severity >= 3) return '⚠️';
        if (severity >= 2) return '💡';
        return 'ℹ️';
    };

    const getRankIcon = (rank: number) => {
        switch (rank) {
            case 1:
                return '🥇';
            case 2:
                return '🥈';
            case 3:
                return '🥉';
            default:
                return `${rank}`;
        }
    };

    const getTrendIcon = (trend: string) => {
        switch (trend) {
            case 'up':
                return '📈';
            case 'down':
                return '📉';
            default:
                return '📊';
        }
    };

    // ========================================
    // 로딩 상태 처리
    // ========================================

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">대시보드 데이터를 불러오는 중...</p>
                </div>
            </div>
        );
    }

    // ========================================
    // 메인 렌더링
    // ========================================

    return (
        <div className="space-y-6 p-6">
            {/* 헤더 영역 */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">📊 운영 대시보드</h1>
                    <p className="text-gray-600 mt-2">유형연구소 서비스 현황을 한눈에 확인하세요</p>
                    <p className="text-sm text-gray-500 mt-1">마지막 업데이트: {lastUpdated.toLocaleTimeString()}</p>
                </div>
                <div className="flex space-x-3">
                    <button
                        onClick={loadAllData}
                        className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        🔄 새로고침
                    </button>
                    <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
                        ➕ 새 테스트 만들기
                    </button>
                </div>
            </div>

            {/* A. 서비스 현황 - 상위 통계 카드들 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="border-l-4 border-l-blue-500">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-gray-600">총 테스트</CardTitle>
                        <span className="text-2xl">📝</span>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-gray-900">{stats.totalTests}</div>
                        <p className="text-xs text-green-600 mt-1">공개 {stats.publishedTests}개</p>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-green-500">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-gray-600">오늘 신규 응답</CardTitle>
                        <span className="text-2xl">✨</span>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-green-600">{stats.todayResponses}</div>
                        <p className="text-xs text-gray-500 mt-1">이번 주 {stats.weeklyResponses}개</p>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-purple-500">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-gray-600">오늘 방문자</CardTitle>
                        <span className="text-2xl">👥</span>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-purple-600">{stats.todayVisitors}</div>
                        <p className="text-xs text-gray-500 mt-1">7일 활성 {stats.activeUsers7Days}명</p>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-orange-500">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-gray-600">완료율</CardTitle>
                        <span className="text-2xl">🎯</span>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-orange-600">{stats.weeklyCompletionRate}%</div>
                        <p className="text-xs text-gray-500 mt-1">평균 {formatTime(stats.avgCompletionTime)}</p>
                    </CardContent>
                </Card>
            </div>

            {/* 알림 영역 - 긴급 이슈 */}
            {alerts.length > 0 && (
                <Card className="border-l-4 border-l-red-500 bg-red-50">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-red-800">
                            🚨 운영 알림
                            <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">{alerts.length}개</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {alerts.slice(0, 3).map((alert) => (
                                <div key={alert.id} className="flex items-center justify-between p-3 bg-white rounded border">
                                    <div className="flex items-center gap-3">
                                        <span className="text-lg">{getSeverityIcon(alert.severity)}</span>
                                        <div>
                                            <p className="font-medium text-gray-900">{alert.title}</p>
                                            <p className="text-sm text-gray-600">{alert.message}</p>
                                        </div>
                                    </div>
                                    <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">확인</button>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* B. 테스트 성과 및 C. 마케팅 데이터 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* 인기 테스트 TOP 5 */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                            🏆 인기 테스트 TOP 5<span className="text-sm text-gray-500">(최근 7일)</span>
                        </CardTitle>
                        <CardDescription>응답 수와 전환율 기준 순위</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {popularTests.map((test) => (
                                <div
                                    key={test.id}
                                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                    <div className="flex items-center gap-4">
                                        <span className="text-2xl">{getRankIcon(test.rank)}</span>
                                        <div className="flex-1">
                                            <p className="font-medium text-gray-900">{test.title}</p>
                                            <div className="flex items-center gap-4 mt-1">
                                                <span className="text-sm text-gray-500">신규 {test.recentResponses}명</span>
                                                <span className="text-sm text-green-600 font-medium">전환 {test.conversionRate}%</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-medium">{test.totalResponses.toLocaleString()}</p>
                                        <p className="text-xs text-gray-500">총 응답</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* 유입 채널별 분석 */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">📈 채널별 유입 분석</CardTitle>
                        <CardDescription>최근 7일 방문자 유입 경로</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {channelAnalytics.map((channel) => (
                                <div key={channel.channel} className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <span className="text-lg">{getTrendIcon(channel.trend)}</span>
                                        <div>
                                            <p className="font-medium capitalize">{channel.channel}</p>
                                            <p className="text-sm text-gray-500">{channel.visitors}명 방문</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-lg font-bold text-blue-600">{channel.percentage}%</span>
                                        <div className="w-20 bg-gray-200 rounded-full h-2 mt-1">
                                            <div
                                                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                                style={{ width: `${channel.percentage}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* 하단 영역: 시스템 상태 및 인사이트 */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* 시스템 상태 */}
                <Card>
                    <CardHeader>
                        <CardTitle>🔧 시스템 상태</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">데이터베이스</span>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(systemHealth.database)}`}>
                                    {systemHealth.database === 'healthy' ? '정상' : '문제'}
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">API 서버</span>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(systemHealth.api)}`}>
                                    {systemHealth.api === 'healthy' ? '정상' : '문제'}
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">스토리지</span>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(systemHealth.storage)}`}>
                                    {systemHealth.storage === 'healthy' ? '정상' : '문제'}
                                </span>
                            </div>
                            <div className="pt-2 border-t">
                                <div className="text-sm text-gray-600">
                                    평균 응답속도: <span className="font-medium">{systemHealth.avgResponseTime}ms</span>
                                </div>
                                <div className="text-sm text-gray-600">
                                    오늘 오류: <span className="font-medium">{systemHealth.errorCount}건</span>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* 사용자 세그먼트 인사이트 */}
                <Card>
                    <CardHeader>
                        <CardTitle>👤 사용자 분석</CardTitle>
                        <CardDescription>최근 7일 사용자 세그먼트</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {userSegments.map((segment, index) => (
                                <div key={index} className="flex items-center justify-between">
                                    <span className="text-sm font-medium">{segment.segment}</span>
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-bold">{segment.percentage}%</span>
                                        <span className={`text-xs ${segment.change > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                            {segment.change > 0 ? '↗' : '↘'} {Math.abs(segment.change).toFixed(1)}%
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* 빠른 액션 */}
                <Card>
                    <CardHeader>
                        <CardTitle>⚡ 빠른 액션</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            <button className="w-full text-left p-4 border-2 border-dashed border-blue-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors">
                                <div className="flex items-center gap-3">
                                    <span className="text-2xl">➕</span>
                                    <div>
                                        <p className="font-medium text-blue-700">새 테스트 만들기</p>
                                        <p className="text-sm text-blue-600">템플릿으로 빠르게 생성</p>
                                    </div>
                                </div>
                            </button>
                            <button className="w-full text-left p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                                <div className="flex items-center gap-3">
                                    <span className="text-2xl">📊</span>
                                    <div>
                                        <p className="font-medium">상세 통계 보기</p>
                                        <p className="text-sm text-gray-500">월간/연간 리포트</p>
                                    </div>
                                </div>
                            </button>
                            <button className="w-full text-left p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                                <div className="flex items-center gap-3">
                                    <span className="text-2xl">📤</span>
                                    <div>
                                        <p className="font-medium">데이터 내보내기</p>
                                        <p className="text-sm text-gray-500">CSV, Excel 형식</p>
                                    </div>
                                </div>
                            </button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
