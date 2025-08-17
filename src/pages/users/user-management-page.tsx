import { Clock, Download, Eye, Search, Trash2, UserCheck, Users, UserX } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { profileApi, type Profile, type ProfileFilters, type ProfileStats, type ProfileWithActivity } from '../../lib/supabase';

export function UserManagementPage() {
    // State
    const [profiles, setProfiles] = useState<Profile[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedProfile, setSelectedProfile] = useState<ProfileWithActivity | null>(null);
    const [showProfileModal, setShowProfileModal] = useState(false);
    const [showFilters, setShowFilters] = useState(false);
    const [selectedProfiles, setSelectedProfiles] = useState<string[]>([]);

    // Filters
    const [filters, setFilters] = useState<ProfileFilters>({});
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [providerFilter, setProviderFilter] = useState<string>('all');

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalProfiles, setTotalProfiles] = useState(0);

    // Stats
    const [stats, setStats] = useState<ProfileStats>({
        total: 0,
        active: 0,
        inactive: 0,
        deleted: 0,
        today: 0,
        this_week: 0,
        this_month: 0,
        email_signups: 0,
        google_signups: 0,
        kakao_signups: 0,
    });

    // Effects
    useEffect(() => {
        console.log('UserManagementPage mounted');
        loadProfiles();
        loadStats();
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            setFilters((prev) => ({
                ...prev,
                search: searchTerm || undefined,
            }));
            setCurrentPage(1);
        }, 300);

        return () => clearTimeout(timer);
    }, [searchTerm]);

    useEffect(() => {
        if (filters.search !== undefined) {
            loadProfiles();
        }
    }, [filters]);

    // API calls
    const loadProfiles = async () => {
        console.log('Loading profiles...');
        setLoading(true);
        setError(null);

        try {
            const currentFilters: ProfileFilters = {
                search: filters.search,
                status: statusFilter !== 'all' ? (statusFilter as Profile['status']) : 'all',
                provider: providerFilter !== 'all' ? providerFilter : 'all',
            };

            console.log('Current filters:', currentFilters);
            console.log('Current page:', currentPage);

            const data = await profileApi.getProfiles(currentFilters, currentPage, 20);
            console.log('Profiles data:', data);

            setProfiles(data.profiles);
            setTotalPages(data.totalPages);
            setTotalProfiles(data.total);
        } catch (error) {
            console.error('프로필 목록 로딩 실패:', error);
            setError(error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.');
        } finally {
            setLoading(false);
        }
    };

    const loadStats = async () => {
        console.log('Loading stats...');
        try {
            const statsData = await profileApi.getProfileStats();
            console.log('Stats data:', statsData);
            setStats(statsData);
        } catch (error) {
            console.error('통계 로딩 실패:', error);
        }
    };

    // Event handlers
    const handleStatusChange = async (profileId: string, newStatus: Profile['status']) => {
        try {
            await profileApi.updateProfileStatus(profileId, newStatus);
            loadProfiles();
            loadStats();
        } catch (error) {
            console.error('상태 변경 실패:', error);
        }
    };

    const handleBulkStatusChange = async (status: Profile['status']) => {
        if (selectedProfiles.length === 0) return;

        try {
            await profileApi.bulkUpdateStatus(selectedProfiles, status);
            setSelectedProfiles([]);
            loadProfiles();
            loadStats();
        } catch (error) {
            console.error('대량 상태 변경 실패:', error);
        }
    };

    const handleDeleteProfile = async (profileId: string) => {
        if (!confirm('정말로 이 사용자를 탈퇴 처리하시겠습니까?')) return;

        try {
            await profileApi.deleteProfile(profileId);
            loadProfiles();
            loadStats();
        } catch (error) {
            console.error('탈퇴 처리 실패:', error);
        }
    };

    const handleExportProfiles = async () => {
        try {
            const currentFilters: ProfileFilters = {
                search: filters.search,
                status: statusFilter !== 'all' ? (statusFilter as Profile['status']) : 'all',
                provider: providerFilter !== 'all' ? providerFilter : 'all',
            };

            const exportData = await profileApi.exportProfiles(currentFilters);
            const csvContent = convertToCSV(exportData);
            downloadCSV(csvContent, 'profiles_export.csv');
        } catch (error) {
            console.error('내보내기 실패:', error);
        }
    };

    // Utility functions
    const convertToCSV = (data: Profile[]) => {
        const headers = ['ID', '이메일', '이름', '가입경로', '상태', '가입일', '최근수정일'];

        const rows = data.map((profile) => [
            profile.id,
            profile.email,
            profile.name,
            profile.provider || '이메일',
            profile.status,
            new Date(profile.created_at).toLocaleDateString('ko-KR'),
            new Date(profile.updated_at).toLocaleDateString('ko-KR'),
        ]);

        return [headers, ...rows].map((row) => row.map((field) => `"${field}"`).join(',')).join('\n');
    };

    const downloadCSV = (content: string, filename: string) => {
        const blob = new Blob(['\uFEFF' + content], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        link.click();
    };

    const getStatusIcon = (status: Profile['status']) => {
        switch (status) {
            case 'active':
                return <UserCheck className="w-4 h-4 text-green-600" />;
            case 'inactive':
                return <Clock className="w-4 h-4 text-yellow-600" />;
            case 'deleted':
                return <UserX className="w-4 h-4 text-red-600" />;
            default:
                return <Clock className="w-4 h-4 text-gray-600" />;
        }
    };

    const getStatusColor = (status: Profile['status']) => {
        switch (status) {
            case 'active':
                return 'bg-green-100 text-green-800';
            case 'inactive':
                return 'bg-yellow-100 text-yellow-800';
            case 'deleted':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const getStatusText = (status: Profile['status']) => {
        switch (status) {
            case 'active':
                return '활성';
            case 'inactive':
                return '비활성';
            case 'deleted':
                return '탈퇴';
            default:
                return '알수없음';
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    // Debug info
    console.log('Render state:', {
        loading,
        profiles: profiles.length,
        error,
        stats,
        currentPage,
        totalPages,
        totalProfiles,
    });

    // Loading state
    if (loading && profiles.length === 0) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-2">사용자 목록을 불러오는 중...</span>
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className="space-y-6">
                <div className="text-center py-12">
                    <div className="text-red-600 text-lg font-semibold mb-2">오류가 발생했습니다</div>
                    <div className="text-gray-600 mb-4">{error}</div>
                    <Button onClick={loadProfiles} variant="outline">
                        다시 시도
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">👥 사용자 관리</h1>
                    <p className="text-gray-600 mt-1">등록된 모든 사용자를 조회하고 관리하세요</p>
                </div>
                <div className="text-right">
                    <div className="text-2xl font-bold text-blue-600">{totalProfiles.toLocaleString()}</div>
                    <div className="text-sm text-gray-500">전체 사용자</div>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <Card className="p-4">
                    <div className="text-center">
                        <div className="text-lg font-semibold text-green-600">{stats.active}</div>
                        <div className="text-sm text-gray-500">활성 사용자</div>
                    </div>
                </Card>
                <Card className="p-4">
                    <div className="text-center">
                        <div className="text-lg font-semibold text-yellow-600">{stats.inactive}</div>
                        <div className="text-sm text-gray-500">비활성</div>
                    </div>
                </Card>
                <Card className="p-4">
                    <div className="text-center">
                        <div className="text-lg font-semibold text-red-600">{stats.deleted}</div>
                        <div className="text-sm text-gray-500">탈퇴</div>
                    </div>
                </Card>
                <Card className="p-4">
                    <div className="text-center">
                        <div className="text-lg font-semibold text-purple-600">{stats.today}</div>
                        <div className="text-sm text-gray-500">오늘 가입</div>
                    </div>
                </Card>
                <Card className="p-4">
                    <div className="text-center">
                        <div className="text-lg font-semibold text-indigo-600">{stats.this_week}</div>
                        <div className="text-sm text-gray-500">이번 주</div>
                    </div>
                </Card>
                <Card className="p-4">
                    <div className="text-center">
                        <div className="text-lg font-semibold text-pink-600">{stats.this_month}</div>
                        <div className="text-sm text-gray-500">이번 달</div>
                    </div>
                </Card>
            </div>

            {/* Search & Filters */}
            <Card className="p-4">
                <div className="flex flex-col lg:flex-row gap-4">
                    {/* Search */}
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                            type="text"
                            placeholder="이메일 또는 이름으로 검색..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    {/* Filters */}
                    <div className="flex gap-2">
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="all">전체 상태</option>
                            <option value="active">활성</option>
                            <option value="inactive">비활성</option>
                            <option value="deleted">탈퇴</option>
                        </select>

                        <select
                            value={providerFilter}
                            onChange={(e) => setProviderFilter(e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="all">전체 가입경로</option>
                            <option value="email">이메일</option>
                            <option value="google">구글</option>
                            <option value="kakao">카카오</option>
                        </select>

                        <Button onClick={handleExportProfiles} variant="outline">
                            <Download className="w-4 h-4 mr-2" />
                            내보내기
                        </Button>
                    </div>
                </div>

                {/* Bulk Actions */}
                {selectedProfiles.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">{selectedProfiles.length}명 선택됨</span>
                            <div className="flex gap-2">
                                <Button size="sm" variant="outline" onClick={() => handleBulkStatusChange('active')}>
                                    활성화
                                </Button>
                                <Button size="sm" variant="outline" onClick={() => handleBulkStatusChange('inactive')}>
                                    비활성화
                                </Button>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleBulkStatusChange('deleted')}
                                    className="text-red-600 border-red-600 hover:bg-red-50"
                                >
                                    탈퇴 처리
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </Card>

            {/* User List */}
            <div className="bg-white rounded-lg border overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b">
                            <tr>
                                <th className="px-4 py-3 text-left">
                                    <input
                                        type="checkbox"
                                        checked={selectedProfiles.length === profiles.length && profiles.length > 0}
                                        onChange={(e) => {
                                            if (e.target.checked) {
                                                setSelectedProfiles(profiles.map((p) => p.id));
                                            } else {
                                                setSelectedProfiles([]);
                                            }
                                        }}
                                        className="rounded border-gray-300"
                                    />
                                </th>
                                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">이메일</th>
                                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">이름</th>
                                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">가입경로</th>
                                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">상태</th>
                                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">가입일</th>
                                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">액션</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {profiles.map((profile) => (
                                <tr key={profile.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-3">
                                        <input
                                            type="checkbox"
                                            checked={selectedProfiles.includes(profile.id)}
                                            onChange={(e) => {
                                                if (e.target.checked) {
                                                    setSelectedProfiles((prev) => [...prev, profile.id]);
                                                } else {
                                                    setSelectedProfiles((prev) => prev.filter((id) => id !== profile.id));
                                                }
                                            }}
                                            className="rounded border-gray-300"
                                        />
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="text-sm text-gray-900">{profile.email}</div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-2">
                                            {profile.avatar_url && (
                                                <img src={profile.avatar_url} alt={profile.name} className="w-6 h-6 rounded-full" />
                                            )}
                                            <span className="text-sm font-medium text-gray-900">{profile.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <Badge variant="outline">
                                            {profile.provider === 'google' ? '구글' : profile.provider === 'kakao' ? '카카오' : '이메일'}
                                        </Badge>
                                    </td>
                                    <td className="px-4 py-3">
                                        <Badge className={`flex items-center gap-1 w-fit ${getStatusColor(profile.status)}`}>
                                            {getStatusIcon(profile.status)}
                                            {getStatusText(profile.status)}
                                        </Badge>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="text-sm text-gray-900">{formatDate(profile.created_at)}</div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-2">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={async () => {
                                                    try {
                                                        const details = await profileApi.getProfileDetails(profile.id);
                                                        setSelectedProfile(details);
                                                        setShowProfileModal(true);
                                                    } catch (error) {
                                                        console.error('프로필 상세 조회 실패:', error);
                                                    }
                                                }}
                                            >
                                                <Eye className="w-4 h-4" />
                                            </Button>

                                            {/* Status Change */}
                                            <select
                                                value={profile.status}
                                                onChange={(e) => handleStatusChange(profile.id, e.target.value as Profile['status'])}
                                                className="text-xs px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                            >
                                                <option value="active">활성</option>
                                                <option value="inactive">비활성</option>
                                                <option value="deleted">탈퇴</option>
                                            </select>

                                            {/* Delete Button */}
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => handleDeleteProfile(profile.id)}
                                                className="text-red-600 border-red-600 hover:bg-red-50"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
                        <div className="text-sm text-gray-500">
                            전체 {totalProfiles.toLocaleString()}명 중 {(currentPage - 1) * 20 + 1}-
                            {Math.min(currentPage * 20, totalProfiles)}명 표시
                        </div>
                        <div className="flex gap-2">
                            <Button
                                size="sm"
                                variant="outline"
                                disabled={currentPage === 1}
                                onClick={() => setCurrentPage((prev) => prev - 1)}
                            >
                                이전
                            </Button>
                            <span className="px-3 py-1 text-sm">
                                {currentPage} / {totalPages}
                            </span>
                            <Button
                                size="sm"
                                variant="outline"
                                disabled={currentPage === totalPages}
                                onClick={() => setCurrentPage((prev) => prev + 1)}
                            >
                                다음
                            </Button>
                        </div>
                    </div>
                )}
            </div>

            {console.log(profiles, '----profiles')}
            {/* Empty State */}
            {profiles.length === 0 && !loading && (
                <Card className="p-12 text-center">
                    <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">사용자가 없습니다</h3>
                    <p className="text-gray-500">검색 조건을 변경하거나 필터를 초기화해보세요.</p>
                </Card>
            )}

            {/* Profile Detail Modal */}
            {showProfileModal && selectedProfile && (
                <ProfileDetailModal
                    profile={selectedProfile}
                    onClose={() => {
                        setShowProfileModal(false);
                        setSelectedProfile(null);
                    }}
                    onUpdate={loadProfiles}
                />
            )}
        </div>
    );
}

// Profile Detail Modal Component
function ProfileDetailModal({ profile, onClose, onUpdate }: { profile: ProfileWithActivity; onClose: () => void; onUpdate: () => void }) {
    const [activities, setActivities] = useState<any[]>([]);
    const [feedbacks, setFeedbacks] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadActivities();
    }, [profile.id]);

    const loadActivities = async () => {
        setLoading(true);
        try {
            const [activitiesData, feedbacksData] = await Promise.all([
                profileApi.getProfileActivity(profile.id),
                profileApi.getProfileFeedbacks(profile.id),
            ]);

            setActivities(activitiesData);
            setFeedbacks(feedbacksData);
        } catch (error) {
            console.error('활동 내역 조회 실패:', error);
        }
        setLoading(false);
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'completed':
                return <Badge className="bg-green-100 text-green-800">완료</Badge>;
            case 'in_progress':
                return <Badge className="bg-blue-100 text-blue-800">진행중</Badge>;
            case 'abandoned':
                return <Badge className="bg-red-100 text-red-800">중단</Badge>;
            default:
                return <Badge variant="outline">알 수 없음</Badge>;
        }
    };

    const formatDuration = (seconds: number) => {
        if (seconds < 60) return `${seconds}초`;
        if (seconds < 3600) return `${Math.round(seconds / 60)}분`;
        return `${Math.round(seconds / 3600)}시간`;
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                    <h2 className="text-xl font-semibold">{profile.name} 상세 정보</h2>
                    <Button variant="outline" onClick={onClose}>
                        ✕
                    </Button>
                </div>

                <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* 기본 정보 */}
                    <div className="lg:col-span-1">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">기본 정보</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <label className="text-sm font-medium text-gray-500">이메일</label>
                                    <p className="text-sm text-gray-900">{profile.email}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-500">이름</label>
                                    <p className="text-sm text-gray-900">{profile.name}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-500">가입경로</label>
                                    <p className="text-sm text-gray-900">
                                        {profile.provider === 'google' ? '구글' : profile.provider === 'kakao' ? '카카오' : '이메일'}
                                    </p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-500">상태</label>
                                    <Badge
                                        className={`w-fit ${
                                            profile.status === 'active'
                                                ? 'bg-green-100 text-green-800'
                                                : profile.status === 'inactive'
                                                ? 'bg-yellow-100 text-yellow-800'
                                                : 'bg-red-100 text-red-800'
                                        }`}
                                    >
                                        {profile.status === 'active' ? '활성' : profile.status === 'inactive' ? '비활성' : '탈퇴'}
                                    </Badge>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-500">가입일</label>
                                    <p className="text-sm text-gray-900">{new Date(profile.created_at).toLocaleDateString('ko-KR')}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-500">최근 수정일</label>
                                    <p className="text-sm text-gray-900">{new Date(profile.updated_at).toLocaleDateString('ko-KR')}</p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* 활동 통계 & 최근 기록 */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* 통계 */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">활동 통계</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-blue-600">{profile.activity?.total_responses || 0}</div>
                                        <div className="text-sm text-gray-500">총 응답수</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-green-600">{profile.activity?.unique_tests || 0}</div>
                                        <div className="text-sm text-gray-500">참여 테스트</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-purple-600">
                                            {profile.activity?.avg_completion_rate
                                                ? `${(profile.activity.avg_completion_rate * 100).toFixed(1)}%`
                                                : '-'}
                                        </div>
                                        <div className="text-sm text-gray-500">평균 완료율</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-orange-600">
                                            {profile.activity?.avg_duration_sec ? formatDuration(profile.activity.avg_duration_sec) : '-'}
                                        </div>
                                        <div className="text-sm text-gray-500">평균 소요시간</div>
                                    </div>
                                </div>
                                {profile.activity?.top_result_type && (
                                    <div className="mt-4 pt-4 border-t border-gray-200">
                                        <div className="text-sm font-medium text-gray-700">인기 결과 유형</div>
                                        <div className="text-lg font-semibold text-gray-900 mt-1">{profile.activity.top_result_type}</div>
                                    </div>
                                )}
                                <div className="mt-4 pt-4 border-t border-gray-200">
                                    <div className="text-sm font-medium text-gray-700">활동 점수</div>
                                    <div className="text-lg font-semibold text-gray-900 mt-1">
                                        {profile.activity?.activity_score || 0}점
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* 최근 활동 */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">최근 활동</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {loading ? (
                                    <div className="text-center py-4">
                                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                                    </div>
                                ) : activities.length > 0 ? (
                                    <div className="space-y-3">
                                        {activities.map((activity) => (
                                            <div key={activity.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                                <div className="flex items-center gap-3">
                                                    <span className="text-lg">{activity.test_emoji}</span>
                                                    <div>
                                                        <div className="font-medium text-gray-900">{activity.test_title}</div>
                                                        <div className="text-sm text-gray-500">
                                                            {new Date(activity.started_at).toLocaleDateString('ko-KR')}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="mb-1">{getStatusBadge(activity.status)}</div>
                                                    {activity.result_type !== '결과 없음' && (
                                                        <Badge variant="outline" className="mb-1">
                                                            {activity.result_type}
                                                        </Badge>
                                                    )}
                                                    {activity.duration_sec > 0 && (
                                                        <div className="text-xs text-gray-500">{formatDuration(activity.duration_sec)}</div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-8 text-gray-500">활동 내역이 없습니다</div>
                                )}
                            </CardContent>
                        </Card>

                        {/* 최근 건의사항 */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">최근 건의사항</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {feedbacks.length > 0 ? (
                                    <div className="space-y-3">
                                        {feedbacks.map((feedback) => (
                                            <div key={feedback.id} className="p-3 bg-gray-50 rounded-lg">
                                                <div className="font-medium text-gray-900">{feedback.title}</div>
                                                <div className="text-sm text-gray-500 mt-1">
                                                    {feedback.category} • {feedback.status} •
                                                    {new Date(feedback.created_at).toLocaleDateString('ko-KR')}
                                                </div>
                                                {feedback.admin_reply && (
                                                    <div className="mt-2 p-2 bg-blue-50 rounded text-sm text-blue-700">
                                                        <strong>관리자 답변:</strong> {feedback.admin_reply}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-8 text-gray-500">건의사항 내역이 없습니다</div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}
