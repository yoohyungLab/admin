import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { supabase } from '../../lib/supabase';

interface Feedback {
    id: string;
    title: string;
    content: string;
    status: 'new' | 'done';
    createdAt: string;
}

const feedbackApi = {
    async getFeedbacks() {
        const { data, error } = await supabase.from('feedbacks').select('*').order('created_at', { ascending: false });
        return { data, error };
    },

    async updateStatus(id: string, status: 'new' | 'done') {
        const { data, error } = await supabase.from('feedbacks').update({ status }).eq('id', id).select().single();
        return { data, error };
    },
};

export function FeedbackListPage() {
    const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);

    useEffect(() => {
        loadFeedbacks();
    }, []);

    const loadFeedbacks = async () => {
        const { data, error } = await feedbackApi.getFeedbacks();
        if (!error && data) {
            const mapped = data.map((f) => ({
                id: f.id,
                title: f.title,
                content: f.content,
                status: f.status,
                createdAt: new Date(f.created_at).toLocaleDateString('ko-KR'),
            }));
            setFeedbacks(mapped);
        } else {
            console.error('피드백 불러오기 실패:', error);
        }
    };

    const handleStatusToggle = async (id: string, currentStatus: 'new' | 'done') => {
        const newStatus = currentStatus === 'new' ? 'done' : 'new';
        const { error } = await feedbackApi.updateStatus(id, newStatus);
        if (!error) {
            loadFeedbacks();
        } else {
            console.error('상태 업데이트 실패:', error);
        }
    };

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-900">건의사항 목록</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {feedbacks.map((f) => (
                    <Card key={f.id} className="admin-card">
                        <CardHeader>
                            <CardTitle>{f.title}</CardTitle>
                            <p className="text-sm text-gray-500">{f.createdAt}</p>
                        </CardHeader>
                        <CardContent>
                            <p className="mb-4 text-gray-700 whitespace-pre-line">{f.content}</p>
                            <Button onClick={() => handleStatusToggle(f.id, f.status)}>
                                {f.status === 'done' ? '✅ 처리 완료' : '📌 미처리'}
                            </Button>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
