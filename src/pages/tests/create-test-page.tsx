import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { testApi, categoryApi } from '../../lib/supabase';

interface Category {
    id: number;
    name: string;
    display_name: string;
    color?: string;
}

interface Question {
    text: string;
    options: Array<{
        text: string;
        score: number;
    }>;
}

interface TestResult {
    title: string;
    description: string;
    condition: {
        type: 'score' | 'pattern';
        value: any;
    };
}

export function CreateTestPage() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [categories, setCategories] = useState<Category[]>([]);
    const [currentStep, setCurrentStep] = useState<'basic' | 'questions' | 'results'>('basic');

    // 기본 정보
    const [basicInfo, setBasicInfo] = useState({
        title: '',
        slug: '',
        category_id: 0,
        description: '',
        emoji: '',
        startMessage: '',
        isPublished: false,
    });

    // 질문들
    const [questions, setQuestions] = useState<Question[]>([
        {
            text: '',
            options: [
                { text: '', score: 0 },
                { text: '', score: 0 },
            ],
        },
    ]);

    // 결과들
    const [results, setResults] = useState<TestResult[]>([
        {
            title: '',
            description: '',
            condition: {
                type: 'score',
                value: { min: 0, max: 10 },
            },
        },
    ]);

    useEffect(() => {
        loadCategories();
    }, []);

    const loadCategories = async () => {
        try {
            const data = await categoryApi.getActiveCategories();
            setCategories(data);
        } catch (error) {
            console.error('카테고리 로드 실패:', error);
        }
    };

    const handleBasicInfoChange = (field: string, value: string | number) => {
        setBasicInfo((prev) => ({ ...prev, [field]: value }));
    };

    const addQuestion = () => {
        setQuestions((prev) => [
            ...prev,
            {
                text: '',
                options: [
                    { text: '', score: 0 },
                    { text: '', score: 0 },
                ],
            },
        ]);
    };

    const updateQuestion = (index: number, field: string, value: any) => {
        setQuestions((prev) => prev.map((q, i) => (i === index ? { ...q, [field]: value } : q)));
    };

    const addQuestionOption = (questionIndex: number) => {
        setQuestions((prev) => prev.map((q, i) => (i === questionIndex ? { ...q, options: [...q.options, { text: '', score: 0 }] } : q)));
    };

    const updateQuestionOption = (questionIndex: number, optionIndex: number, field: string, value: any) => {
        setQuestions((prev) =>
            prev.map((q, i) =>
                i === questionIndex
                    ? {
                          ...q,
                          options: q.options.map((opt, j) => (j === optionIndex ? { ...opt, [field]: value } : opt)),
                      }
                    : q
            )
        );
    };

    const addResult = () => {
        setResults((prev) => [
            ...prev,
            {
                title: '',
                description: '',
                condition: {
                    type: 'score',
                    value: { min: 0, max: 10 },
                },
            },
        ]);
    };

    const updateResult = (index: number, field: string, value: any) => {
        setResults((prev) => prev.map((r, i) => (i === index ? { ...r, [field]: value } : r)));
    };

    const handleSubmit = async () => {
        setLoading(true);
        try {
            // 테스트 생성
            const testData = {
                ...basicInfo,
                category_id: basicInfo.category_id || null,
                tags: [],
                created_by: null,
            };

            const test = await testApi.createTest(testData);

            // 질문들 생성
            for (const question of questions) {
                const questionData = {
                    order_index: questions.indexOf(question) + 1,
                    text: question.text,
                };

                const createdQuestion = await testApi.createQuestion(test.id, questionData);

                // 질문 옵션들 생성
                for (const option of question.options) {
                    await testApi.createQuestionOption(createdQuestion.id, {
                        text: option.text,
                        score: option.score,
                    });
                }
            }

            // 결과들 생성
            for (const result of results) {
                await testApi.createTestResult(test.id, {
                    title: result.title,
                    description: result.description,
                    keywords: [],
                    recommendations: [],
                    condition_type: result.condition.type,
                    condition_value: result.condition.value,
                });
            }

            navigate('/tests');
        } catch (error) {
            console.error('테스트 생성 실패:', error);
            alert('테스트 생성에 실패했습니다.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">새 테스트 생성</h1>
                    <p className="text-gray-600 mt-2">새로운 테스트를 만들어보세요.</p>
                </div>
                <Button variant="outline" onClick={() => navigate('/tests')}>
                    취소
                </Button>
            </div>

            {/* 단계 표시 */}
            <div className="flex space-x-4 mb-6">
                <div
                    className={`px-4 py-2 rounded-lg ${
                        currentStep === 'basic' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
                    }`}
                >
                    1. 기본 정보
                </div>
                <div
                    className={`px-4 py-2 rounded-lg ${
                        currentStep === 'questions' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
                    }`}
                >
                    2. 질문 작성
                </div>
                <div
                    className={`px-4 py-2 rounded-lg ${
                        currentStep === 'results' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
                    }`}
                >
                    3. 결과 설정
                </div>
            </div>

            {currentStep === 'basic' && (
                <Card className="admin-card">
                    <CardHeader>
                        <CardTitle>기본 정보</CardTitle>
                        <CardDescription>테스트의 기본 정보를 입력하세요.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">테스트 제목</label>
                                <Input
                                    value={basicInfo.title}
                                    onChange={(e) => handleBasicInfoChange('title', e.target.value)}
                                    placeholder="예: MBTI 성향 테스트"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">URL 슬러그</label>
                                <Input
                                    value={basicInfo.slug}
                                    onChange={(e) => handleBasicInfoChange('slug', e.target.value)}
                                    placeholder="예: mbti-test"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">카테고리</label>
                            <Select
                                value={basicInfo.category_id.toString()}
                                onValueChange={(value) => handleBasicInfoChange('category_id', parseInt(value))}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="카테고리 선택" />
                                </SelectTrigger>
                                <SelectContent>
                                    {categories.map((category) => (
                                        <SelectItem key={category.id} value={category.id.toString()}>
                                            {category.display_name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">이모지</label>
                            <Input
                                value={basicInfo.emoji}
                                onChange={(e) => handleBasicInfoChange('emoji', e.target.value)}
                                placeholder="🧠"
                                maxLength={2}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">설명</label>
                            <Textarea
                                value={basicInfo.description}
                                onChange={(e) => handleBasicInfoChange('description', e.target.value)}
                                placeholder="테스트에 대한 간단한 설명을 입력하세요."
                                rows={3}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">시작 메시지</label>
                            <Textarea
                                value={basicInfo.startMessage}
                                onChange={(e) => handleBasicInfoChange('startMessage', e.target.value)}
                                placeholder="테스트 시작 시 사용자에게 보여줄 메시지"
                                rows={2}
                            />
                        </div>

                        <div className="flex justify-end">
                            <Button onClick={() => setCurrentStep('questions')}>다음: 질문 작성</Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {currentStep === 'questions' && (
                <Card className="admin-card">
                    <CardHeader>
                        <CardTitle>질문 작성</CardTitle>
                        <CardDescription>테스트에 사용할 질문들을 작성하세요.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {questions.map((question, questionIndex) => (
                            <div key={questionIndex} className="border border-gray-200 rounded-lg p-4">
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">질문 {questionIndex + 1}</label>
                                    <Textarea
                                        value={question.text}
                                        onChange={(e) => updateQuestion(questionIndex, 'text', e.target.value)}
                                        placeholder="질문을 입력하세요."
                                        rows={2}
                                    />
                                </div>

                                <div className="space-y-3">
                                    <label className="block text-sm font-medium text-gray-700">답변 옵션</label>
                                    {question.options.map((option, optionIndex) => (
                                        <div key={optionIndex} className="flex gap-3">
                                            <Input
                                                value={option.text}
                                                onChange={(e) => updateQuestionOption(questionIndex, optionIndex, 'text', e.target.value)}
                                                placeholder={`옵션 ${optionIndex + 1}`}
                                                className="flex-1"
                                            />
                                            <Input
                                                type="number"
                                                value={option.score}
                                                onChange={(e) =>
                                                    updateQuestionOption(questionIndex, optionIndex, 'score', parseInt(e.target.value))
                                                }
                                                placeholder="점수"
                                                className="w-20"
                                            />
                                        </div>
                                    ))}
                                    <Button variant="outline" size="sm" onClick={() => addQuestionOption(questionIndex)}>
                                        옵션 추가
                                    </Button>
                                </div>
                            </div>
                        ))}

                        <Button variant="outline" onClick={addQuestion}>
                            질문 추가
                        </Button>

                        <div className="flex justify-between">
                            <Button variant="outline" onClick={() => setCurrentStep('basic')}>
                                이전
                            </Button>
                            <Button onClick={() => setCurrentStep('results')}>다음: 결과 설정</Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {currentStep === 'results' && (
                <Card className="admin-card">
                    <CardHeader>
                        <CardTitle>결과 설정</CardTitle>
                        <CardDescription>테스트 결과를 설정하세요.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {results.map((result, resultIndex) => (
                            <div key={resultIndex} className="border border-gray-200 rounded-lg p-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">결과 제목</label>
                                        <Input
                                            value={result.title}
                                            onChange={(e) => updateResult(resultIndex, 'title', e.target.value)}
                                            placeholder="예: INTJ - 건축가"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">조건 타입</label>
                                        <Select
                                            value={result.condition.type}
                                            onValueChange={(value) =>
                                                updateResult(resultIndex, 'condition', { ...result.condition, type: value })
                                            }
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="score">점수 범위</SelectItem>
                                                <SelectItem value="pattern">패턴</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">결과 설명</label>
                                    <Textarea
                                        value={result.description}
                                        onChange={(e) => updateResult(resultIndex, 'description', e.target.value)}
                                        placeholder="결과에 대한 설명을 입력하세요."
                                        rows={3}
                                    />
                                </div>
                            </div>
                        ))}

                        <Button variant="outline" onClick={addResult}>
                            결과 추가
                        </Button>

                        <div className="flex justify-between">
                            <Button variant="outline" onClick={() => setCurrentStep('questions')}>
                                이전
                            </Button>
                            <Button onClick={handleSubmit} disabled={loading}>
                                {loading ? '생성 중...' : '테스트 생성'}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
