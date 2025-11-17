<?php

namespace App\Services\Course;

use App\Models\Course\Course;
use App\Models\Course\CourseEnrollment;
use App\Models\Instructor;
use App\Models\User;
use App\Notifications\CourseApprovalNotification;
use App\Services\MediaService;
use App\Enums\CourseModeType;
use App\Enums\CourseVisibilityType;
use App\Enums\CourseStatusType;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;

class CourseService extends MediaService
{
    /**
     * Create course with main/batch, visibility, completed status
     */
    public function createCourse(array $data): Course
    {
        $courseMode = $data['course_mode'] ?? CourseModeType::MAIN->value;

        $mainCourseId = $courseMode === CourseModeType::BATCH->value
            ? ($data['main_course_id'] ?? null)
            : null;

        $batchNo = $courseMode === CourseModeType::BATCH->value
            ? ($data['batch_no'] ?? null)
            : null;

        $visibility = $data['visibility'] ?? CourseVisibilityType::PUBLIC->value;

        $isCompleted = array_key_exists('is_completed', $data)
            ? (bool) $data['is_completed']
            : false;

        $course = Course::create([
            ...$data,

            'course_mode'    => $courseMode,
            'main_course_id' => $mainCourseId,
            'batch_no'       => $batchNo,
            'visibility'     => $visibility,
            'is_completed'   => $isCompleted,

            'slug'        => Str::slug($data['title']),
            'user_id'     => Auth::user()->id,
            'course_type' => 'general', // পুরনো field
        ]);

        if (!empty($data['thumbnail'])) {
            $course->update([
                'thumbnail' => $this->addNewDeletePrev($course, $data['thumbnail'], 'thumbnail'),
            ]);
        }

        return $course;
    }

    /**
     * Update course by tab
     */
    public function updateCourse(string $id, array $data): ?Course
    {
        /** @var Course|null $course */
        $course = Course::find($id);

        if (!$course) {
            return null;
        }

        switch ($data['tab']) {
            case 'basic':
                $courseMode = $data['course_mode'] ?? ($course->course_mode ?: CourseModeType::MAIN->value);

                $visibility = $data['visibility'] ?? ($course->visibility ?: CourseVisibilityType::PUBLIC->value);

                $isCompleted = array_key_exists('is_completed', $data)
                    ? (bool) $data['is_completed']
                    : (bool) $course->is_completed;

                if ($courseMode === CourseModeType::BATCH->value) {
                    $mainCourseId = $data['main_course_id'] ?? $course->main_course_id;
                    $batchNo      = $data['batch_no'] ?? $course->batch_no;
                } else {
                    $mainCourseId = null;
                    $batchNo      = null;
                }

                $payload = [
                    ...$data,
                    'course_mode'    => $courseMode,
                    'main_course_id' => $mainCourseId,
                    'batch_no'       => $batchNo,
                    'visibility'     => $visibility,
                    'is_completed'   => $isCompleted,
                    'slug'           => Str::slug($data['title']),
                ];

                $course->update($payload);
                break;

            case 'pricing':
            case 'info':
            case 'seo':
                $course->update($data);
                break;

            case 'media':
                $media = ['preview' => $data['preview']];

                if (!empty($data['banner'])) {
                    $media['banner'] = $this->addNewDeletePrev($course, $data['banner'], 'banner');
                }

                if (!empty($data['thumbnail'])) {
                    $media['thumbnail'] = $this->addNewDeletePrev($course, $data['thumbnail'], 'thumbnail');
                }

                $course->update($media);
                break;

            case 'status':
                $course->update($data);

                if (array_key_exists('feedback', $data)) {
                    $instructor = Instructor::find($course->instructor_id);
                    if ($instructor) {
                        $user = User::find($instructor->user_id);
                        if ($user) {
                            $user->notify(new CourseApprovalNotification($course, $data));
                        }
                    }
                }
                break;

            default:
                $course->update($data);
                break;
        }

        return $course;
    }

