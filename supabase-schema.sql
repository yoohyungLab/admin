-- 테스트 테이블
CREATE TABLE tests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    slug VARCHAR(100) UNIQUE NOT NULL,
    title VARCHAR(200) NOT NULL,
    category_id INTEGER REFERENCES categories(id),
    description TEXT,
    emoji VARCHAR(10),
    thumbnail_image TEXT,
    start_message TEXT,
    is_published BOOLEAN DEFAULT false,
    tags TEXT[],
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 질문 테이블
CREATE TABLE questions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    test_id UUID REFERENCES tests(id) ON DELETE CASCADE,
    order_index INTEGER NOT NULL,
    text TEXT NOT NULL,
    group_name VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 질문 옵션 테이블
CREATE TABLE question_options (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    score INTEGER NOT NULL,
    color VARCHAR(20),
    style VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 테스트 결과 테이블
CREATE TABLE test_results (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    test_id UUID REFERENCES tests(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    keywords TEXT[],
    recommendations TEXT[],
    background_image TEXT,
    condition_type VARCHAR(20) NOT NULL, -- 'score' or 'pattern'
    condition_value JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 사용자 응답 테이블
CREATE TABLE user_responses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    test_id UUID REFERENCES tests(id) ON DELETE CASCADE,
    session_id VARCHAR(100) NOT NULL,
    answers JSONB NOT NULL, -- 질문별 답변 저장
    result_id UUID REFERENCES test_results(id),
    score INTEGER,
    metadata JSONB, -- 성별, 나이 등 추가 정보
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 섹션 관리 테이블
CREATE TABLE sections (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    display_name VARCHAR(200) NOT NULL,
    description TEXT,
    icon VARCHAR(50),
    color VARCHAR(20),
    order_index INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 섹션별 테스트 배치 관리 테이블
CREATE TABLE section_tests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    section_id UUID REFERENCES sections(id) ON DELETE CASCADE,
    test_id UUID REFERENCES tests(id) ON DELETE CASCADE,
    order_index INTEGER NOT NULL DEFAULT 0,
    is_featured BOOLEAN DEFAULT false, -- 섹션 내에서 특별히 강조할 테스트
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(section_id, test_id)
);

-- 카테고리 관리 테이블 (기존 하드코딩된 카테고리를 DB로 관리)
CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    display_name VARCHAR(200) NOT NULL,
    description TEXT,
    color VARCHAR(20),
    order_index INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX idx_tests_slug ON tests(slug);
CREATE INDEX idx_tests_category_id ON tests(category_id);
CREATE INDEX idx_tests_published ON tests(is_published);
CREATE INDEX idx_questions_test_id ON questions(test_id);
CREATE INDEX idx_question_options_question_id ON question_options(question_id);
CREATE INDEX idx_test_results_test_id ON test_results(test_id);
CREATE INDEX idx_user_responses_test_id ON user_responses(test_id);
CREATE INDEX idx_user_responses_session_id ON user_responses(session_id);
CREATE INDEX idx_sections_order ON sections(order_index);
CREATE INDEX idx_sections_active ON sections(is_active);
CREATE INDEX idx_section_tests_section_id ON section_tests(section_id);
CREATE INDEX idx_section_tests_test_id ON section_tests(test_id);
CREATE INDEX idx_section_tests_order ON section_tests(order_index);
CREATE INDEX idx_categories_order ON categories(order_index);
CREATE INDEX idx_categories_active ON categories(is_active);

-- RLS (Row Level Security) 설정
ALTER TABLE tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE question_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE section_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- 관리자용 정책 (모든 데이터 접근 가능)
CREATE POLICY "Admin can manage all tests" ON tests FOR ALL USING (true);
CREATE POLICY "Admin can manage all questions" ON questions FOR ALL USING (true);
CREATE POLICY "Admin can manage all question options" ON question_options FOR ALL USING (true);
CREATE POLICY "Admin can manage all test results" ON test_results FOR ALL USING (true);
CREATE POLICY "Admin can view all user responses" ON user_responses FOR SELECT USING (true);
CREATE POLICY "Admin can manage all sections" ON sections FOR ALL USING (true);
CREATE POLICY "Admin can manage all section tests" ON section_tests FOR ALL USING (true);
CREATE POLICY "Admin can manage all categories" ON categories FOR ALL USING (true);

-- 공개 테스트 조회 정책
CREATE POLICY "Public can view published tests" ON tests FOR SELECT USING (is_published = true);
CREATE POLICY "Public can view questions for published tests" ON questions FOR SELECT USING (
    EXISTS (SELECT 1 FROM tests WHERE tests.id = questions.test_id AND tests.is_published = true)
);
CREATE POLICY "Public can view options for published tests" ON question_options FOR SELECT USING (
    EXISTS (SELECT 1 FROM questions 
            JOIN tests ON tests.id = questions.test_id 
            WHERE questions.id = question_options.question_id AND tests.is_published = true)
);
CREATE POLICY "Public can view results for published tests" ON test_results FOR SELECT USING (
    EXISTS (SELECT 1 FROM tests WHERE tests.id = test_results.test_id AND tests.is_published = true)
);
CREATE POLICY "Public can view active sections" ON sections FOR SELECT USING (is_active = true);
CREATE POLICY "Public can view active section tests" ON section_tests FOR SELECT USING (
    is_active = true AND 
    EXISTS (SELECT 1 FROM sections WHERE sections.id = section_tests.section_id AND sections.is_active = true)
);
CREATE POLICY "Public can view active categories" ON categories FOR SELECT USING (is_active = true);

-- 사용자 응답 저장 정책
CREATE POLICY "Users can insert responses" ON user_responses FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can view own responses" ON user_responses FOR SELECT USING (true);

-- 함수: 응답 수 업데이트
CREATE OR REPLACE FUNCTION update_test_response_count()
RETURNS TRIGGER AS $$
BEGIN
    -- 테스트별 응답 수를 캐시 테이블에 저장하거나 직접 계산
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 트리거 설정
CREATE TRIGGER trigger_update_response_count
    AFTER INSERT ON user_responses
    FOR EACH ROW
    EXECUTE FUNCTION update_test_response_count();

-- 함수: 섹션별 테스트 조회
CREATE OR REPLACE FUNCTION get_tests_by_section(section_name TEXT)
RETURNS TABLE (
    test_id UUID,
    test_slug VARCHAR,
    test_title VARCHAR,
    test_description TEXT,
    test_emoji VARCHAR,
    test_thumbnail TEXT,
    test_category_id INTEGER,
    category_name VARCHAR,
    category_display_name VARCHAR,
    order_index INTEGER,
    is_featured BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.id,
        t.slug,
        t.title,
        t.description,
        t.emoji,
        t.thumbnail_image,
        t.category_id,
        c.name,
        c.display_name,
        st.order_index,
        st.is_featured
    FROM section_tests st
    JOIN tests t ON st.test_id = t.id
    JOIN sections s ON st.section_id = s.id
    LEFT JOIN categories c ON t.category_id = c.id
    WHERE s.name = section_name 
        AND s.is_active = true 
        AND st.is_active = true 
        AND t.is_published = true
    ORDER BY st.order_index ASC, st.is_featured DESC;
END;
$$ LANGUAGE plpgsql;

-- 함수: 카테고리별 테스트 조회
CREATE OR REPLACE FUNCTION get_tests_by_category(category_name TEXT)
RETURNS TABLE (
    test_id UUID,
    test_slug VARCHAR,
    test_title VARCHAR,
    test_description TEXT,
    test_emoji VARCHAR,
    test_thumbnail TEXT,
    category_name VARCHAR,
    category_display_name VARCHAR,
    tags TEXT[]
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.id,
        t.slug,
        t.title,
        t.description,
        t.emoji,
        t.thumbnail_image,
        c.name,
        c.display_name,
        t.tags
    FROM tests t
    JOIN categories c ON t.category_id = c.id
    WHERE c.name = category_name 
        AND c.is_active = true 
        AND t.is_published = true
    ORDER BY t.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- 트리거: 섹션 테스트 순서 자동 조정
CREATE OR REPLACE FUNCTION update_section_test_order()
RETURNS TRIGGER AS $$
BEGIN
    -- 같은 섹션 내에서 중복된 order_index가 있으면 자동으로 조정
    IF EXISTS (
        SELECT 1 FROM section_tests 
        WHERE section_id = NEW.section_id 
        AND order_index = NEW.order_index 
        AND id != NEW.id
    ) THEN
        UPDATE section_tests 
        SET order_index = order_index + 1
        WHERE section_id = NEW.section_id 
        AND order_index >= NEW.order_index 
        AND id != NEW.id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_section_test_order
    BEFORE INSERT OR UPDATE ON section_tests
    FOR EACH ROW
    EXECUTE FUNCTION update_section_test_order(); 