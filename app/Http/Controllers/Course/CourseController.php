<?php

namespace App\Http\Controllers\Course;

use Illuminate\Http\Request;
use App\Enums\CourseLevelType;
use App\Enums\CoursePricingType;
use App\Enums\CourseStatusType;
use App\Enums\ExpiryLimitType;
use App\Services\InstructorService;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreCourseRequest;
use App\Http\Requests\UpdateCourseRequest;
use App\Http\Requests\UpdateCourseStatusRequest;
use App\Services\Course\AssignmentSubmissionService;
use App\Services\Course\CourseCategoryService;
use App\Services\Course\CourseService;
use App\Services\Course\CourseSectionService;
use App\Services\Course\CoursePlayerService;
use App\Services\Course\CourseWishlistService;
use App\Services\Course\CourseReviewService;
use App\Services\LiveClass\ZoomLiveService;
use App\Enums\CourseModeType;
use App\Enums\CourseVisibilityType;
use App\Models\Course\Course;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class CourseController extends Controller
{
    public function __construct(
        protected CourseService $courseService,
        protected ZoomLiveService $zoomLiveService,
        protected CourseCategoryService $categoryService,
        protected InstructorService $instructorService,
        protected CourseSectionService $courseSectionService,
        protected CoursePlayerService $coursePlayerService,
        protected CourseWishlistService $wishlistService,
        protected CourseReviewService $reviewService,
        protected AssignmentSubmissionService $submissionService,
    ) {}

    public function index(Request $request)
    {
        $statuses = CourseStatusType::cases();
        $courses = $this->courseService->getCourses($request->all(), Auth::user(), true);

        return Inertia::render('dashboard/courses/index', compact('courses', 'statuses'));
    }

    public function category_courses(Request $request, string $category, ?string $category_child = null)
    {
        $user = Auth::user();

        // frontend = true দিলে service নিজে থেকেই
        // APPROVED + PUBLIC + not completed ফিল্টার করবে
        $query = [
            ...$request->all(),
            'per_page'       => 12,
            'category'       => $category,
            'category_child' => $category_child,
            'frontend'       => true,
        ];

        $levels  = CourseLevelType::cases();
        $prices  = CoursePricingType::cases();

        $categoryModel      = $this->categoryService->getCategoryBySlug($category);
        $categoryChildModel = $this->categoryService->getCategoryChildBySlug($category_child);

        $categories = $this->categoryService->getCategories()['categories'];

        $wishlists = $this->wishlistService->getWishlists([
            'user_id' => $user?->id,
        ]);

        $courses = $this->courseService->getCourses($query, null, true);

        // SEO / meta
        $system   = app('system_settings');
        $siteName = $system->fields['name'] ?? 'Mentor Learning Management System';
        $siteUrl  = request()->url();

        $totalCourses = method_exists($courses, 'total') ? $courses->total() : 0;

        $firstCourseImage = null;
        if ($courses->count() > 0) {
            $firstCourse      = $courses->first();
            $firstCourseImage = $firstCourse->thumbnail ?? $firstCourse->banner ?? null;
        }

        $pageTitle = 'All Courses';

        if ($categoryModel && $categoryChildModel) {
            $pageTitle = $categoryChildModel->title . ' Courses in ' . $categoryModel->title;
        } elseif ($categoryModel) {
            $pageTitle = $categoryModel->title . ' Courses';
        }

        $pageDescription = $totalCourses > 0
            ? "Browse {$totalCourses}+ online courses from expert instructors. Learn new skills with our comprehensive course catalog."
            : "Browse online courses from expert instructors. Learn new skills with our comprehensive course catalog.";

        $pageKeywords = 'online courses, learning platform, education, skills, training, e-learning';
        $ogTitle      = $pageTitle;
        $categoryImage = $categoryModel->thumbnail ?? null;
        $ogImage       = $firstCourseImage ?? $categoryImage ?? ($system->fields['banner'] ?? '');

        $fullTitle = $pageTitle . ' | ' . $siteName;

        return Inertia::render('courses/index', [
            'levels'        => $levels,
            'prices'        => $prices,
            'courses'       => $courses,
            'categories'    => $categories,
            'category'      => $categoryModel,
            'categoryChild' => $categoryChildModel,
            'wishlists'     => $wishlists,
        ])->withViewData([
            'metaTitle'          => $fullTitle,
            'metaDescription'    => $pageDescription,
            'metaKeywords'       => $pageKeywords,
            'ogTitle'            => $ogTitle,
            'ogDescription'      => $pageDescription,
            'ogImage'            => $ogImage,
            'ogUrl'              => $siteUrl,
            'ogType'             => 'website',
            'twitterCard'        => 'summary_large_image',
            'twitterTitle'       => $ogTitle,
            'twitterDescription' => $pageDescription,
            'twitterImage'       => $ogImage,
        ]);
    }

    public function create()
    {
        $labels     = CourseLevelType::cases();
        $prices     = CoursePricingType::cases();
        $expiries   = ExpiryLimitType::cases();
        $categories = $this->categoryService->getCategories()['categories'];
        $instructors = $this->instructorService->getInstructors(['status' => 'approved'], false);

        return Inertia::render('dashboard/courses/create', compact(
            'labels',
            'prices',
            'expiries',
            'categories',
            'instructors'
        ));
    }

    public function store(StoreCourseRequest $request)
    {
        $this->courseService->createCourse($request->validated());

        return redirect(route('courses.index'))->with('success', 'Course added successfully');
    }

    public function show(Request $request, $slug, $id)
    {
        if (empty($slug)) {
            return redirect()->back();
        }

        $user = Auth::user() ?: null;

        $course        = $this->courseService->getGuestCourseById($id);
        $enrollment    = $this->courseService->getCourseEnroll($course->id);
        $wishlists     = $this->wishlistService->getWishlists(['user_id' => $user?->id]);
        $watchHistory  = $this->coursePlayerService->getWatchHistory($course->id, $user?->id);
        $approvalStatus = $this->courseService->validateCourseForApproval($course);
        $reviews       = $this->reviewService->getReviews(['course_id' => $course->id, ...$request->all()], true);
        $totalReviews  = $this->reviewService->totalReviews($course->id);

        if ($course->exists()) {
            $system    = app('system_settings');
            $siteName  = $system->fields['name'] ?? 'Mentor Learning Management System';
            $pageTitle = $course->meta_title ?? ($course->title . ' | ' . $siteName);
            $pageDescription = $course->meta_description
                ?? $course->short_description
                ?? $course->description
                ?? 'Learn with our comprehensive course';
            $pageKeywords = $course->meta_keywords
                ?? ($course->title . ', online course, learning, ' . ($system->fields['keywords'] ?? 'LMS'));
            $ogTitle       = $course->og_title ?? $course->title;
            $ogDescription = $course->og_description ?? $pageDescription;

            $courseImage = $course->thumbnail ?? $course->banner ?? $system->fields['banner'] ?? '';
            $siteUrl     = request()->url();

            return Inertia::render('courses/show', [
                'course'         => $course,
                'enrollment'     => $enrollment,
                'watchHistory'   => $watchHistory,
                'approvalStatus' => $approvalStatus,
                'wishlists'      => $wishlists,
                'reviews'        => $reviews,
                'totalReviews'   => $totalReviews,
            ])->withViewData([
                'metaTitle'          => $pageTitle,
                'metaDescription'    => $pageDescription,
                'metaKeywords'       => $pageKeywords,
                'ogTitle'            => $ogTitle,
                'ogDescription'      => $ogDescription,
                'ogImage'            => $courseImage,
                'ogUrl'              => $siteUrl,
                'ogType'             => 'article',
                'twitterCard'        => 'summary_large_image',
                'twitterTitle'       => $ogTitle,
                'twitterDescription' => $ogDescription,
                'twitterImage'       => $courseImage,
            ]);
        }

        return redirect()->back();
    }

    public function edit(Request $request, string $id)
    {
        $user       = Auth::user();
        $tab        = $request->tab;
        $assignment = $request->assignment;

        $statuses = CourseStatusType::cases();
        $labels   = CourseLevelType::cases();
        $prices   = CoursePricingType::cases();
        $expiries = ExpiryLimitType::cases();

        $course        = $this->courseService->getUserCourseById($id, $user);
        $watchHistory  = $this->coursePlayerService->getWatchHistory($course->id, $user->id);
        $approvalStatus = $this->courseService->validateCourseForApproval($course);
        $lastSortValues = $this->courseService->lastSectionLessonSort($course);
        $categoriesArr  = $this->categoryService->getCategories();
        $categories     = $categoriesArr['categories'];
        $zoomConfig     = $this->zoomLiveService->zoomConfig;
        $instructors    = isAdmin()
            ? $this->instructorService->getInstructors(['status' => 'approved'], false)
            : null;

        $totalSubmissions = $course->assignments->sum(
            fn ($assignment) => $assignment->submissions->count()
        );
        $totalEnrollments = $course->enrollments->count();

        $submissions = null;
        if ($assignment) {
            $submissions = $this->submissionService->getSubmissions($assignment, $request->all());
        }

        return Inertia::render('dashboard/courses/update', [
            ...$lastSortValues,
            'tab'              => $tab,
            'assignment'       => $assignment,
            'prices'           => $prices,
            'course'           => $course,
            'statuses'         => $statuses,
            'labels'           => $labels,
            'expiries'         => $expiries,
            'categories'       => $categories,
            'submissions'      => $submissions,
            'watchHistory'     => $watchHistory,
            'approvalStatus'   => $approvalStatus,
            'zoomConfig'       => $zoomConfig,
            'instructors'      => $instructors,
            'totalSubmissions' => $totalSubmissions,
            'totalEnrollments' => $totalEnrollments,
        ]);
    }

    public function update(UpdateCourseRequest $request, $id)
    {
        $this->courseService->updateCourse($id, $request->validated());

        return back()->with('success', "Course $request->tab updated successfully");
    }

    public function status(UpdateCourseStatusRequest $request, $id)
    {
        $this->courseService->updateCourse($id, [...$request->validated(), 'tab' => 'status']);

        return back()->with('success', 'Course status changed successfully');
    }

    public function destroy($id)
    {
        $this->courseService->deleteCourse($id);

        return redirect(route('courses.index'))->with('success', 'Course deleted successfully');
    }

    public function mainCourses(Request $request)
    {
        $courses = Course::query()
            ->select('id', 'title', 'batch_no')
            ->where('status', CourseStatusType::APPROVED->value)

            // ✅ Fix: শুধুমাত্র 'mode' প্যারামিটার 'main' হলেই MAIN কোর্স ফিল্টার করবে
            ->when($request->input('mode') === 'main', function ($query) {
                $query->where('course_mode', CourseModeType::MAIN->value);
            })

            ->when($request->search, function ($query) use ($request) {
                $search = $request->search;
                $query->where(function ($q) use ($search) {
                    $q->where('title', 'LIKE', '%' . $search . '%')
                      ->orWhere('batch_no', 'LIKE', '%' . $search . '%');
                });
            })
            ->orderBy('title')
            ->get();

        return response()->json([
            'data' => $courses,
        ]);
    }
}