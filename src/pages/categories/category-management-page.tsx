import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { categoryApi } from '@/lib/supabase';
import { Plus, Edit, Trash2, Eye, EyeOff, GripVertical, Save, X, Hash, Search, Filter } from 'lucide-react';

interface Category {
    id: number;
    name: string;
    display_name: string;
    description?: string;
    sort_order: number;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export default function CategoryManagementPage() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        display_name: '',
        description: '',
        sort_order: 0,
    });
    const [searchTerm, setSearchTerm] = useState('');
    const [filterActive, setFilterActive] = useState<'all' | 'active' | 'inactive'>('all');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        loadCategories();
    }, []);

    const loadCategories = async () => {
        try {
            setLoading(true);
            const data = await categoryApi.getAllCategories();
            setCategories(data);
        } catch (error) {
            console.error('카테고리 로드 실패:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateCategory = async () => {
        if (!formData.name.trim() || !formData.display_name.trim()) {
            alert('카테고리 이름과 표시 이름은 필수입니다.');
            return;
        }

        try {
            setIsSubmitting(true);

            // slug 자동 생성 (name을 기반으로)
            const categoryData = {
                ...formData,
                slug: formData.name.toLowerCase().replace(/\s+/g, '-'),
            };

            await categoryApi.createCategory(categoryData);
            setShowCreateForm(false);
            setFormData({ name: '', display_name: '', description: '', sort_order: 0 });
            loadCategories();
        } catch (error) {
            console.error('카테고리 생성 실패:', error);
            alert('카테고리 생성에 실패했습니다.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleUpdateCategory = async () => {
        if (!editingCategory) return;
        if (!formData.name.trim() || !formData.display_name.trim()) {
            alert('카테고리 이름과 표시 이름은 필수입니다.');
            return;
        }

        try {
            setIsSubmitting(true);

            // slug 자동 생성 (name을 기반으로)
            const categoryData = {
                ...formData,
                slug: formData.name.toLowerCase().replace(/\s+/g, '-'),
            };

            await categoryApi.updateCategory(editingCategory.id, categoryData);
            setEditingCategory(null);
            setFormData({ name: '', display_name: '', description: '', sort_order: 0 });
            loadCategories();
        } catch (error) {
            console.error('카테고리 수정 실패:', error);
            alert('카테고리 수정에 실패했습니다.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteCategory = async (id: number) => {
        if (!confirm('정말로 이 카테고리를 삭제하시겠습니까?\n삭제된 카테고리는 복구할 수 없습니다.')) return;

        try {
            await categoryApi.deleteCategory(id);
            loadCategories();
        } catch (error) {
            console.error('카테고리 삭제 실패:', error);
            alert('카테고리 삭제에 실패했습니다.');
        }
    };

    const handleToggleActive = async (category: Category) => {
        try {
            await categoryApi.updateCategory(category.id, { is_active: !category.is_active });
            loadCategories();
        } catch (error) {
            console.error('카테고리 상태 변경 실패:', error);
            alert('카테고리 상태 변경에 실패했습니다.');
        }
    };

    const startEdit = (category: Category) => {
        setEditingCategory(category);
        setFormData({
            name: category.name,
            display_name: category.display_name,
            description: category.description || '',
            sort_order: category.sort_order,
        });
    };

    const cancelEdit = () => {
        setEditingCategory(null);
        setShowCreateForm(false);
        setFormData({ name: '', display_name: '', description: '', sort_order: 0 });
    };

    const getNextOrderIndex = () => {
        if (categories.length === 0) return 1;
        return Math.max(...categories.map((c) => c.sort_order)) + 1;
    };

    const handleCreateFormOpen = () => {
        setFormData({ ...formData, sort_order: getNextOrderIndex() });
        setShowCreateForm(true);
    };

    const filteredCategories = categories.filter((category) => {
        const matchesSearch =
            searchTerm === '' ||
            category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            category.display_name.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesFilter =
            filterActive === 'all' ||
            (filterActive === 'active' && category.is_active) ||
            (filterActive === 'inactive' && !category.is_active);

        return matchesSearch && matchesFilter;
    });

    const sortedCategories = [...filteredCategories].sort((a, b) => a.sort_order - b.sort_order);

    const activeCount = categories.filter((c) => c.is_active).length;
    const inactiveCount = categories.filter((c) => !c.is_active).length;

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600 text-lg">카테고리를 불러오는 중...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 p-6">
            {/* 헤더 섹션 */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                    <div className="flex-1">
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">📂 카테고리 관리</h1>
                        <p className="text-gray-600 text-lg">테스트 카테고리를 체계적으로 관리하고 구성하세요</p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                        <div className="text-3xl font-bold text-blue-600">{categories.length}</div>
                        <div className="text-sm text-gray-500 font-medium">전체 카테고리</div>
                    </div>
                </div>
            </div>

            {/* 통계 카드 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="border-l-4 border-l-green-500">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">활성 카테고리</p>
                                <p className="text-3xl font-bold text-green-600">{activeCount}</p>
                            </div>
                            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                                <Eye className="w-6 h-6 text-green-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-red-500">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">비활성 카테고리</p>
                                <p className="text-3xl font-bold text-red-600">{inactiveCount}</p>
                            </div>
                            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                                <EyeOff className="w-6 h-6 text-red-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-blue-500">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">총 카테고리</p>
                                <p className="text-3xl font-bold text-blue-600">{categories.length}</p>
                            </div>
                            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                                <Hash className="w-6 h-6 text-blue-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* 검색 및 필터 섹션 */}
            <Card className="shadow-sm border border-gray-200">
                <CardContent className="p-6">
                    <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
                        {/* 검색 */}
                        <div className="flex-1 relative min-w-0">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <Input
                                type="text"
                                placeholder="카테고리 이름이나 표시 이름으로 검색..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 pr-4 py-3 text-base"
                            />
                        </div>

                        {/* 필터 */}
                        <div className="flex items-center gap-2">
                            <Filter className="w-5 h-5 text-gray-400" />
                            <select
                                value={filterActive}
                                onChange={(e) => setFilterActive(e.target.value as 'all' | 'active' | 'inactive')}
                                className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-700 font-medium"
                            >
                                <option value="all">전체 보기</option>
                                <option value="active">활성만</option>
                                <option value="inactive">비활성만</option>
                            </select>
                        </div>

                        {/* 새 카테고리 추가 버튼 */}
                        <Button
                            onClick={handleCreateFormOpen}
                            className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-sm hover:shadow-md transition-all duration-200"
                        >
                            <Plus className="w-5 h-5" />새 카테고리
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* 생성/수정 폼 */}
            {(showCreateForm || editingCategory) && (
                <Card className="border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 shadow-lg">
                    <CardHeader className="pb-4">
                        <CardTitle className="flex items-center gap-3 text-blue-800">
                            {editingCategory ? (
                                <>
                                    <Edit className="w-6 h-6" />
                                    카테고리 수정
                                </>
                            ) : (
                                <>
                                    <Plus className="w-6 h-6" />새 카테고리 추가
                                </>
                            )}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    카테고리 이름 (영문) <span className="text-red-500">*</span>
                                </label>
                                <Input
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value.toLowerCase() })}
                                    placeholder="personality"
                                    className="font-mono text-base py-3"
                                />
                                <p className="text-xs text-gray-500">소문자, 숫자, 언더스코어만 사용 가능</p>
                            </div>
                            <div className="space-y-2">
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    표시 이름 <span className="text-red-500">*</span>
                                </label>
                                <Input
                                    value={formData.display_name}
                                    onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                                    placeholder="성격"
                                    className="text-base py-3"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="block text-sm font-semibold text-gray-700 mb-2">설명</label>
                            <Textarea
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                placeholder="카테고리에 대한 상세한 설명을 입력하세요"
                                rows={3}
                                className="text-base resize-none"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="block text-sm font-semibold text-gray-700 mb-2">정렬 순서</label>
                            <Input
                                type="number"
                                value={formData.sort_order}
                                onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
                                min="0"
                                className="w-32 text-base py-3"
                            />
                            <p className="text-xs text-gray-500">숫자가 작을수록 먼저 표시됩니다</p>
                        </div>

                        <div className="flex gap-3 pt-4">
                            <Button
                                onClick={editingCategory ? handleUpdateCategory : handleCreateCategory}
                                disabled={isSubmitting}
                                className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                            >
                                {isSubmitting ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                        처리 중...
                                    </>
                                ) : (
                                    <>
                                        <Save className="w-5 h-5" />
                                        {editingCategory ? '수정 완료' : '카테고리 생성'}
                                    </>
                                )}
                            </Button>
                            <Button variant="outline" onClick={cancelEdit} className="flex items-center gap-2 px-6 py-3">
                                <X className="w-5 h-5" />
                                취소
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* 카테고리 목록 */}
            <div className="space-y-4">
                {sortedCategories.length === 0 ? (
                    <Card className="border-2 border-dashed border-gray-300 bg-gray-50">
                        <CardContent className="p-12 text-center">
                            <div className="text-6xl mb-6">📂</div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-3">카테고리가 없습니다</h3>
                            <p className="text-gray-600 mb-6 max-w-md mx-auto">
                                {searchTerm || filterActive !== 'all'
                                    ? '검색 조건에 맞는 카테고리가 없습니다. 다른 검색어를 시도해보세요.'
                                    : '첫 번째 카테고리를 생성하여 테스트 분류를 시작해보세요!'}
                            </p>
                            {!searchTerm && filterActive === 'all' && (
                                <Button
                                    onClick={handleCreateFormOpen}
                                    className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700"
                                >
                                    <Plus className="w-5 h-5" />첫 번째 카테고리 생성하기
                                </Button>
                            )}
                        </CardContent>
                    </Card>
                ) : (
                    sortedCategories.map((category) => (
                        <Card
                            key={category.id}
                            className={`transition-all duration-200 hover:shadow-md border-l-4 ${
                                !category.is_active ? 'opacity-75 bg-gray-50 border-l-gray-400' : 'border-l-blue-500'
                            }`}
                        >
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4 flex-1 min-w-0">
                                        <div className="flex-shrink-0">
                                            <GripVertical className="text-gray-400 w-5 h-5" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-3 mb-2">
                                                <h3 className="text-xl font-semibold text-gray-900 truncate">{category.display_name}</h3>
                                                <Badge
                                                    variant="outline"
                                                    className={`text-xs font-medium ${
                                                        category.is_active
                                                            ? 'border-green-200 text-green-700 bg-green-50'
                                                            : 'border-gray-200 text-gray-600 bg-gray-50'
                                                    }`}
                                                >
                                                    {category.is_active ? '활성' : '비활성'}
                                                </Badge>
                                            </div>
                                            <p className="text-sm text-gray-600 font-mono mb-1">{category.name}</p>
                                            {category.description && (
                                                <p className="text-sm text-gray-500 line-clamp-2">{category.description}</p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4 flex-shrink-0">
                                        <div className="text-right mr-4">
                                            <Badge variant="outline" className="text-xs font-medium mb-2">
                                                순서: {category.sort_order}
                                            </Badge>
                                            <div className="text-xs text-gray-500">
                                                {new Date(category.updated_at).toLocaleDateString('ko-KR', {
                                                    year: 'numeric',
                                                    month: 'short',
                                                    day: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                })}
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-1">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleToggleActive(category)}
                                                className={`hover:bg-gray-100 p-2 ${
                                                    category.is_active ? 'text-green-600' : 'text-gray-600'
                                                }`}
                                                title={category.is_active ? '비활성화' : '활성화'}
                                            >
                                                {category.is_active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => startEdit(category)}
                                                className="hover:bg-blue-50 text-blue-600 p-2"
                                                title="수정"
                                            >
                                                <Edit className="w-4 h-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleDeleteCategory(category.id)}
                                                className="hover:bg-red-50 text-red-600 p-2"
                                                title="삭제"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
}
