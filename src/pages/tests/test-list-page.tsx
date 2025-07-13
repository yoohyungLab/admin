import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { testApi } from '../../lib/supabase';
import type { Test } from '../../types/test';

export function TestListPage() {
    const [tests, setTests] = useState<Test[]>([]);
    const [filteredTests, setFilteredTests] = useState<Test[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft'>('all');
    const [sortBy, setSortBy] = useState<'createdAt' | 'title' | 'responseCount'>('createdAt');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

    useEffect(() => {
        loadTests();
    }, []);

    useEffect(() => {
        filterAndSortTests();
    }, [tests, searchTerm, statusFilter, sortBy, sortOrder]);

    const loadTests = async () => {
        try {
            const data = await testApi.getAllTests();
            setTests(data);
        } catch (error) {
            console.error('테스트 목록을 불러오는데 실패했습니다:', error);
        } finally {
            setLoading(false);
        }
    };

    const filterAndSortTests = () => {
        const filtered = tests.filter((test) => {
            const matchesSearch =
                test.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                test.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                test.category.toLowerCase().includes(searchTerm.toLowerCase());

            const matchesStatus =
                statusFilter === 'all' ||
                (statusFilter === 'published' && test.isPublished) ||
                (statusFilter === 'draft' && !test.isPublished);

            return matchesSearch && matchesStatus;
        });

        // 정렬
        filtered.sort((a, b) => {
            let aValue: string | number, bValue: string | number;

            switch (sortBy) {
                case 'title':
                    aValue = a.title.toLowerCase();
                    bValue = b.title.toLowerCase();
                    break;
                case 'responseCount':
                    aValue = 0; // responseCount는 아직 구현되지 않음
                    bValue = 0;
                    break;
                case 'createdAt':
                default:
                    aValue = new Date(a.createdAt).getTime();
                    bValue = new Date(b.createdAt).getTime();
                    break;
            }

            if (sortOrder === 'asc') {
                return aValue > bValue ? 1 : -1;
            } else {
                return aValue < bValue ? 1 : -1;
            }
        });

        setFilteredTests(filtered);
    };

    const handleTogglePublish = async (testId: string, currentStatus: boolean) => {
        try {
            await testApi.togglePublishStatus(testId, !currentStatus);
            await loadTests();
        } catch (error) {
            console.error('상태 변경에 실패했습니다:', error);
        }
    };

    const handleDelete = async (testId: string) => {
        if (window.confirm('정말로 이 테스트를 삭제하시겠습니까?')) {
            try {
                await testApi.deleteTest(testId);
                await loadTests();
            } catch (error) {
                console.error('테스트 삭제에 실패했습니다:', error);
            }
        }
    };

    const getStatusBadge = (isPublished: boolean) => {
        if (isPublished) {
            return <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full font-medium">공개</span>;
        }
        return <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full font-medium">비공개</span>;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">테스트 목록을 불러오는 중...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* 헤더 */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">테스트 관리</h1>
                    <p className="text-gray-600 mt-2">모든 테스트를 관리하고 모니터링할 수 있습니다.</p>
                </div>
                <Link to="/tests/create">
                    <Button className="bg-blue-600 hover:bg-blue-700">
                        <span className="mr-2">➕</span>새 테스트 생성
                    </Button>
                </Link>
            </div>

            {/* 필터 및 검색 */}
            <Card className="admin-card">
                <CardContent className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        {/* 검색 */}
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-2">검색</label>
                            <input
                                type="text"
                                placeholder="테스트 제목, 설명, 카테고리로 검색..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>

                        {/* 상태 필터 */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">상태</label>
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value as 'all' | 'published' | 'draft')}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="all">전체</option>
                                <option value="published">공개</option>
                                <option value="draft">비공개</option>
                            </select>
                        </div>

                        {/* 정렬 */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">정렬</label>
                            <select
                                value={`${sortBy}-${sortOrder}`}
                                onChange={(e) => {
                                    const [sort, order] = e.target.value.split('-');
                                    setSortBy(sort as 'createdAt' | 'title' | 'responseCount');
                                    setSortOrder(order as 'asc' | 'desc');
                                }}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="createdAt-desc">최신순</option>
                                <option value="createdAt-asc">오래된순</option>
                                <option value="title-asc">제목순</option>
                                <option value="responseCount-desc">응답순</option>
                            </select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* 통계 */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="admin-card">
                    <CardContent className="p-4">
                        <div className="text-center">
                            <div className="text-2xl font-bold text-blue-600">{tests.length}</div>
                            <p className="text-sm text-gray-600">전체 테스트</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="admin-card">
                    <CardContent className="p-4">
                        <div className="text-center">
                            <div className="text-2xl font-bold text-green-600">{tests.filter((t) => t.isPublished).length}</div>
                            <p className="text-sm text-gray-600">공개 테스트</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="admin-card">
                    <CardContent className="p-4">
                        <div className="text-center">
                            <div className="text-2xl font-bold text-yellow-600">{tests.filter((t) => !t.isPublished).length}</div>
                            <p className="text-sm text-gray-600">비공개 테스트</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="admin-card">
                    <CardContent className="p-4">
                        <div className="text-center">
                            <div className="text-2xl font-bold text-purple-600">0</div>
                            <p className="text-sm text-gray-600">총 응답</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* 테스트 목록 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredTests.map((test) => (
                    <Card key={test.id} className="admin-card hover:shadow-lg transition-all duration-200">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle className="flex items-center space-x-2">
                                    <span className="text-2xl">{test.emoji}</span>
                                    <span className="text-lg">{test.title}</span>
                                </CardTitle>
                                {getStatusBadge(test.isPublished)}
                            </div>
                            <CardDescription className="text-sm">{test.description}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">카테고리:</span>
                                        <span className="font-medium">{test.category}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">질문 수:</span>
                                        <span className="font-medium">{test.questions.length}개</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">결과 수:</span>
                                        <span className="font-medium">{test.results.length}개</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">응답 수:</span>
                                        <span className="font-medium">0</span>
                                    </div>
                                </div>

                                <div className="text-xs text-gray-500 pt-2 border-t">
                                    생성일: {new Date(test.createdAt).toLocaleDateString('ko-KR')}
                                </div>

                                <div className="flex space-x-2 pt-3">
                                    <Link to={`/tests/${test.id}/edit`} className="flex-1">
                                        <Button variant="outline" size="sm" className="w-full">
                                            ✏️ 수정
                                        </Button>
                                    </Link>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleTogglePublish(test.id, test.isPublished)}
                                        className="flex-1"
                                    >
                                        {test.isPublished ? '🔒 비공개' : '🌐 공개'}
                                    </Button>
                                    <Button variant="destructive" size="sm" onClick={() => handleDelete(test.id)} className="flex-1">
                                        🗑️ 삭제
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* 빈 상태 */}
            {filteredTests.length === 0 && (
                <Card className="admin-card">
                    <CardContent className="flex flex-col items-center justify-center py-12">
                        <div className="text-6xl mb-4">📝</div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">
                            {searchTerm || statusFilter !== 'all' ? '검색 결과가 없습니다' : '아직 생성된 테스트가 없습니다'}
                        </h3>
                        <p className="text-gray-500 mb-6 text-center">
                            {searchTerm || statusFilter !== 'all'
                                ? '다른 검색어나 필터를 시도해보세요'
                                : '첫 번째 테스트를 생성하고 시작해보세요'}
                        </p>
                        <Link to="/tests/create">
                            <Button className="bg-blue-600 hover:bg-blue-700">
                                <span className="mr-2">➕</span>첫 번째 테스트 생성하기
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
