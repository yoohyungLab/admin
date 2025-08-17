import { supabase } from '@/shared/lib/supabaseClient';

export const categoryService = {
    async getAllCategories() {
        const { data, error } = await supabase.from('categories').select('*').order('sort_order', { ascending: true });
        if (error) throw error;
        return data || [];
    },

    async getActiveCategories() {
        const { data, error } = await supabase
            .from('categories')
            .select('*')
            .eq('is_active', true)
            .order('sort_order', { ascending: true });
        if (error) throw error;
        return data || [];
    },

    async createCategory(category: { name: string; display_name: string; description?: string; sort_order?: number; slug: string }) {
        const { data, error } = await supabase.from('categories').insert(category).select().single();
        if (error) throw error;
        return data;
    },

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

    async deleteCategory(id: number) {
        const { error } = await supabase.from('categories').delete().eq('id', id);
        if (error) throw error;
    },

    async getTestsByCategory(categoryName: string) {
        const { data, error } = await supabase.rpc('get_tests_by_category', { category_name: categoryName });
        if (error) throw error;
        return data || [];
    },
};
