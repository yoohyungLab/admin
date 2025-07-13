import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { sectionApi } from '@/lib/supabase';
import { Plus, Edit, Trash2, Eye, EyeOff, GripVertical, Settings } from 'lucide-react';

interface Section {
    id: string;
    name: string;
    display_name: string;
    description?: string;
    icon?: string;
    color?: string;
    order_index: number;
    is_active: boolean;
    created_at: string;
}

export default function SectionManagementPage() {
    const [sections, setSections] = useState<Section[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingSection, setEditingSection] = useState<Section | null>(null);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        display_name: '',
        description: '',
        icon: '',
        color: '',
        order_index: 0,
    });

    useEffect(() => {
        loadSections();
    }, []);

    const loadSections = async () => {
        try {
            const data = await sectionApi.getAllSections();
            setSections(data);
        } catch (error) {
            console.error('섹션 로드 실패:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateSection = async () => {
        try {
            await sectionApi.createSection(formData);
            setShowCreateForm(false);
            setFormData({ name: '', display_name: '', description: '', icon: '', color: '', order_index: 0 });
            loadSections();
        } catch (error) {
            console.error('섹션 생성 실패:', error);
        }
    };

    const handleUpdateSection = async () => {
        if (!editingSection) return;

        try {
            await sectionApi.updateSection(editingSection.id, formData);
            setEditingSection(null);
            setFormData({ name: '', display_name: '', description: '', icon: '', color: '', order_index: 0 });
            loadSections();
        } catch (error) {
            console.error('섹션 수정 실패:', error);
        }
    };

    const handleDeleteSection = async (id: string) => {
        if (!confirm('정말로 이 섹션을 삭제하시겠습니까?')) return;

        try {
            await sectionApi.deleteSection(id);
            loadSections();
        } catch (error) {
            console.error('섹션 삭제 실패:', error);
        }
    };

    const handleToggleActive = async (section: Section) => {
        try {
            await sectionApi.updateSection(section.id, { is_active: !section.is_active });
            loadSections();
        } catch (error) {
            console.error('섹션 상태 변경 실패:', error);
        }
    };

    const startEdit = (section: Section) => {
        setEditingSection(section);
        setFormData({
            name: section.name,
            display_name: section.display_name,
            description: section.description || '',
            icon: section.icon || '',
            color: section.color || '',
            order_index: section.order_index,
        });
    };

    const cancelEdit = () => {
        setEditingSection(null);
        setShowCreateForm(false);
        setFormData({ name: '', display_name: '', description: '', icon: '', color: '', order_index: 0 });
    };

    if (loading) {
        return <div className="p-6">로딩 중...</div>;
    }

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold">섹션 관리</h1>
                <Button onClick={() => setShowCreateForm(true)} className="flex items-center gap-2">
                    <Plus size={16} />새 섹션 추가
                </Button>
            </div>

            {/* 생성/수정 폼 */}
            {(showCreateForm || editingSection) && (
                <Card>
                    <CardHeader>
                        <CardTitle>{editingSection ? '섹션 수정' : '새 섹션 추가'}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-2">섹션 이름 (영문)</label>
                                <Input
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="trending"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2">표시 이름</label>
                                <Input
                                    value={formData.display_name}
                                    onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                                    placeholder="🔥 요즘 뜨는 테스트"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">설명</label>
                            <Textarea
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                placeholder="섹션에 대한 설명을 입력하세요"
                            />
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-2">아이콘</label>
                                <Input
                                    value={formData.icon}
                                    onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                                    placeholder="🔥"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2">색상</label>
                                <Input
                                    value={formData.color}
                                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                                    placeholder="pink"
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
                            <Button onClick={editingSection ? handleUpdateSection : handleCreateSection}>
                                {editingSection ? '수정' : '생성'}
                            </Button>
                            <Button variant="outline" onClick={cancelEdit}>
                                취소
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* 섹션 목록 */}
            <div className="grid gap-4">
                {sections.map((section) => (
                    <Card key={section.id} className={!section.is_active ? 'opacity-60' : ''}>
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <GripVertical className="text-gray-400 cursor-move" />
                                    <div className="flex items-center gap-2">
                                        <span className="text-2xl">{section.icon}</span>
                                        <div>
                                            <h3 className="font-semibold">{section.display_name}</h3>
                                            <p className="text-sm text-gray-600">{section.name}</p>
                                            {section.description && <p className="text-sm text-gray-500">{section.description}</p>}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-gray-500">순서: {section.order_index}</span>
                                    <Link
                                        to={`/sections/${section.id}/tests`}
                                        className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                                    >
                                        <Settings size={12} />
                                        테스트 관리
                                    </Link>
                                    <Button variant="ghost" size="sm" onClick={() => handleToggleActive(section)}>
                                        {section.is_active ? <Eye size={16} /> : <EyeOff size={16} />}
                                    </Button>
                                    <Button variant="ghost" size="sm" onClick={() => startEdit(section)}>
                                        <Edit size={16} />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleDeleteSection(section.id)}
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
