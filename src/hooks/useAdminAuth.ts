import { useState, useEffect } from 'react';
import { adminAuthActions, type AdminUser } from '@/shared/api/actions';

export function useAdminAuth() {
    const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        try {
            const admin = await adminAuthActions.getCurrentAdmin();
            setAdminUser(admin);
        } catch {
            setAdminUser(null);
        } finally {
            setLoading(false);
        }
    };

    const login = async (email: string, password: string) => {
        try {
            const admin = await adminAuthActions.login(email, password);
            setAdminUser(admin);
            return { success: true } as const;
        } catch (err) {
            return { success: false, error: err instanceof Error ? err.message : '로그인에 실패했습니다.' } as const;
        }
    };

    const logout = async () => {
        try {
            await adminAuthActions.logout();
            setAdminUser(null);
        } catch {
            // no-op
        }
    };

    return { adminUser, loading, login, logout, checkAuth } as const;
}
