import { supabase } from '@/shared/lib/supabaseClient';

export const sectionService = {
    async getAllSections() {
        const { data, error } = await supabase.from('sections').select('*').order('order_index', { ascending: true });
        if (error) throw error;
        return data || [];
    },

    async getActiveSections() {
        const { data, error } = await supabase.from('sections').select('*').eq('is_active', true).order('order_index', { ascending: true });
        if (error) throw error;
        return data || [];
    },

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

    async deleteSection(id: string) {
        const { error } = await supabase.from('sections').delete().eq('id', id);
        if (error) throw error;
    },

    async getTestsBySection(sectionName: string) {
        const { data, error } = await supabase.rpc('get_tests_by_section', { section_name: sectionName });
        if (error) throw error;
        return data || [];
    },

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

    async removeTestFromSection(sectionId: string, testId: string) {
        const { error } = await supabase.from('section_tests').delete().eq('section_id', sectionId).eq('test_id', testId);
        if (error) throw error;
    },

    async updateSectionTestOrder(sectionId: string, testOrders: Array<{ testId: string; orderIndex: number }>) {
        const updates = testOrders.map(({ testId, orderIndex }) => ({
            section_id: sectionId,
            test_id: testId,
            order_index: orderIndex,
        }));
        const { error } = await supabase.from('section_tests').upsert(updates, { onConflict: 'section_id,test_id' });
        if (error) throw error;
    },

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