    /**
     * Common course listing (dashboard + frontend)
     */
    public function getCourses(array $data, ?User $user = null, bool $paginate = false): LengthAwarePaginator|Collection
    {
        $page       = array_key_exists('per_page', $data) ? (int) $data['per_page'] : 10;
        $isFrontend = $data['frontend'] ?? false;

        $courses = Course::with([
                // Fix: Added 'sections.section_lessons' to load nested lessons for duration calculation
                'sections.section_lessons',
                'course_category',
                'course_category_child',
                'instructor.user',
            ])
            ->withCount('reviews')
            ->withAvg('reviews as average_rating', 'rating')

            // search
            ->when(array_key_exists('search', $data), function ($query) use ($data) {
                return $query->where('title', 'LIKE', '%' . $data['search'] . '%');
            })

            // category filters
            ->when(array_key_exists('category', $data) && $data['category'] !== 'all', function ($query) use ($data) {
                return $query->whereHas('course_category', function ($q) use ($data) {
                    $q->where('slug', $data['category']);
                });
            })
            // Fix: Only apply child category filter if it is not null AND not 'all'
            ->when(
                (array_key_exists('category_child', $data) && $data['category_child'] !== 'all' && !is_null($data['category_child'])),
                function ($query) use ($data) {
                    return $query->whereHas('course_category_child', function ($q) use ($data) {
                        $q->where('slug', $data['category_child']);
                    });
                }
            )

            // level / price / language
            ->when(array_key_exists('level', $data) && $data['level'] !== 'all', function ($query) use ($data) {
                return $query->where('level', $data['level']);
            })
            ->when(array_key_exists('price', $data) && $data['price'] !== 'all', function ($query) use ($data) {
                return $query->where('pricing_type', $data['price']);
            })
            ->when(array_key_exists('language', $data) && $data['language'] !== 'all', function ($query) use ($data) {
                return $query->where('language', $data['language']);
            })

            // instructor dashboard
            ->when($user && $user->role === 'instructor', function ($query) use ($user) {
                return $query->where('instructor_id', $user->instructor->id ?? null);
            });

        // ---- STATUS / VISIBILITY / COMPLETED FILTERS ----

        if ($isFrontend) {
            // Frontend listing: শুধুমাত্র approved + public + not completed + Main Course
            $courses
                ->where('course_mode', CourseModeType::MAIN->value) // Filter for main course
                ->where('status', CourseStatusType::APPROVED->value)
                // Filter for Visibility
                ->where(function ($q) {
                    $q->whereNull('visibility')
                      ->orWhere('visibility', CourseVisibilityType::PUBLIC->value);
                })
                // Filter for Completion Status
                ->where(function ($q) {
                    $q->whereNull('is_completed')
                      ->orWhere('is_completed', false);
                });
        } else {
            // Dashboard listing: প্যারামিটার অনুযায়ী filter
            $courses
                ->when(array_key_exists('status', $data) && $data['status'] !== 'all', function ($query) use ($data) {
                    return $query->where('status', $data['status']);
                })
                ->when(array_key_exists('visibility', $data) && $data['visibility'] !== 'all', function ($query) use ($data) {
                    return $query->where('visibility', $data['visibility']);
                })
                ->when(array_key_exists('hide_completed', $data) && $data['hide_completed'], function ($query) {
                    return $query->where('is_completed', false);
                });
        }

        $courses->orderBy('created_at', 'desc');

        return $paginate ? $courses->paginate($page) : $courses->get();
    }

    public function getUserCourseById(string $id, User $user): ?Course
    {
        return Course::where('id', $id)->with([
            'faqs',
            'outcomes',
            'requirements',
            'instructor.user',
            'live_classes',
            'assignments.submissions',
            'enrollments:id',
            'sections' => function ($query) use ($user) {
                $query->with([
                    'section_lessons.resources',
                    'section_quizzes' => function ($quizzes) use ($user) {
                        $quizzes->with([
                            'quiz_questions' => function ($questions) use ($user) {
                                $questions->with(['answers' => function ($answers) use ($user) {
                                    $answers->when($user, function ($query) use ($user) {
                                        $query->where('user_id', $user->id)
                                            ->latest()
                                            ->limit(1);
                                    });
                                }]);
                            },
                            'quiz_submissions' => function ($submissions) use ($user) {
                                $submissions->when($user, function ($query) use ($user) {
                                    $query->where('user_id', $user->id)
                                        ->latest()
                                        ->limit(1);
                                    // Fix: Removed accidental 'VerifyEmailNotification' text from here
                                });
                            },
                        ]);
                    },
                ]);
            },
        ])->first();
    }

