<?php

namespace App\Http\Controllers;

use Illuminate\Support\Facades\Auth;
use App\Models\Course\CourseLiveClass;
use App\Http\Requests\StoreLiveClassRequest;
use App\Http\Requests\UpdateLiveClassRequest;
// ZoomLiveService আর ইমপোর্ট করার দরকার নেই
use App\Services\Course\CoursePlayerService;
use Inertia\Inertia;

class LiveClassController extends Controller
{
    public function __construct(
        // ZoomLiveService এখান থেকে সরিয়ে ফেলা হয়েছে
        private CoursePlayerService $coursePlayerService
    ) {}

    public function index($id)
    {
        $user = Auth::user();
        $live_class = CourseLiveClass::with('course')->where('id', $id)->firstOrFail();
        $watchHistory = $this->coursePlayerService->getWatchHistory($live_class->course_id, $user->id);

        return Inertia::render('course-player/live-class/zoom-live-class', [
            'live_class' => $live_class,
            'watchHistory' => $watchHistory,
            'zoom_sdk_client_id' => null, // জুম SDK এখন আর লাগবে না
        ]);
    }

    public function store(StoreLiveClassRequest $request)
    {
        $data = $request->validated();
        
        // জুমের লজিক বাদ দিয়ে ম্যানুয়াল প্রোভাইডার সেট করা হলো
        $data['provider'] = 'manual'; 
        $data['class_date_and_time'] = date('Y-m-d\TH:i:s', strtotime($data['class_date_and_time']));

        // সরাসরি ডাটাবেসে ক্রিয়েট হবে, জুম API কল হবে না
        CourseLiveClass::create($data);

        return back()->with('success', 'Live class added successfully');
    }

    public function update(UpdateLiveClassRequest $request, $id)
    {
        $data = $request->validated();
        $data['class_date_and_time'] = date('Y-m-d\TH:i:s', strtotime($data['class_date_and_time']));
        
        // জুম আপডেট লজিক বাদ দেওয়া হয়েছে
        CourseLiveClass::where('id', $id)->update($data);

        return back()->with('success', 'Live class updated successfully');
    }

    public function destroy($id)
    {
        // জুম মিটিং ডিলিট করার লজিক বাদ দেওয়া হয়েছে
        CourseLiveClass::where('id', $id)->delete();

        return back()->with('success', 'Live class deleted successfully');
    }
    
    // signature ফাংশনটি এখন আর প্রয়োজন নেই, চাইলে রাখতে পারেন বা মুছে ফেলতে পারেন
    public function signature($meetingId)
    {
        return response()->json(['message' => 'Manual class, no signature needed']);
    }
}