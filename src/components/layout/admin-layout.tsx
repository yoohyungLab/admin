import type { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useState } from 'react';

interface AdminLayoutProps {
    children: ReactNode;
}

interface NavigationItem {
    name: string;
    href: string;
    icon: string;
    description?: string;
    badge?: string;
}

const navigation: NavigationItem[] = [
    {
        name: '대시보드',
        href: '/',
        icon: '📊',
        description: '전체 현황 및 통계',
    },
    {
        name: '테스트 관리',
        href: '/tests',
        icon: '📝',
        description: '테스트 목록 및 관리',
        badge: 'New',
    },
    {
        name: '테스트 생성',
        href: '/tests/create',
        icon: '➕',
        description: '새로운 테스트 만들기',
    },
    {
        name: '섹션 관리',
        href: '/sections',
        icon: '📂',
        description: '홈페이지 섹션 관리',
        badge: 'New',
    },
    {
        name: '카테고리 관리',
        href: '/categories',
        icon: '🏷️',
        description: '테스트 카테고리 관리',
        badge: 'New',
    },
    {
        name: '결과 분석',
        href: '/results',
        icon: '📈',
        description: '테스트 결과 분석',
    },
    {
        name: '사용자 응답',
        href: '/responses',
        icon: '👥',
        description: '사용자 응답 관리',
    },
    {
        name: '설정',
        href: '/settings',
        icon: '⚙️',
        description: '시스템 설정',
    },
];

export function AdminLayout({ children }: AdminLayoutProps) {
    const location = useLocation();
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [userMenuOpen, setUserMenuOpen] = useState(false);

    return (
        <div className="admin-layout flex h-screen bg-gray-50">
            {/* 사이드바 */}
            <aside className={`admin-sidebar transition-all duration-300 ease-in-out ${sidebarCollapsed ? 'w-16' : 'w-64'}`}>
                <div className="flex flex-col h-full">
                    {/* 로고 영역 */}
                    <div className="flex items-center justify-between h-16 px-4 border-b border-gray-700">
                        {!sidebarCollapsed && <h1 className="text-white font-bold text-lg">TypologyLab</h1>}
                        <button
                            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                            className="text-gray-300 hover:text-white p-1 rounded"
                        >
                            {sidebarCollapsed ? '→' : '←'}
                        </button>
                    </div>

                    {/* 네비게이션 */}
                    <nav className="flex-1 px-2 py-4 space-y-1">
                        {navigation.map((item) => {
                            const isActive = location.pathname === item.href;
                            return (
                                <Link
                                    key={item.name}
                                    to={item.href}
                                    className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                                        isActive ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                                    }`}
                                    title={sidebarCollapsed ? item.name : undefined}
                                >
                                    <span className="mr-3 text-lg">{item.icon}</span>
                                    {!sidebarCollapsed && (
                                        <div className="flex-1">
                                            <div className="flex items-center justify-between">
                                                <span>{item.name}</span>
                                                {item.badge && (
                                                    <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                                                        {item.badge}
                                                    </span>
                                                )}
                                            </div>
                                            {item.description && <p className="text-xs text-gray-400 mt-1">{item.description}</p>}
                                        </div>
                                    )}
                                </Link>
                            );
                        })}
                    </nav>

                    {/* 하단 정보 */}
                    {!sidebarCollapsed && (
                        <div className="p-4 border-t border-gray-700">
                            <div className="text-xs text-gray-400">
                                <p>관리자 패널 v1.0</p>
                                <p className="mt-1">© 2024 TypologyLab</p>
                            </div>
                        </div>
                    )}
                </div>
            </aside>

            {/* 메인 콘텐츠 영역 */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* 헤더 */}
                <header className="admin-header h-16 flex items-center justify-between px-6">
                    <div className="flex items-center space-x-4">
                        <h2 className="text-xl font-semibold text-gray-800">
                            {navigation.find((item) => item.href === location.pathname)?.name || '대시보드'}
                        </h2>
                        <span className="text-sm text-gray-500">
                            {navigation.find((item) => item.href === location.pathname)?.description}
                        </span>
                    </div>

                    {/* 우측 헤더 영역 */}
                    <div className="flex items-center space-x-4">
                        {/* 알림 */}
                        <button className="relative p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-full transition-colors">
                            <span className="text-lg">🔔</span>
                            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                        </button>

                        {/* 사용자 메뉴 */}
                        <div className="relative">
                            <button
                                onClick={() => setUserMenuOpen(!userMenuOpen)}
                                className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                            >
                                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                                    A
                                </div>
                                <div className="text-left">
                                    <p className="text-sm font-medium text-gray-800">관리자</p>
                                    <p className="text-xs text-gray-500">admin@typologylab.com</p>
                                </div>
                                <span className="text-gray-400">▼</span>
                            </button>

                            {userMenuOpen && (
                                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
                                    <a href="#" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                                        프로필 설정
                                    </a>
                                    <a href="#" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                                        계정 설정
                                    </a>
                                    <hr className="my-1" />
                                    <a href="#" className="block px-4 py-2 text-sm text-red-600 hover:bg-gray-100">
                                        로그아웃
                                    </a>
                                </div>
                            )}
                        </div>
                    </div>
                </header>

                {/* 메인 콘텐츠 */}
                <main className="admin-content flex-1 overflow-auto p-6">
                    <div className="fade-in">{children}</div>
                </main>
            </div>
        </div>
    );
}
