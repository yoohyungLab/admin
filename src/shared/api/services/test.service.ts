import { supabase } from '@/shared/lib/supabaseClient';
import type { Test, CreateTestRequest } from '@/types/test';

interface DBQuestion {
    id: string;
    test_id: string;
    order_index: number;
    text: string;
    group_name?: string | null;
    created_at: string;
}

type NewQuestionInput = {
    order_index: number;
    text: string;
    group_name?: string | null;
};

interface DBQuestionOption {
    id: string;
    question_id: string;
    text: string;
    score: number;
    color?: string | null;
    style?: string | null;
    created_at: string;
}

type NewQuestionOptionInput = {
    text: string;
    score: number;
    color?: string | null;
    style?: string | null;
};

interface DBTestResult {
    id: string;
    test_id: string;
    title: string;
    description?: string | null;
    keywords: string[] | null;
    recommendations: string[] | null;
    background_image?: string | null;
    condition_type: 'score' | 'pattern';
    condition_value: unknown;
    created_at: string;
}

type NewTestResultInput = {
    title: string;
    description?: string;
    keywords?: string[];
    recommendations?: string[];
    background_image?: string;
    condition_type: 'score' | 'pattern';
    condition_value: unknown;
};

export const testService = {
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

    async getPublishedTests(): Promise<Test[]> {
        const { data, error } = await supabase.from('tests').select('*').eq('is_published', true).order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    },

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
        return data as Test;
    },

    async createTest(testData: CreateTestRequest): Promise<Test> {
        const { data, error } = await supabase.from('tests').insert([testData]).select().single();
        if (error) throw error;
        return data as Test;
    },

    async updateTest(id: string, testData: Partial<CreateTestRequest>): Promise<Test> {
        const { data, error } = await supabase.from('tests').update(testData).eq('id', id).select().single();
        if (error) throw error;
        return data as Test;
    },

    async deleteTest(id: string): Promise<void> {
        const { error } = await supabase.from('tests').delete().eq('id', id);
        if (error) throw error;
    },

    async togglePublishStatus(id: string, isPublished: boolean): Promise<Test> {
        const { data, error } = await supabase.from('tests').update({ is_published: isPublished }).eq('id', id).select().single();
        if (error) throw error;
        return data as Test;
    },

    async createQuestion(testId: string, questionData: NewQuestionInput): Promise<DBQuestion> {
        const { data, error } = await supabase
            .from('questions')
            .insert([{ ...questionData, test_id: testId }])
            .select()
            .single();
        if (error) throw error;
        return data as DBQuestion;
    },

    async updateQuestion(id: string, questionData: Partial<NewQuestionInput>): Promise<DBQuestion> {
        const { data, error } = await supabase.from('questions').update(questionData).eq('id', id).select().single();
        if (error) throw error;
        return data as DBQuestion;
    },

    async deleteQuestion(id: string): Promise<void> {
        const { error } = await supabase.from('questions').delete().eq('id', id);
        if (error) throw error;
    },

    async createQuestionOption(questionId: string, optionData: NewQuestionOptionInput): Promise<DBQuestionOption> {
        const { data, error } = await supabase
            .from('question_options')
            .insert([{ ...optionData, question_id: questionId }])
            .select()
            .single();
        if (error) throw error;
        return data as DBQuestionOption;
    },

    async updateQuestionOption(id: string, optionData: Partial<NewQuestionOptionInput>): Promise<DBQuestionOption> {
        const { data, error } = await supabase.from('question_options').update(optionData).eq('id', id).select().single();
        if (error) throw error;
        return data as DBQuestionOption;
    },

    async deleteQuestionOption(id: string): Promise<void> {
        const { error } = await supabase.from('question_options').delete().eq('id', id);
        if (error) throw error;
    },

    async createTestResult(testId: string, resultData: NewTestResultInput): Promise<DBTestResult> {
        const { data, error } = await supabase
            .from('test_results')
            .insert([{ ...resultData, test_id: testId }])
            .select()
            .single();
        if (error) throw error;
        return data as DBTestResult;
    },

    async updateTestResult(id: string, resultData: Partial<NewTestResultInput>): Promise<DBTestResult> {
        const { data, error } = await supabase.from('test_results').update(resultData).eq('id', id).select().single();
        if (error) throw error;
        return data as DBTestResult;
    },

    async deleteTestResult(id: string): Promise<void> {
        const { error } = await supabase.from('test_results').delete().eq('id', id);
        if (error) throw error;
    },

    async getUserResponses(testId?: string): Promise<unknown[]> {
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

    async getTestStats(): Promise<{ totalTests: number; publishedTests: number; totalResponses: number; todayResponses: number }> {
        const { data: tests, error: testsError } = await supabase.from('tests').select('id, is_published');
        if (testsError) throw testsError;

        const { data: responses, error: responsesError } = await supabase.from('user_responses').select('test_id, created_at');
        if (responsesError) throw responsesError;

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const todayResponses = responses?.filter((r) => new Date(r.created_at) >= today).length || 0;

        return {
            totalTests: tests?.length || 0,
            publishedTests: tests?.filter((t) => (t as any).is_published).length || 0,
            totalResponses: responses?.length || 0,
            todayResponses,
        };
    },
};
