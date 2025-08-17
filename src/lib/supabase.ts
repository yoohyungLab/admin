import { supabase } from '@/shared/lib/supabaseClient';
import { feedbackService } from '@/shared/api/services/feedback.service';
import { testService } from '@/shared/api/services/test.service';
import { sectionService } from '@/shared/api/services/section.service';
import { categoryService } from '@/shared/api/services/category.service';
import { profileService } from '@/shared/api/services/profile.service';
import { adminAuthService } from '@/shared/api/services/admin-auth.service';
import type { Test, CreateTestRequest } from '../types/test';

// 기존 네이밍 호환 레이어
export { supabase };

export const feedbackApi = feedbackService;
export const testApi = testService;
export const sectionApi = sectionService;
export const categoryApi = categoryService;
export const profileApi = profileService;
export const adminAuthApi = adminAuthService;

// 필요한 타입 재노출 (기존 import 경로 호환용)
export type { Test, CreateTestRequest };
export type { Profile, ProfileFilters, ProfileStats, ProfileWithActivity } from '@/shared/api/services/profile.service';
