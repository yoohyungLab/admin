import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { feedbackApi } from '../../lib/supabase';
import { Search, Eye, MessageSquare, CheckCircle, Clock, AlertCircle } from 'lucide-react';

interface Feedback {
    id: string;
    title: string;
    content: string;
    category: string;
    status: 'pending' | 'in_progress' | 'completed' | 'replied' | 'rejected';
    author_name: string;
    author_email?: string;
    attached_file_url?: string;
    admin_reply?: string;
    admin_reply_at?: string;
    views: number;
    created_at: string;
    updated_at: string;
}

export function FeedbackListPage() {
    const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedStatus, setSelectedStatus] = useState<string>('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [showReplyModal, setShowReplyModal] = useState<string | null>(null);
    const [replyText, setReplyText] = useState('');
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadFeedbacks();
    }, []);

    const loadFeedbacks = async () => {
        setLoading(true);
        setError(null);

        try {
            console.log('=== 건의사항 로딩 시작 ===');
            const data = await feedbackApi.getAllFeedbacks();
            console.log('조회된 건의사항:', data);

            if (Array.isArray(data)) {
                setFeedbacks(data);
                console.log('상태에 저장된 데이터:', data.length, '개');
            } else {
                console.error('데이터가 배열이 아님:', data);
                setError('데이터 형식이 올바르지 않습니다.');
            }
        } catch (error) {
            console.error('=== 피드백 불러오기 실패 ===');
            console.error('에러:', error);
            setError(error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.');
        } finally {
            setLoading(false);
            console.log('로딩 완료');
        }
    };

    const handleStatusToggle = async (id: string, currentStatus: Feedback['status']) => {
        let newStatus: Feedback['status'] = 'pending';

        // 상태 순환: pending -> in_progress -> completed
        switch (currentStatus) {
            case 'pending':
                newStatus = 'in_progress';
                break;
            case 'in_progress':
                newStatus = 'completed';
                break;
            case 'completed':
                newStatus = 'pending';
                break;
            default:
                newStatus = 'pending';
        }

        try {
            await feedbackApi.updateFeedbackStatus(id, newStatus);
            loadFeedbacks(); // 권한 재확인 후 다시 로드
        } catch (error) {
            console.error('상태 업데이트 실패:', error);
            setError(error instanceof Error ? error.message : '상태 업데이트에 실패했습니다.');
        }
    };

    const handleAddReply = async (id: string) => {
        if (!replyText.trim()) return;

        try {
            await feedbackApi.addAdminReply(id, replyText);
            setShowReplyModal(null);
            setReplyText('');
            loadFeedbacks(); // 권한 재확인 후 다시 로드
        } catch (error) {
            console.error('답변 추가 실패:', error);
            setError(error instanceof Error ? error.message : '답변 추가에 실패했습니다.');
        }
    };

    const getStatusIcon = (status: Feedback['status']) => {
        switch (status) {
            case 'pending':
                return <Clock className="w-4 h-4 text-yellow-600" />;
            case 'in_progress':
                return <AlertCircle className="w-4 h-4 text-blue-600" />;
            case 'completed':
                return <CheckCircle className="w-4 h-4 text-green-600" />;
            case 'replied':
                return <MessageSquare className="w-4 h-4 text-purple-600" />;
            case 'rejected':
                return <AlertCircle className="w-4 h-4 text-red-600" />;
            default:
                return <Clock className="w-4 h-4 text-gray-600" />;
        }
    };

    const getStatusColor = (status: Feedback['status']) => {
        switch (status) {
            case 'pending':
                return 'bg-yellow-100 text-yellow-800';
            case 'in_progress':
                return 'bg-blue-100 text-blue-800';
            case 'completed':
                return 'bg-green-100 text-green-800';
            case 'replied':
                return 'bg-purple-100 text-purple-800';
            case 'rejected':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const getCategoryLabel = (category: string) => {
        const categoryMap: Record<string, string> = {
            test_idea: '새 테스트 아이디어',
            feature: '기능 개선 건의',
            bug_report: '오류 신고',
            design: '디자인 관련',
            mobile: '모바일 이슈',
            other: '기타 의견',
        };
        return categoryMap[category] || category;
    };

    const filteredFeedbacks = feedbacks.filter((feedback) => {
        const matchesStatus = selectedStatus === 'all' || feedback.status === selectedStatus;
        const matchesSearch =
            searchTerm === '' ||
            feedback.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            feedback.content.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesStatus && matchesSearch;
    });

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    // 권한 로직 제거됨

    // 데이터 로딩 중인 경우
    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-2">건의사항을 불러오는 중...</span>
            </div>
        );
    }

    // 에러가 있는 경우
    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-64 space-y-4">
                <AlertCircle className="w-16 h-16 text-red-500" />
                <div className="text-center">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">오류가 발생했습니다</h3>
                    <p className="text-gray-600">{error}</p>
                </div>
                <Button onClick={loadFeedbacks} variant="outline">
                    다시 시도
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* 헤더 */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">💌 건의사항 관리</h1>
                    <p className="text-gray-600 mt-1">사용자들의 건의사항을 확인하고 관리하세요</p>
                </div>
                <div className="text-right">
                    <div className="text-2xl font-bold text-blue-600">{feedbacks.length}</div>
                    <div className="text-sm text-gray-500">전체 건의사항</div>
                </div>
            </div>

            {/* 검색 및 필터 */}
            <div className="bg-white rounded-lg border p-4 space-y-4">
                <div className="flex flex-col sm:flex-row gap-4">
                    {/* 검색 */}
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                            type="text"
                            placeholder="제목이나 내용으로 검색..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    {/* 상태 필터 */}
                    <select
                        value={selectedStatus}
                        onChange={(e) => setSelectedStatus(e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                        <option value="all">전체 상태</option>
                        <option value="pending">검토중</option>
                        <option value="in_progress">진행중</option>
                        <option value="completed">완료</option>
                        <option value="replied">답변완료</option>
                        <option value="rejected">반려</option>
                    </select>
                </div>

                {/* 통계 */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 pt-4 border-t border-gray-200">
                    <div className="text-center">
                        <div className="text-lg font-semibold text-gray-900">{feedbacks.filter((f) => f.status === 'pending').length}</div>
                        <div className="text-sm text-gray-500">검토중</div>
                    </div>
                    <div className="text-center">
                        <div className="text-lg font-semibold text-blue-600">
                            {feedbacks.filter((f) => f.status === 'in_progress').length}
                        </div>
                        <div className="text-sm text-gray-500">진행중</div>
                    </div>
                    <div className="text-center">
                        <div className="text-lg font-semibold text-green-600">
                            {feedbacks.filter((f) => f.status === 'completed').length}
                        </div>
                        <div className="text-sm text-gray-500">완료</div>
                    </div>
                    <div className="text-center">
                        <div className="text-lg font-semibold text-purple-600">
                            {feedbacks.filter((f) => f.status === 'replied').length}
                        </div>
                        <div className="text-sm text-gray-500">답변완료</div>
                    </div>
                    <div className="text-center">
                        <div className="text-lg font-semibold text-red-600">{feedbacks.filter((f) => f.status === 'rejected').length}</div>
                        <div className="text-sm text-gray-500">반려</div>
                    </div>
                </div>
            </div>

            {/* 피드백 목록 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {filteredFeedbacks.map((feedback) => (
                    <Card key={feedback.id} className="hover:shadow-lg transition-shadow">
                        <CardHeader className="pb-3">
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <CardTitle className="text-lg leading-tight mb-2">{feedback.title}</CardTitle>
                                    <div className="flex items-center gap-2 mb-2">
                                        <Badge variant="outline" className="text-xs">
                                            {getCategoryLabel(feedback.category)}
                                        </Badge>
                                        <Badge className={`text-xs ${getStatusColor(feedback.status)}`}>
                                            {getStatusIcon(feedback.status)}
                                            <span className="ml-1">
                                                {feedback.status === 'pending'
                                                    ? '검토중'
                                                    : feedback.status === 'in_progress'
                                                    ? '진행중'
                                                    : feedback.status === 'completed'
                                                    ? '완료'
                                                    : feedback.status === 'replied'
                                                    ? '답변완료'
                                                    : feedback.status === 'rejected'
                                                    ? '반려'
                                                    : feedback.status}
                                            </span>
                                        </Badge>
                                    </div>
                                    <div className="flex items-center gap-4 text-sm text-gray-500">
                                        <span>👤 {feedback.author_name}</span>
                                        <span>📅 {formatDate(feedback.created_at)}</span>
                                        {feedback.views > 0 && <span>👁️ {feedback.views}</span>}
                                    </div>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* 내용 미리보기 */}
                            <div className="bg-gray-50 rounded-lg p-3">
                                <p className="text-gray-700 text-sm line-clamp-3">
                                    {feedback.content.length > 150 ? `${feedback.content.substring(0, 150)}...` : feedback.content}
                                </p>
                            </div>

                            {/* 첨부파일 */}
                            {feedback.attached_file_url && (
                                <div className="flex items-center gap-2 text-sm text-blue-600">
                                    <span>📎 첨부파일 있음</span>
                                </div>
                            )}

                            {/* 관리자 답변 */}
                            {feedback.admin_reply && (
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                    <div className="flex items-center gap-2 mb-2">
                                        <MessageSquare className="w-4 h-4 text-blue-600" />
                                        <span className="text-sm font-medium text-blue-800">관리자 답변</span>
                                    </div>
                                    <p className="text-sm text-blue-700">{feedback.admin_reply}</p>
                                    {feedback.admin_reply_at && (
                                        <p className="text-xs text-blue-500 mt-1">{formatDate(feedback.admin_reply_at)}</p>
                                    )}
                                </div>
                            )}

                            {/* 액션 버튼들 */}
                            <div className="flex flex-wrap gap-2">
                                <Button
                                    onClick={() => handleStatusToggle(feedback.id, feedback.status)}
                                    variant="outline"
                                    size="sm"
                                    className="flex items-center gap-1"
                                >
                                    {getStatusIcon(feedback.status)}
                                    <span>
                                        {feedback.status === 'pending'
                                            ? '진행중으로'
                                            : feedback.status === 'in_progress'
                                            ? '완료로'
                                            : feedback.status === 'completed'
                                            ? '검토중으로'
                                            : '상태 변경'}
                                    </span>
                                </Button>

                                {!feedback.admin_reply && (
                                    <Button
                                        onClick={() => setShowReplyModal(feedback.id)}
                                        size="sm"
                                        className="flex items-center gap-1 bg-purple-600 hover:bg-purple-700"
                                    >
                                        <MessageSquare className="w-4 h-4" />
                                        답변 추가
                                    </Button>
                                )}

                                <Button variant="outline" size="sm" className="flex items-center gap-1">
                                    <Eye className="w-4 h-4" />
                                    상세보기
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* 답변 모달 */}
            {showReplyModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
                        <h3 className="text-lg font-semibold mb-4">관리자 답변 추가</h3>
                        <textarea
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            placeholder="답변을 입력하세요..."
                            rows={4}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-4"
                        />
                        <div className="flex gap-2 justify-end">
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setShowReplyModal(null);
                                    setReplyText('');
                                }}
                            >
                                취소
                            </Button>
                            <Button onClick={() => handleAddReply(showReplyModal)} disabled={!replyText.trim()}>
                                답변 추가
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* 빈 상태 */}
            {filteredFeedbacks.length === 0 && (
                <div className="text-center py-12 bg-white rounded-lg border">
                    <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">건의사항이 없습니다</h3>
                    <p className="text-gray-500">새로운 건의사항이 등록되면 여기에 표시됩니다.</p>
                </div>
            )}
        </div>
    );
}
