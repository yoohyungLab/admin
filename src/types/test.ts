export interface Question {
    id: string;
    order: number;
    text: string;
    options: QuestionOption[];
    group?: string;
}

export interface QuestionOption {
    id: string;
    text: string;
    score: number;
    color?: string;
    style?: string;
}

export interface TestResult {
    id: string;
    title: string;
    description: string;
    keywords: string[];
    recommendations: string[];
    backgroundImage?: string;
    condition: {
        type: 'score' | 'pattern';
        value: any;
    };
}

export interface Test {
    id: string;
    slug: string;
    title: string;
    category: string;
    description: string;
    emoji: string;
    thumbnailImage?: string;
    startMessage: string;
    questions: Question[];
    results: TestResult[];
    isPublished: boolean;
    tags: string[];
    createdBy: string;
    createdAt: string;
    updatedAt: string;
}

export interface CreateTestRequest {
    slug: string;
    title: string;
    category: string;
    description: string;
    emoji: string;
    thumbnailImage?: string;
    startMessage: string;
    questions: Question[];
    results: TestResult[];
    isPublished: boolean;
    tags: string[];
}
