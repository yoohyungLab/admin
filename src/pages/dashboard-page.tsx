import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';

interface DashboardStats {
    totalTests: number;
    publishedTests: number;
    totalResponses: number;
    todayResponses: number;
}

interface RecentTest {
    id: string;
    title: string;
    createdAt: string;
    status: 'published' | 'draft';
    responseCount: number;
}

interface PopularTest {
    id: string;
    title: string;
    responseCount: number;
    rank: number;
}

export function DashboardPage() {
    const [stats, setStats] = useState<DashboardStats>({
        totalTests: 0,
        publishedTests: 0,
        totalResponses: 0,
        todayResponses: 0,
    });
    const [recentTests, setRecentTests] = useState<RecentTest[]>([]);
    const [popularTests, setPopularTests] = useState<PopularTest[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // 실제 데이터 로딩 시뮬레이션
        const loadDashboardData = async () => {
            setLoading(true);
            // 실제로는 API 호출
            await new Promise((resolve) => setTimeout(resolve, 1000));

            setStats({
                totalTests: 12,
                publishedTests: 8,
                totalResponses: 1234,
                todayResponses: 89,
            });

            setRecentTests([
                {
                    id: '1',
                    title: '🧠 MBTI 성향 테스트',
                    createdAt: '2024-01-15',
                    status: 'published',
                    responseCount: 456,
                },
                {
                    id: '2',
                    title: '❤️ 연애 성향 테스트',
                    createdAt: '2024-01-14',
                    status: 'draft',
                    responseCount: 0,
                },
                {
                    id: '3',
                    title: '💼 직업 성향 테스트',
                    createdAt: '2024-01-13',
                    status: 'published',
                    responseCount: 123,
                },
            ]);

            setPopularTests([
                {
                    id: '1',
                    title: '🧠 MBTI 성향 테스트',
                    responseCount: 456,
                    rank: 1,
                },
                {
                    id: '2',
                    title: '❤️ 연애 성향 테스트',
                    responseCount: 234,
                    rank: 2,
                },
                {
                    id: '3',
                    title: '💼 직업 성향 테스트',
                    responseCount: 123,
                    rank: 3,
                },
            ]);

            setLoading(false);
        };

        loadDashboardData();
    }, []);

    const getStatusBadge = (status: string) => {
        if (status === 'published') {
            return <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full font-medium">공개</span>;
        }
        return <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full font-medium">비공개</span>;
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

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">데이터를 불러오는 중...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* 헤더 */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">대시보드</h1>
                    <p className="text-gray-600 mt-2">유형연구소 관리자 대시보드입니다.</p>
                </div>
                <div className="flex space-x-3">
                    <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                        새 테스트 만들기
                    </button>
                    <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                        데이터 내보내기
                    </button>
                </div>
            </div>

            {/* 통계 카드 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="admin-card">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-gray-600">총 테스트</CardTitle>
                        <span className="text-2xl">📝</span>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-gray-900">{stats.totalTests}</div>
                        <p className="text-xs text-gray-500 mt-1">전체 테스트 수</p>
                    </CardContent>
                </Card>

                <Card className="admin-card">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-gray-600">공개 테스트</CardTitle>
                        <span className="text-2xl">✅</span>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-green-600">{stats.publishedTests}</div>
                        <p className="text-xs text-gray-500 mt-1">현재 공개 중</p>
                    </CardContent>
                </Card>

                <Card className="admin-card">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-gray-600">총 응답</CardTitle>
                        <span className="text-2xl">👥</span>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-blue-600">{stats.totalResponses.toLocaleString()}</div>
                        <p className="text-xs text-gray-500 mt-1">전체 응답 수</p>
                    </CardContent>
                </Card>

                <Card className="admin-card">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-gray-600">오늘 응답</CardTitle>
                        <span className="text-2xl">📊</span>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-purple-600">{stats.todayResponses}</div>
                        <p className="text-xs text-gray-500 mt-1">오늘 받은 응답</p>
                    </CardContent>
                </Card>
            </div>

            {/* 차트 및 리스트 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* 최근 테스트 */}
                <Card className="admin-card">
                    <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                            최근 생성된 테스트
                            <button className="text-sm text-blue-600 hover:text-blue-800">전체 보기</button>
                        </CardTitle>
                        <CardDescription>최근에 생성된 테스트 목록입니다.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {recentTests.map((test) => (
                                <div
                                    key={test.id}
                                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                    <div className="flex-1">
                                        <p className="font-medium text-gray-900">{test.title}</p>
                                        <div className="flex items-center space-x-4 mt-1">
                                            <p className="text-sm text-gray-500">{test.createdAt}</p>
                                            <p className="text-sm text-gray-500">{test.responseCount} 응답</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        {getStatusBadge(test.status)}
                                        <button className="text-gray-400 hover:text-gray-600">⋮</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* 인기 테스트 */}
                <Card className="admin-card">
                    <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                            인기 테스트
                            <button className="text-sm text-blue-600 hover:text-blue-800">전체 보기</button>
                        </CardTitle>
                        <CardDescription>응답이 많은 테스트 순위입니다.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {popularTests.map((test) => (
                                <div
                                    key={test.id}
                                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                    <div className="flex items-center space-x-4">
                                        <span className="text-2xl">{getRankIcon(test.rank)}</span>
                                        <div>
                                            <p className="font-medium text-gray-900">{test.title}</p>
                                            <p className="text-sm text-gray-500">{test.responseCount.toLocaleString()} 응답</p>
                                        </div>
                                    </div>
                                    <button className="text-gray-400 hover:text-gray-600">⋮</button>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* 추가 섹션 */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="admin-card">
                    <CardHeader>
                        <CardTitle>빠른 액션</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            <button className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                                <div className="flex items-center space-x-3">
                                    <span className="text-xl">➕</span>
                                    <div>
                                        <p className="font-medium">새 테스트 만들기</p>
                                        <p className="text-sm text-gray-500">새로운 테스트를 생성합니다</p>
                                    </div>
                                </div>
                            </button>
                            <button className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                                <div className="flex items-center space-x-3">
                                    <span className="text-xl">📊</span>
                                    <div>
                                        <p className="font-medium">통계 보기</p>
                                        <p className="text-sm text-gray-500">상세한 통계를 확인합니다</p>
                                    </div>
                                </div>
                            </button>
                        </div>
                    </CardContent>
                </Card>

                <Card className="admin-card lg:col-span-2">
                    <CardHeader>
                        <CardTitle>시스템 상태</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="text-center p-4 bg-green-50 rounded-lg">
                                <div className="text-2xl font-bold text-green-600">정상</div>
                                <p className="text-sm text-green-700">데이터베이스</p>
                            </div>
                            <div className="text-center p-4 bg-green-50 rounded-lg">
                                <div className="text-2xl font-bold text-green-600">정상</div>
                                <p className="text-sm text-green-700">API 서버</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