    public function getGuestCourseById(string $id): Course
    {
        return Course::where('id', $id)
            ->withCount('enrollments')
            ->withAvg('reviews as average_rating', 'rating')
            ->with([
                'faqs',
                'outcomes',
                'requirements',
                'sections' => function ($query) {
                    $query->with([
                        'section_lessons',
                        'section_quizzes',
                    ]);
                },
                'instructor' => function ($query) {
                    $query->with([
                        'user',
                        'courses' => function ($q) {
                            $q->withCount('enrollments')
                                ->withCount('reviews')
                                ->withAvg('reviews as average_rating', 'rating');
                        },
                    ])
                        ->withCount(['courses'])
                        ->selectRaw('(SELECT COUNT(*) FROM course_reviews 
                            INNER JOIN courses ON course_reviews.course_id = courses.id 
                            WHERE courses.instructor_id = instructors.id) as total_reviews_count')
                        ->selectRaw('(SELECT AVG(rating) FROM course_reviews 
                            INNER JOIN courses ON course_reviews.course_id = courses.id 
                            WHERE courses.instructor_id = instructors.id) as total_average_rating')
                        ->selectRaw('(SELECT COUNT(DISTINCT user_id) FROM course_enrollments
                            INNER JOIN courses ON course_enrollments.course_id = courses.id
                            WHERE courses.instructor_id = instructors.id) as total_enrollments_count');
                },
            ])->first();
    }

    public function lastSectionLessonSort(Course $course): array
    {
        $maxSectionSort = $course->sections->max('sort') ?? 0;
        $maxLessonSort  = $course->sections->flatMap->section_lessons->max('sort') ?? 0;

        return [
            'lastSectionSort' => $maxSectionSort,
            'lastLessonSort'  => $maxLessonSort,
        ];
    }

    public function getCourseEnroll(string $courseId): ?CourseEnrollment
    {
        $user = Auth::user();
        if ($user) {
            return CourseEnrollment::where('course_id', $courseId)
                ->where('user_id', $user->id)
                ->first();
        }

        return null;
    }

    public function deleteCourse(string $id): void
    {
        $course = Course::find($id);
        if ($course) {
            $course->delete();
        }
    }

    public function validateCourseForApproval(Course $course): array
    {
        $sectionsCount = 0;
        $lessonsCount  = 0;
        $quizzesCount  = 0;
        $totalContent  = 0;

        $hasThumbnail = !empty($course->thumbnail);

        if ($course->sections) {
            $sectionsCount = $course->sections->count();

            $lessonsCount = $course->sections->reduce(function ($carry, $section) {
                return $carry + ($section->section_lessons ? $section->section_lessons->count() : 0);
            }, 0);

            $quizzesCount = $course->sections->reduce(function ($carry, $section) {
                return $carry + ($section->section_quizzes ? $section->section_quizzes->count() : 0);
            }, 0);

            $totalContent = $sectionsCount + $lessonsCount;
        }

        $minSections     = 1;
        $minLessons      = 1;
        $minTotalContent = 2;

        $hasMinSections = $sectionsCount >= $minSections;
        $hasMinLessons  = $lessonsCount >= $minLessons;
        $hasMinContent  = $totalContent >= $minTotalContent;

        $hasOutcomes     = $course->outcomes && $course->outcomes->count() > 0;
        $hasRequirements = $course->requirements && $course->requirements->count() > 0;

        $isReadyForApproval =
            $hasThumbnail &&
            $hasMinSections &&
            $hasMinContent &&
            $hasOutcomes &&
            $hasRequirements;

        $validationMessages = [];
        if (!$hasThumbnail)   $validationMessages[] = 'Course thumbnail is missing';
        if (!$hasMinSections) $validationMessages[] = "Course needs at least {$minSections} section";
        if (!$hasMinLessons)  $validationMessages[] = "Course needs at least {$minLessons} lesson";
        if (!$hasMinContent)  $validationMessages[] = "Course needs at least {$minTotalContent} content items (sections + section_lessons)";
        if (!$hasOutcomes)    $validationMessages[] = 'Course outcomes are missing';
        if (!$hasRequirements) $validationMessages[] = 'Course requirements are missing';

        return [
            'approve_able' => $isReadyForApproval,
            'counts'       => [
                'sections_count'      => $sectionsCount,
                'lessons_count'       => $lessonsCount,
                'quizzes_count'       => $quizzesCount,
                'total_content_count' => $totalContent,
            ],
            'has_requirements' => [
                'thumbnail'   => $hasThumbnail,
                'min_sections'=> $hasMinSections,
                'min_lessons' => $hasMinLessons,
                'min_content' => $hasMinContent,
                'outcomes'    => $hasOutcomes,
                'requirements'=> $hasRequirements,
            ],
            'validation_messages' => $validationMessages,
        ];
    }
}