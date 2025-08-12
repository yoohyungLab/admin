import type { ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';

interface AdminLayoutProps {
    children: ReactNode;
}

type NavEntry =
    | {
          type: 'section';
          name: string;
      }
    | {
          type: 'item';
          name: string;
          href: string;
          icon: string;
          description?: string;
          badge?: string;
          // 활성 매칭 우선순위 향상을 위한 prefix(여러 개 가능)
          match?: string[];
      };

const navigation: NavEntry[] = [
    { type: 'item', name: '대시보드', href: '/', icon: '📊', description: '전체 현황 및 통계', match: ['/'] },

    { type: 'section', name: '콘텐츠 운영' },
    {
        type: 'item',
        name: '테스트 관리',
        href: '/tests',
        icon: '📝',
        description: '테스트 목록 및 관리',
        match: ['/tests', '/tests/create'],
    },
    { type: 'item', name: '테스트 생성', href: '/tests/create', icon: '➕', description: '새로운 테스트 만들기', match: ['/tests/create'] },
    { type: 'item', name: '카테고리 관리', href: '/categories', icon: '🏷️', description: '테스트 카테고리 관리', match: ['/categories'] },

    { type: 'section', name: '데이터 & 분석' },
    { type: 'item', name: '사용자 응답', href: '/responses', icon: '👥', description: '사용자 응답 관리', match: ['/responses'] },
    { type: 'item', name: '결과 분석', href: '/results', icon: '📈', description: '테스트 결과 분석', match: ['/results'] },

    { type: 'section', name: '유저 & 커뮤니티' },
    { type: 'item', name: '유저 관리', href: '/users', icon: '🧑‍💼', description: '유저 정보 한눈에', match: ['/users'] },
    { type: 'item', name: '건의사항 관리', href: '/feedbacks', icon: '💬', description: '건의사항 관리', match: ['/feedbacks'] },

    { type: 'section', name: '시스템' },
    { type: 'item', name: '설정', href: '/settings', icon: '⚙️', description: '시스템 설정', match: ['/settings'] },
];

function isActivePath(pathname: string, entry: NavEntry) {
    if (entry.type !== 'item') return false;
    // 루트는 정확 매칭, 그 외는 prefix 매칭
    if (entry.href === '/') return pathname === '/';
    const prefixes = entry.match ?? [entry.href];
    return prefixes.some((p) => pathname === p || pathname.startsWith(p + '/'));
}

export function AdminLayout({ children }: AdminLayoutProps) {
    const location = useLocation();
    const navigate = useNavigate();
    const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(() => {
        const saved = localStorage.getItem('admin.sidebarCollapsed');
        return saved ? saved === '1' : window.matchMedia('(max-width: 1024px)').matches; // 작은 화면 기본 축소
    });
    const [userMenuOpen, setUserMenuOpen] = useState(false);

    useEffect(() => {
        localStorage.setItem('admin.sidebarCollapsed', sidebarCollapsed ? '1' : '0');
    }, [sidebarCollapsed]);

    // 현재 페이지 메타(제목/설명)
    const currentMeta = useMemo(() => {
        const current = navigation.find((n) => n.type === 'item' && isActivePath(location.pathname, n)) as
            | Extract<NavEntry, { type: 'item' }>
            | undefined;

        // 루트 예외: 활성 항목 못 찾을 경우 대시보드로 표시
        return current ?? (navigation[0] as Extract<NavEntry, { type: 'item' }>);
    }, [location.pathname]);

    // 상단 CTA 노출 조건: 테스트 관련 화면에서 "테스트 만들기"
    const showCreateTestCTA = useMemo(() => {
        return location.pathname === '/tests' || location.pathname.startsWith('/tests/');
    }, [location.pathname]);

    // 단축키: C → 테스트 생성 (테스트 관련 컨텍스트에서만)
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if ((e.key === 'c' || e.key === 'C') && showCreateTestCTA) {
                e.preventDefault();
                navigate('/tests/create');
            }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [showCreateTestCTA, navigate]);

    return (
        <div className="admin-layout flex h-screen bg-gray-50 text-gray-900">
            {/* 사이드바 */}
            <aside
                className={`admin-sidebar bg-gray-900 text-white transition-all duration-300 ease-in-out ${
                    sidebarCollapsed ? 'w-16' : 'w-64'
                }`}
                aria-label="사이드바 내비게이션"
                aria-expanded={!sidebarCollapsed}
            >
                <div className="flex flex-col h-full">
                    {/* 로고/토글 */}
                    <div className="flex items-center justify-between h-16 px-3 border-b border-gray-800">
                        {!sidebarCollapsed && <h1 className="font-bold text-lg tracking-tight">TypologyLab</h1>}
                        <button
                            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                            className="text-gray-300 hover:text-white p-1 rounded focus:outline-none focus:ring-2 focus:ring-white/30"
                            aria-label={sidebarCollapsed ? '사이드바 펼치기' : '사이드바 접기'}
                            title={sidebarCollapsed ? '사이드바 펼치기' : '사이드바 접기'}
                        >
                            {sidebarCollapsed ? '→' : '←'}
                        </button>
                    </div>

                    {/* 네비게이션 */}
                    <nav className="flex-1 px-2 py-3 space-y-1 overflow-y-auto">
                        {navigation.map((entry, idx) => {
                            if (entry.type === 'section') {
                                return (
                                    <div
                                        key={`sec-${entry.name}-${idx}`}
                                        className={`pt-4 ${idx !== 0 ? 'mt-2 border-t border-gray-800' : ''}`}
                                    >
                                        {!sidebarCollapsed && (
                                            <div className="px-2 pb-2 text-[11px] uppercase tracking-wider text-gray-400">{entry.name}</div>
                                        )}
                                    </div>
                                );
                            }

                            const active = isActivePath(location.pathname, entry);
                            return (
                                <Link
                                    key={entry.name}
                                    to={entry.href}
                                    className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-all duration-200 outline-none ${
                                        active ? 'bg-blue-600 text-white shadow-md' : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                                    }`}
                                    aria-current={active ? 'page' : undefined}
                                    title={sidebarCollapsed ? entry.name : undefined}
                                >
                                    <span className="mr-3 text-lg" aria-hidden>
                                        {entry.icon}
                                    </span>
                                    {!sidebarCollapsed && (
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between gap-2">
                                                <span className="truncate">{entry.name}</span>
                                                {entry.badge && (
                                                    <span className="shrink-0 bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full">
                                                        {entry.badge}
                                                    </span>
                                                )}
                                            </div>
                                            {entry.description && (
                                                <p className="text-[11px] text-gray-400 mt-0.5 line-clamp-1">{entry.description}</p>
                                            )}
                                        </div>
                                    )}
                                </Link>
                            );
                        })}
                    </nav>

                    {/* 하단 정보 */}
                    {!sidebarCollapsed && (
                        <div className="p-4 border-t border-gray-800 text-xs text-gray-400">
                            <p>관리자 패널 v1.0</p>
                            <p className="mt-1">© {new Date().getFullYear()} TypologyLab</p>
                        </div>
                    )}
                </div>
            </aside>

            {/* 메인 */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* 헤더 */}
                <header className="admin-header h-16 flex items-center justify-between px-4 md:px-6 bg-white border-b border-gray-200">
                    <div className="flex items-center gap-3 min-w-0">
                        <h2 className="text-lg md:text-xl font-semibold text-gray-800 truncate">{currentMeta.name}</h2>
                        {currentMeta.description && (
                            <span className="hidden md:inline text-sm text-gray-500 truncate">{currentMeta.description}</span>
                        )}
                    </div>

                    <div className="flex items-center gap-2">
                        {/* 상단 CTA */}
                        {showCreateTestCTA && (
                            <button
                                onClick={() => navigate('/tests/create')}
                                className="hidden sm:inline-flex items-center gap-2 px-3 py-2 rounded-md bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                title="테스트 만들기 (단축키: C)"
                            >
                                ➕ 테스트 만들기
                            </button>
                        )}

                        {/* 알림 */}
                        <button
                            className="relative p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300"
                            aria-label="알림"
                            title="알림"
                        >
                            <span aria-hidden className="text-lg">
                                🔔
                            </span>
                            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
                        </button>

                        {/* 사용자 메뉴 */}
                        <div className="relative">
                            <button
                                onClick={() => setUserMenuOpen((v) => !v)}
                                className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300"
                                aria-haspopup="menu"
                                aria-expanded={userMenuOpen}
                                aria-label="사용자 메뉴 열기"
                            >
                                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                                    A
                                </div>
                                <div className="hidden sm:block text-left">
                                    <p className="text-sm font-medium text-gray-800">관리자</p>
                                    <p className="text-xs text-gray-500">admin@typologylab.com</p>
                                </div>
                                <span className="text-gray-400" aria-hidden>
                                    ▼
                                </span>
                            </button>

                            {userMenuOpen && (
                                <div
                                    role="menu"
                                    className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-100"
                                >
                                    <a href="#" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                                        프로필 설정
                                    </a>
                                    <a href="#" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                                        계정 설정
                                    </a>
                                    <hr className="my-1" />
                                    <a href="#" className="block px-4 py-2 text-sm text-red-600 hover:bg-gray-50">
                                        로그아웃
                                    </a>
                                </div>
                            )}
                        </div>
                    </div>
                </header>

                {/* 콘텐츠 */}
                <main className="admin-content flex-1 overflow-auto p-4 md:p-6 bg-gray-50">
                    <div className="animate-[fadeIn_200ms_ease-out]">{children}</div>
                </main>
            </div>
        </div>
    );
}
