import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { categoryApi } from '@/lib/supabase';
import { Plus, Edit, Trash2, Eye, EyeOff, GripVertical } from 'lucide-react';

interface Category {
    id: number;
    name: string;
    display_name: string;
    description?: string;
    color?: string;
    order_index: number;
    is_active: boolean;
    created_at: string;
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
        color: '',
        order_index: 0,
    });

    useEffect(() => {
        loadCategories();
    }, []);

    const loadCategories = async () => {
        try {
            const data = await categoryApi.getAllCategories();
            setCategories(data);
        } catch (error) {
            console.error('카테고리 로드 실패:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateCategory = async () => {
        try {
            await categoryApi.createCategory(formData);
            setShowCreateForm(false);
            setFormData({ name: '', display_name: '', description: '', color: '', order_index: 0 });
            loadCategories();
        } catch (error) {
            console.error('카테고리 생성 실패:', error);
        }
    };

    const handleUpdateCategory = async () => {
        if (!editingCategory) return;

        try {
            await categoryApi.updateCategory(editingCategory.id, formData);
            setEditingCategory(null);
            setFormData({ name: '', display_name: '', description: '', color: '', order_index: 0 });
            loadCategories();
        } catch (error) {
            console.error('카테고리 수정 실패:', error);
        }
    };

    const handleDeleteCategory = async (id: number) => {
        if (!confirm('정말로 이 카테고리를 삭제하시겠습니까?')) return;

        try {
            await categoryApi.deleteCategory(id);
            loadCategories();
        } catch (error) {
            console.error('카테고리 삭제 실패:', error);
        }
    };

    const handleToggleActive = async (category: Category) => {
        try {
            await categoryApi.updateCategory(category.id, { is_active: !category.is_active });
            loadCategories();
        } catch (error) {
            console.error('카테고리 상태 변경 실패:', error);
        }
    };

    const startEdit = (category: Category) => {
        setEditingCategory(category);
        setFormData({
            name: category.name,
            display_name: category.display_name,
            description: category.description || '',
            color: category.color || '',
            order_index: category.order_index,
        });
    };

    const cancelEdit = () => {
        setEditingCategory(null);
        setShowCreateForm(false);
        setFormData({ name: '', display_name: '', description: '', color: '', order_index: 0 });
    };

    if (loading) {
        return <div className="p-6">로딩 중...</div>;
    }

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold">카테고리 관리</h1>
                <Button onClick={() => setShowCreateForm(true)} className="flex items-center gap-2">
                    <Plus size={16} />새 카테고리 추가
                </Button>
            </div>

            {/* 생성/수정 폼 */}
            {(showCreateForm || editingCategory) && (
                <Card>
                    <CardHeader>
                        <CardTitle>{editingCategory ? '카테고리 수정' : '새 카테고리 추가'}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-2">카테고리 이름 (영문)</label>
                                <Input
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="personality"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2">표시 이름</label>
                                <Input
                                    value={formData.display_name}
                                    onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                                    placeholder="성격"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">설명</label>
                            <Textarea
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                placeholder="카테고리에 대한 설명을 입력하세요"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-2">색상</label>
                                <Input
                                    value={formData.color}
                                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                                    placeholder="blue"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2">순서</label>
                                <Input
                                    type="number"
                                    value={formData.order_index}
                                    onChange={(e) => setFormData({ ...formData, order_index: parseInt(e.target.value) || 0 })}
                                />
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <Button onClick={editingCategory ? handleUpdateCategory : handleCreateCategory}>
                                {editingCategory ? '수정' : '생성'}
                            </Button>
                            <Button variant="outline" onClick={cancelEdit}>
                                취소
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* 카테고리 목록 */}
            <div className="grid gap-4">
                {categories.map((category) => (
                    <Card key={category.id} className={!category.is_active ? 'opacity-60' : ''}>
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <GripVertical className="text-gray-400 cursor-move" />
                                    <div>
                                        <h3 className="font-semibold">{category.display_name}</h3>
                                        <p className="text-sm text-gray-600">{category.name}</p>
                                        {category.description && <p className="text-sm text-gray-500">{category.description}</p>}
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-gray-500">순서: {category.order_index}</span>
                                    {category.color && (
                                        <div className="w-4 h-4 rounded-full border" style={{ backgroundColor: category.color }} />
                                    )}
                                    <Button variant="ghost" size="sm" onClick={() => handleToggleActive(category)}>
                                        {category.is_active ? <Eye size={16} /> : <EyeOff size={16} />}
                                    </Button>
                                    <Button variant="ghost" size="sm" onClick={() => startEdit(category)}>
                                        <Edit size={16} />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleDeleteCategory(category.id)}
                                        className="text-red-600 hover:text-red-700"
                                    >
                                        <Trash2 size={16} />
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
