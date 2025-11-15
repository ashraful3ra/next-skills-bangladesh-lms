<?php

namespace App\Http\Controllers\Course;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreLessonResourceRequest;
use App\Http\Requests\UpdateLessonResourceRequest;
use App\Models\ChunkedUpload;
use App\Models\Course\LessonResource;
use App\Services\Course\LessonResourceService;
use Illuminate\Support\Facades\Storage;

class LessonResourceController extends Controller
{
    public function __construct(private LessonResourceService $service) {}

    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        //
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        //
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreLessonResourceRequest $request)
    {
        $this->service->resourceStore($request->validated());

        return back()->with('success', 'Resource created successfully');
    }

    /**
     * Display the specified resource.
     */
    public function show(LessonResource $lessonResource)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(LessonResource $lessonResource)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateLessonResourceRequest $request, string $id)
    {
        $lessonResource = LessonResource::findOrFail($id);

        $this->service->resourceUpdate($lessonResource, $request->validated());

        return back()->with('success', 'Resource updated successfully');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $lessonResource = LessonResource::findOrFail($id);

        $this->service->resourceDelete($lessonResource);

        return back()->with('success', 'Resource deleted successfully');
    }

    /**
     * Download the specified resource.
     */
    public function download(string $id)
    {
        $lessonResource = LessonResource::findOrFail($id);
        $resourceUrl = $lessonResource->resource;
        $chunkedUpload = ChunkedUpload::where('file_url', $resourceUrl)->first();
        $mimeType = $chunkedUpload->mime_type;
        $extension = pathinfo($chunkedUpload->original_filename, PATHINFO_EXTENSION);
        $filename = $lessonResource->title ? $lessonResource->title . '.' . $extension : $chunkedUpload->filename;

        return response()->streamDownload(
            function () use ($resourceUrl) {
                echo file_get_contents($resourceUrl);
            },
            $filename,
            [
                'Content-Type' => $mimeType,
                'Content-Disposition' => 'attachment; filename="' . $filename . '"'
            ]
        );
    }
}
