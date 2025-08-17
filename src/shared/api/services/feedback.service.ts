import { supabase } from '@/shared/lib/supabaseClient';

export const feedbackService = {
    async getMyFeedbacks(userId: string) {
        try {
            const { data, error } = await supabase
                .from('feedbacks')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return { data: data || [], error: null };
        } catch (error) {
            return { data: [], error };
        }
    },

    async getAllFeedbacks() {
        try {
            const { data, error } = await supabase
                .from('feedbacks')
                .select('*', { count: 'exact' })
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data || [];
        } catch (error) {
            throw error;
        }
    },

    async createFeedback(feedbackData: {
        title: string;
        content: string;
        category: string;
        user_id: string;
        author_name: string;
        author_email: string;
        attached_file_url?: string | null;
    }) {
        try {
            const { data, error } = await supabase
                .from('feedbacks')
                .insert([
                    {
                        ...feedbackData,
                        status: 'pending',
                        views: 0,
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString(),
                    },
                ])
                .select()
                .single();

            if (error) throw error;
            return { data, error: null };
        } catch (error) {
            return { data: null, error };
        }
    },

    async getFeedbackById(id: string) {
        const { data, error } = await supabase.from('feedbacks').select('*').eq('id', id).single();
        if (error) throw error;
        return data;
    },

    async updateFeedbackStatus(id: string, status: string) {
        try {
            const { data, error } = await supabase
                .from('feedbacks')
                .update({
                    status,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            throw error;
        }
    },

    async addAdminReply(id: string, reply: string) {
        try {
            const { data, error } = await supabase
                .from('feedbacks')
                .update({
                    admin_reply: reply,
                    admin_reply_at: new Date().toISOString(),
                    status: 'replied',
                    updated_at: new Date().toISOString(),
                })
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            throw error;
        }
    },

    async deleteFeedback(id: string) {
        const { error } = await supabase.from('feedbacks').delete().eq('id', id);
        if (error) throw error;
    },

    async getFeedbackStats() {
        try {
            const { data, error } = await supabase.from('feedbacks').select('status, created_at');
            if (error) throw error;

            const now = new Date();
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            const thisWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
            const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

            const stats = {
                total: data?.length || 0,
                pending: data?.filter((f) => f.status === 'pending').length || 0,
                inProgress: data?.filter((f) => f.status === 'in_progress').length || 0,
                completed: data?.filter((f) => f.status === 'completed').length || 0,
                replied: data?.filter((f) => f.status === 'replied').length || 0,
                rejected: data?.filter((f) => f.status === 'rejected').length || 0,
                today: data?.filter((f) => new Date(f.created_at) >= today).length || 0,
                thisWeek: data?.filter((f) => new Date(f.created_at) >= thisWeek).length || 0,
                thisMonth: data?.filter((f) => new Date(f.created_at) >= thisMonth).length || 0,
            };

            return stats;
        } catch (error) {
            throw error;
        }
    },
};
