import { supabase } from '@/shared/lib/supabaseClient';

export interface AdminUser {
    id: string;
    email: string;
    role: 'admin';
}

export const adminAuthService = {
    // 관리자 로그인 (Supabase Auth 사용)
    async login(email: string, password: string): Promise<AdminUser> {
        // 1) 기존 사용자 로그인 시도
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (!error && data?.user) {
            if ((data.user.email || '').toLowerCase() !== 'admin@typologylab.com') {
                await supabase.auth.signOut();
                throw new Error('관리자 계정이 아닙니다.');
            }
            return {
                id: data.user.id,
                email: data.user.email || 'admin@typologylab.com',
                role: 'admin',
            };
        }

        // 2) 로그인 실패 시: 관리자 이메일이라면 자동 회원가입 시도
        if ((email || '').toLowerCase() === 'admin@typologylab.com') {
            const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    emailRedirectTo: typeof window !== 'undefined' ? window.location.origin : undefined,
                },
            });
            if (signUpError) {
                throw new Error(signUpError.message || '관리자 계정 생성에 실패했습니다.');
            }
            if (signUpData.user && !signUpData.session) {
                throw new Error('관리자 계정이 생성되었습니다. 이메일 인증 후 다시 로그인하세요.');
            }
            if (signUpData.user) {
                return {
                    id: signUpData.user.id,
                    email: signUpData.user.email || 'admin@typologylab.com',
                    role: 'admin',
                };
            }
        }

        throw new Error('로그인에 실패했습니다.');
    },

    // 로그아웃
    async logout() {
        await supabase.auth.signOut();
        localStorage.removeItem('adminUser');
        localStorage.removeItem('adminToken');
    },

    // 현재 로그인된 관리자 정보 조회 (Supabase 세션 기반)
    async getCurrentAdmin(): Promise<AdminUser | null> {
        const { data, error } = await supabase.auth.getUser();
        if (error || !data?.user) return null;
        const email = (data.user.email || '').toLowerCase();
        if (email !== 'admin@typologylab.com') return null;
        return { id: data.user.id, email, role: 'admin' };
    },
};
