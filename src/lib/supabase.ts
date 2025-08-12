import { createClient } from '@supabase/supabase-js';
import type { Test, CreateTestRequest } from '../types/test';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// 환경 변수 검증
if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables');
}

// URL 유효성 검증
try {
    new URL(supabaseUrl);
} catch {
    throw new Error(`Invalid Supabase URL: ${supabaseUrl}`);
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
    },
});

// 건의사항 관리 API
export const feedbackApi = {
    // 모든 건의사항 조회 (관리자용)
    async getAllFeedbacks() {
        const { data, error } = await supabase.from('feedbacks').select('*').order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    },

    // 건의사항 상세 조회
    async getFeedbackById(id: string) {
        const { data, error } = await supabase.from('feedbacks').select('*').eq('id', id).single();

        if (error) throw error;
        return data;
    },

    // 건의사항 상태 변경
    async updateFeedbackStatus(id: string, status: string) {
        const { data, error } = await supabase.from('feedbacks').update({ status }).eq('id', id).select().single();

        if (error) throw error;
        return data;
    },

    // 관리자 답변 추가
    async addAdminReply(id: string, reply: string) {
        const { data, error } = await supabase
            .from('feedbacks')
            .update({
                admin_reply: reply,
                admin_reply_at: new Date().toISOString(),
                status: 'replied',
            })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    // 건의사항 삭제
    async deleteFeedback(id: string) {
        const { error } = await supabase.from('feedbacks').delete().eq('id', id);

        if (error) throw error;
    },

    // 건의사항 통계
    async getFeedbackStats() {
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
    },
};

// 테스트 관련 API 함수들
export const testApi = {
    // 모든 테스트 목록 조회
    async getAllTests(): Promise<Test[]> {
        const { data, error } = await supabase
            .from('tests')
            .select(
                `
                *,
                questions:questions(count),
                test_results:test_results(count),
                user_responses:user_responses(count)
            `
            )
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    },

    // 단일 테스트 조회 (상세)
    async getTestById(id: string): Promise<Test> {
        const { data, error } = await supabase
            .from('tests')
            .select(
                `
                *,
                questions:questions(
                    *,
                    question_options:question_options(*)
                ),
                test_results:test_results(*)
            `
            )
            .eq('id', id)
            .single();

        if (error) throw error;
        return data;
    },

    // 테스트 생성
    async createTest(testData: CreateTestRequest): Promise<Test> {
        const { data, error } = await supabase.from('tests').insert([testData]).select().single();

        if (error) throw error;
        return data;
    },

    // 테스트 수정
    async updateTest(id: string, testData: Partial<CreateTestRequest>): Promise<Test> {
        const { data, error } = await supabase.from('tests').update(testData).eq('id', id).select().single();

        if (error) throw error;
        return data;
    },

    // 테스트 삭제
    async deleteTest(id: string): Promise<void> {
        const { error } = await supabase.from('tests').delete().eq('id', id);
        if (error) throw error;
    },

    // 테스트 공개 상태 변경
    async togglePublishStatus(id: string, isPublished: boolean): Promise<Test> {
        const { data, error } = await supabase.from('tests').update({ is_published: isPublished }).eq('id', id).select().single();

        if (error) throw error;
        return data;
    },

    // 질문 관리
    async createQuestion(testId: string, questionData: any): Promise<any> {
        const { data, error } = await supabase
            .from('questions')
            .insert([{ ...questionData, test_id: testId }])
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async updateQuestion(id: string, questionData: any): Promise<any> {
        const { data, error } = await supabase.from('questions').update(questionData).eq('id', id).select().single();

        if (error) throw error;
        return data;
    },

    async deleteQuestion(id: string): Promise<void> {
        const { error } = await supabase.from('questions').delete().eq('id', id);
        if (error) throw error;
    },

    // 질문 옵션 관리
    async createQuestionOption(questionId: string, optionData: any): Promise<any> {
        const { data, error } = await supabase
            .from('question_options')
            .insert([{ ...optionData, question_id: questionId }])
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async updateQuestionOption(id: string, optionData: any): Promise<any> {
        const { data, error } = await supabase.from('question_options').update(optionData).eq('id', id).select().single();

        if (error) throw error;
        return data;
    },

    async deleteQuestionOption(id: string): Promise<void> {
        const { error } = await supabase.from('question_options').delete().eq('id', id);
        if (error) throw error;
    },

    // 테스트 결과 관리
    async createTestResult(testId: string, resultData: any): Promise<any> {
        const { data, error } = await supabase
            .from('test_results')
            .insert([{ ...resultData, test_id: testId }])
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async updateTestResult(id: string, resultData: any): Promise<any> {
        const { data, error } = await supabase.from('test_results').update(resultData).eq('id', id).select().single();

        if (error) throw error;
        return data;
    },

    async deleteTestResult(id: string): Promise<void> {
        const { error } = await supabase.from('test_results').delete().eq('id', id);
        if (error) throw error;
    },

    // 사용자 응답 조회
    async getUserResponses(testId?: string): Promise<any[]> {
        let query = supabase
            .from('user_responses')
            .select(
                `
                *,
                tests:test_id(title, emoji),
                test_results:result_id(title)
            `
            )
            .order('created_at', { ascending: false });

        if (testId) {
            query = query.eq('test_id', testId);
        }

        const { data, error } = await query;
        if (error) throw error;
        return data || [];
    },

    // 통계 데이터
    async getTestStats(): Promise<any> {
        const { data: tests, error: testsError } = await supabase.from('tests').select('id, is_published');

        if (testsError) throw testsError;

        const { data: responses, error: responsesError } = await supabase.from('user_responses').select('test_id, created_at');

        if (responsesError) throw responsesError;

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const todayResponses = responses?.filter((r) => new Date(r.created_at) >= today).length || 0;

        return {
            totalTests: tests?.length || 0,
            publishedTests: tests?.filter((t) => t.is_published).length || 0,
            totalResponses: responses?.length || 0,
            todayResponses,
        };
    },
};

// 섹션 관리 API
export const sectionApi = {
    // 모든 섹션 조회
    async getAllSections() {
        const { data, error } = await supabase.from('sections').select('*').order('order_index', { ascending: true });

        if (error) throw error;
        return data || [];
    },

    // 활성 섹션만 조회
    async getActiveSections() {
        const { data, error } = await supabase.from('sections').select('*').eq('is_active', true).order('order_index', { ascending: true });

        if (error) throw error;
        return data || [];
    },

    // 섹션 생성
    async createSection(section: {
        name: string;
        display_name: string;
        description?: string;
        icon?: string;
        color?: string;
        order_index?: number;
    }) {
        const { data, error } = await supabase.from('sections').insert(section).select().single();

        if (error) throw error;
        return data;
    },

    // 섹션 수정
    async updateSection(
        id: string,
        updates: Partial<{
            name: string;
            display_name: string;
            description: string;
            icon: string;
            color: string;
            order_index: number;
            is_active: boolean;
        }>
    ) {
        const { data, error } = await supabase
            .from('sections')
            .update({ ...updates, updated_at: new Date().toISOString() })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    // 섹션 삭제
    async deleteSection(id: string) {
        const { error } = await supabase.from('sections').delete().eq('id', id);

        if (error) throw error;
    },

    // 섹션별 테스트 조회
    async getTestsBySection(sectionName: string) {
        const { data, error } = await supabase.rpc('get_tests_by_section', { section_name: sectionName });

        if (error) throw error;
        return data || [];
    },

    // 섹션에 테스트 추가
    async addTestToSection(sectionId: string, testId: string, orderIndex?: number) {
        const { data, error } = await supabase
            .from('section_tests')
            .insert({
                section_id: sectionId,
                test_id: testId,
                order_index: orderIndex || 0,
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    // 섹션에서 테스트 제거
    async removeTestFromSection(sectionId: string, testId: string) {
        const { error } = await supabase.from('section_tests').delete().eq('section_id', sectionId).eq('test_id', testId);

        if (error) throw error;
    },

    // 섹션 테스트 순서 변경
    async updateSectionTestOrder(sectionId: string, testOrders: Array<{ testId: string; orderIndex: number }>) {
        const updates = testOrders.map(({ testId, orderIndex }) => ({
            section_id: sectionId,
            test_id: testId,
            order_index: orderIndex,
        }));

        const { error } = await supabase.from('section_tests').upsert(updates, { onConflict: 'section_id,test_id' });

        if (error) throw error;
    },

    // 섹션 테스트 피처드 상태 변경
    async updateSectionTestFeatured(sectionId: string, testId: string, isFeatured: boolean) {
        const { data, error } = await supabase
            .from('section_tests')
            .update({ is_featured: isFeatured })
            .eq('section_id', sectionId)
            .eq('test_id', testId)
            .select()
            .single();

        if (error) throw error;
        return data;
    },
};

// 카테고리 관리 API
export const categoryApi = {
    // 모든 카테고리 조회
    async getAllCategories() {
        const { data, error } = await supabase.from('categories').select('*').order('sort_order', { ascending: true });

        if (error) throw error;
        return data || [];
    },

    // 활성 카테고리만 조회
    async getActiveCategories() {
        const { data, error } = await supabase
            .from('categories')
            .select('*')
            .eq('is_active', true)
            .order('sort_order', { ascending: true });

        if (error) throw error;
        return data || [];
    },

    // 카테고리 생성
    async createCategory(category: { name: string; display_name: string; description?: string; sort_order?: number; slug: string }) {
        const { data, error } = await supabase.from('categories').insert(category).select().single();

        if (error) throw error;
        return data;
    },

    // 카테고리 수정
    async updateCategory(
        id: number,
        updates: Partial<{
            name: string;
            display_name: string;
            description: string;
            sort_order: number;
            slug: string;
            is_active: boolean;
        }>
    ) {
        const { data, error } = await supabase.from('categories').update(updates).eq('id', id).select().single();

        if (error) throw error;
        return data;
    },

    // 카테고리 삭제
    async deleteCategory(id: number) {
        const { error } = await supabase.from('categories').delete().eq('id', id);

        if (error) throw error;
    },

    // 카테고리별 테스트 조회
    async getTestsByCategory(categoryName: string) {
        const { data, error } = await supabase.rpc('get_tests_by_category', { category_name: categoryName });

        if (error) throw error;
        return data || [];
    },
};
