// Exam Module Type Definitions

interface ExamCategory {
   id: number;
   name: string;
   slug: string;
   description?: string;
   sort: number;
   is_active: boolean;
   exams_count?: number;
   created_at: string;
   updated_at: string;
}

interface Exam {
   id: number;
   title: string;
   slug: string;
   short_description?: string;
   description?: string;
   instructor_id: number;
   exam_category_id: number;
   instructor: Instructor;
   exam_category: ExamCategory;
   pricing_type: 'free' | 'paid';
   price: number;
   discount: number;
   discount_price: number;
   duration_hours: number;
   duration_minutes: number;
   total_duration_minutes: number;
   pass_mark: number;
   total_marks: number;
   max_attempts: number;
   total_questions: number;
   status: 'draft' | 'published' | 'archived';
   level?: 'beginner' | 'intermediate' | 'advanced' | 'expert';
   thumbnail?: string;
   banner?: string;
   expiry_type?: 'lifetime' | 'limited';
   expiry_duration?: number;
   meta_title?: string;
   meta_keywords?: string;
   meta_description?: string;
   og_title?: string;
   og_description?: string;
   questions?: ExamQuestion[];
   enrollments_count?: number;
   reviews_count?: number;
   average_rating?: number;
   created_at: string;
   updated_at: string;
}

type ExamQuestionType = 'multiple_choice' | 'multiple_select' | 'matching' | 'fill_blank' | 'ordering' | 'short_answer' | 'listening';

interface ExamQuestionOption {
   id: number;
   exam_question_id: number;
   option_text: string;
   is_correct: boolean;
   sort: number;
   created_at: string;
   updated_at: string;
}

interface ExamQuestion {
   id: number;
   exam_id: number;
   question_type: ExamQuestionType;
   title: string;
   description?: string;
   marks: number;
   sort: number;
   options?: {
      answers?: string[];
      matches?: Array<{ id: number; question: string; answer: string }>;
      items?: string[];
      correct_order?: number[];
   };
   question_options?: ExamQuestionOption[];
   media?: Media[];
   created_at: string;
   updated_at: string;
}

interface ExamEnrollment {
   id: number;
   user_id: number;
   exam_id: number;
   enrollment_type: 'lifetime' | 'limited';
   entry_date: string;
   expiry_date?: string;
   is_active: boolean;
   user?: User;
   exam?: Exam;
   created_at: string;
   updated_at: string;
}

interface ExamAttempt {
   id: number;
   user_id: number;
   exam_id: number;
   attempt_number: number;
   start_time?: string;
   end_time?: string;
   duration_minutes?: number;
   total_marks: number;
   obtained_marks: number;
   percentage: number;
   correct_answers: number;
   incorrect_answers: number;
   is_passed: boolean;
   status: 'in_progress' | 'completed' | 'abandoned';
   user?: User;
   exam?: Exam;
   attempt_answers?: ExamAttemptAnswer[];
   created_at: string;
   updated_at: string;
}

interface ExamAttemptAnswer {
   id: number;
   exam_attempt_id: number;
   exam_question_id: number;
   answer_data: {
      selected_option_id?: number;
      selected_option_ids?: number[];
      matches?: Array<{ id: number; answer: string }>;
      answers?: string[];
      order?: number[];
      text?: string;
   };
   is_correct?: boolean;
   marks_obtained: number;
   exam_question?: ExamQuestion;
   created_at: string;
   updated_at: string;
}

interface ExamCart {
   id: number;
   user_id: number;
   exam_id: number;
   exam?: Exam;
   created_at: string;
   updated_at: string;
}

interface ExamWishlist {
   id: number;
   user_id: number;
   exam_id: number;
   exam?: Exam;
   created_at: string;
   updated_at: string;
}

interface ExamReview {
   id: number;
   user_id: number;
   exam_id: number;
   rating: number;
   review?: string;
   user?: User;
   exam?: Exam;
   created_at: string;
   updated_at: string;
}

interface ExamCoupon {
   id: number;
   exam_id?: number;
   code: string;
   discount_type: 'percentage' | 'fixed';
   discount_value: number;
   valid_from?: string;
   valid_to?: string;
   usage_limit?: number;
   used_count: number;
   is_active: boolean;
   exam?: Exam;
   created_at: string;
   updated_at: string;
}

interface ExamStatistics {
   total_enrollments: number;
   total_attempts: number;
   completed_attempts: number;
   average_score: number;
   pass_rate: number;
   total_reviews: number;
   average_rating: number;
}

interface ExamAttemptAnalytics {
   attempt: ExamAttempt;
   by_question_type: {
      [key: string]: {
         total: number;
         correct: number;
         incorrect: number;
         pending: number;
      };
   };
   percentage: number;
   duration_minutes?: number;
   time_per_question?: number;
}

interface EnrollmentProgress {
   enrollment: ExamEnrollment;
   is_active: boolean;
   attempts_used: number;
   attempts_remaining: number;
   completed_attempts: number;
   best_score: number;
   has_passed: boolean;
}
