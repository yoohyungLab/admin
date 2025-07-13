import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { sectionApi, testApi } from '@/lib/supabase';
import { Plus, Trash2, Star, StarOff, GripVertical, ArrowLeft } from 'lucide-react';

interface Section {
    id: string;
    name: string;
    display_name: string;
    icon?: string;
}

interface Test {
    id: string;
    slug: string;
    title: string;
    description?: string;
    emoji?: string;
    thumbnail_image?: string;
}

interface SectionTest {
    test_id: string;
    test_slug: string;
    test_title: string;
    test_description?: string;
    test_emoji?: string;
    test_thumbnail?: string;
    order_index: number;
    is_featured: boolean;
}

export default function SectionTestManagementPage() {
    const { sectionId } = useParams<{ sectionId: string }>();
    const [section, setSection] = useState<Section | null>(null);
    const [sectionTests, setSectionTests] = useState<SectionTest[]>([]);
    const [availableTests, setAvailableTests] = useState<Test[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddForm, setShowAddForm] = useState(false);
    const [selectedTestId, setSelectedTestId] = useState('');

    useEffect(() => {
        if (sectionId) {
            loadSectionData();
        }
    }, [sectionId]);

    const loadSectionData = async () => {
        if (!sectionId) return;

        try {
            setLoading(true);

            // 섹션 정보 로드
            const sections = await sectionApi.getAllSections();
            const currentSection = sections.find((s) => s.id === sectionId);
            if (currentSection) {
                setSection(currentSection);
            }

            // 섹션별 테스트 로드
            const tests = await sectionApi.getTestsBySection(currentSection?.name || '');
            setSectionTests(tests);

            // 사용 가능한 테스트 로드 (섹션에 없는 것들)
            const allTests = await testApi.getPublishedTests();
            const sectionTestIds = new Set(tests.map((t) => t.test_id));
            const available = allTests.filter((test) => !sectionTestIds.has(test.id));
            setAvailableTests(available);
        } catch (error) {
            console.error('데이터 로드 실패:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddTestToSection = async () => {
        if (!sectionId || !selectedTestId) return;

        try {
            await sectionApi.addTestToSection(sectionId, selectedTestId, sectionTests.length);
            setSelectedTestId('');
            setShowAddForm(false);
            loadSectionData();
        } catch (error) {
            console.error('테스트 추가 실패:', error);
        }
    };

    const handleRemoveTestFromSection = async (testId: string) => {
        if (!sectionId) return;

        if (!confirm('정말로 이 테스트를 섹션에서 제거하시겠습니까?')) return;

        try {
            await sectionApi.removeTestFromSection(sectionId, testId);
            loadSectionData();
        } catch (error) {
            console.error('테스트 제거 실패:', error);
        }
    };

    const handleToggleFeatured = async (testId: string, currentFeatured: boolean) => {
        if (!sectionId) return;

        try {
            await sectionApi.updateSectionTestFeatured(sectionId, testId, !currentFeatured);
            loadSectionData();
        } catch (error) {
            console.error('피처드 상태 변경 실패:', error);
        }
    };

    const handleReorderTests = async (testId: string, newOrder: number) => {
        if (!sectionId) return;

        try {
            const newOrders = sectionTests.map((test, index) => ({
                testId: test.test_id,
                orderIndex: test.test_id === testId ? newOrder : index,
            }));

            await sectionApi.updateSectionTestOrder(sectionId, newOrders);
            loadSectionData();
        } catch (error) {
            console.error('순서 변경 실패:', error);
        }
    };

    if (loading) {
        return <div className="p-6">로딩 중...</div>;
    }

    if (!section) {
        return <div className="p-6">섹션을 찾을 수 없습니다.</div>;
    }

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" onClick={() => window.history.back()}>
                    <ArrowLeft size={16} />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold">{section.display_name} 테스트 관리</h1>
                    <p className="text-gray-600">섹션에 포함된 테스트들을 관리합니다</p>
                </div>
            </div>

            {/* 테스트 추가 폼 */}
            {showAddForm && (
                <Card>
                    <CardHeader>
                        <CardTitle>테스트 추가</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-2">테스트 선택</label>
                            <select
                                value={selectedTestId}
                                onChange={(e) => setSelectedTestId(e.target.value)}
                                className="w-full p-2 border border-gray-300 rounded-md"
                            >
                                <option value="">테스트를 선택하세요</option>
                                {availableTests.map((test) => (
                                    <option key={test.id} value={test.id}>
                                        {test.title}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="flex gap-2">
                            <Button onClick={handleAddTestToSection} disabled={!selectedTestId}>
                                추가
                            </Button>
                            <Button variant="outline" onClick={() => setShowAddForm(false)}>
                                취소
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* 테스트 추가 버튼 */}
            {!showAddForm && availableTests.length > 0 && (
                <Button onClick={() => setShowAddForm(true)} className="flex items-center gap-2">
                    <Plus size={16} />
                    테스트 추가
                </Button>
            )}

            {/* 섹션 테스트 목록 */}
            <div className="space-y-4">
                <h2 className="text-lg font-semibold">포함된 테스트 ({sectionTests.length}개)</h2>
                {sectionTests.length === 0 ? (
                    <Card>
                        <CardContent className="p-8 text-center text-gray-500">이 섹션에 포함된 테스트가 없습니다.</CardContent>
                    </Card>
                ) : (
                    <div className="grid gap-4">
                        {sectionTests.map((sectionTest, index) => (
                            <Card key={sectionTest.test_id} className={sectionTest.is_featured ? 'ring-2 ring-yellow-400' : ''}>
                                <CardContent className="p-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <GripVertical className="text-gray-400 cursor-move" />
                                            <div className="flex items-center gap-3">
                                                <span className="text-2xl">{sectionTest.test_emoji}</span>
                                                <div>
                                                    <h3 className="font-semibold">{sectionTest.test_title}</h3>
                                                    <p className="text-sm text-gray-600">{sectionTest.test_slug}</p>
                                                    {sectionTest.test_description && (
                                                        <p className="text-sm text-gray-500">{sectionTest.test_description}</p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm text-gray-500">순서: {sectionTest.order_index}</span>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleToggleFeatured(sectionTest.test_id, sectionTest.is_featured)}
                                                className={sectionTest.is_featured ? 'text-yellow-600' : ''}
                                            >
                                                {sectionTest.is_featured ? <Star size={16} /> : <StarOff size={16} />}
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleReorderTests(sectionTest.test_id, Math.max(0, index - 1))}
                                                disabled={index === 0}
                                            >
                                                ↑
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleReorderTests(sectionTest.test_id, index + 1)}
                                                disabled={index === sectionTests.length - 1}
                                            >
                                                ↓
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleRemoveTestFromSection(sectionTest.test_id)}
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
                )}
            </div>
        </div>
    );
}
