<?php

namespace App\Services\Course;

use App\Models\ChunkedUpload;
use App\Models\Course\Course;
use App\Models\Course\CourseSection;
use App\Models\Course\SectionLesson;
use App\Models\Course\WatchHistory;
use App\Services\MediaService;
use App\Services\Course\CoursePlayerService;
use App\Services\LocalFileUploadService;
use App\Services\S3MultipartUploadService;

class CourseSectionService extends MediaService
{
   protected LocalFileUploadService | S3MultipartUploadService $uploaderService;

   public function __construct()
   {
      $this->uploaderService = config('filesystems.default') === 's3'
         ? new S3MultipartUploadService()
         : new LocalFileUploadService();
   }

   function createSection(array $data, string $user_id): CourseSection
   {
      return CourseSection::create([...$data, 'user_id' => $user_id]);
   }

   function updateSection(string $id, array $data): bool
   {
      return CourseSection::findOrFail($id)->update($data);
   }

   function deleteSection(string $id): bool
   {
      return CourseSection::findOrFail($id)->delete();
   }

   function sortSections(array $sortedData): bool
   {
      foreach ($sortedData as $value) {
         CourseSection::where('id', $value['id'])
            ->update(['sort' => $value['sort']]);
      }

      return true;
   }

   function createSectionLesson(array $data, string $user_id): SectionLesson
   {
      $lesson = SectionLesson::create($data);

      $this->lessonHandler($lesson, $data);

      $this->initWatchHistory($data['course_id'], 'lesson', $user_id);

      return $lesson;
   }

   function updateSectionLesson(string $id, array $data): SectionLesson
   {
      $lesson = SectionLesson::findOrFail($id);

      $this->lessonHandler($lesson, $data);

      return $lesson;
   }

   function deleteSectionLesson(string $id): bool
   {
      $lesson = SectionLesson::findOrFail($id);

      $lesson_id = $lesson->id;
      $course_id = $lesson->course_id;
      $lesson_sort = $lesson->sort;
      $course_section_id = $lesson->course_section_id;

      $currentSection = CourseSection::find($course_section_id);

      if ($lesson->lesson_src) {
         $chunkedUpload = ChunkedUpload::where('file_url', $lesson->lesson_src)->first();
         $chunkedUpload && $this->uploaderService->deleteFile($chunkedUpload);
      }

      $lesson->delete();
      $lessons = SectionLesson::where('course_id', $course_id)->get();

      if ($lessons->count() <= 0) {
         WatchHistory::where('course_id', $course_id)->delete();
         return true;
      }

      $histories = WatchHistory::where('course_id', $course_id)->get();

      foreach ($histories as $history) {
         if ($history) {
            $updateNeeded = false;

            $completedWatching = json_decode($history->completed_watching, true) ?? [];
            $originalCount = count($completedWatching);
            $completedWatching = array_filter($completedWatching, function ($item) use ($lesson_id) {
               return $item['id'] != $lesson_id;
            });

            if (count($completedWatching) !== $originalCount) {
               $history->completed_watching = !empty($completedWatching)
                  ? json_encode(array_values($completedWatching))
                  : null;
               $updateNeeded = true;
            }

            if ($history->current_watching_id == $lesson_id) {
               $nextLesson = SectionLesson::where('course_section_id', $course_section_id)
                  ->where('sort', '>', $lesson_sort)
                  ->orderBy('sort', 'asc')
                  ->first();

               if (!$nextLesson && $currentSection) {
                  $nextSection = CourseSection::where('course_id', $course_id)
                     ->where('sort', '>', $currentSection->sort)
                     ->orderBy('sort', 'asc')
                     ->first();

                  if ($nextSection) {
                     $nextLesson = SectionLesson::where('course_section_id', $nextSection->id)
                        ->orderBy('sort', 'asc')
                        ->first();
                  }
               }

               if (!$nextLesson) {
                  $nextLesson = SectionLesson::where('course_section_id', $course_section_id)
                     ->where('sort', '<', $lesson_sort)
                     ->orderBy('sort', 'desc')
                     ->first();
               }

               if (!$nextLesson) {
                  $nextLesson = SectionLesson::where('course_id', $course_id)
                     ->where('id', '!=', $lesson_id)
                     ->orderBy('sort', 'asc')
                     ->first();
               }

               if ($nextLesson) {
                  $history->current_watching_id = $nextLesson->id;
                  $history->current_watching_type = 'lesson';
                  $history->current_section_id = $nextLesson->course_section_id;
               } else {
                  $history->current_watching_id = null;
                  $history->current_watching_type = null;
                  $history->current_section_id = null;
               }

               $updateNeeded = true;
            }

            if ($history->next_watching_id == $lesson_id) {
               $nextLesson = SectionLesson::where('course_id', $course_id)
                  ->where('sort', '>', $lesson_sort)
                  ->orderBy('sort', 'asc')
                  ->first();

               if (!$nextLesson) {
                  $nextLesson = SectionLesson::where('course_id', $course_id)
                     ->where('sort', '<', $lesson_sort)
                     ->orderBy('sort', 'desc')
                     ->first();
               }

               if (!$nextLesson) {
                  $nextLesson = SectionLesson::where('course_id', $course_id)
                     ->where('id', '!=', $lesson_id)
                     ->orderBy('sort', 'asc')
                     ->first();
               }

               if ($nextLesson) {
                  $history->next_watching_id = $nextLesson->id;
                  $history->next_watching_type = 'lesson';
               } else {
                  $history->next_watching_id = null;
                  $history->next_watching_type = null;
               }

               $updateNeeded = true;
            }

            if ($history->prev_watching_id == $lesson_id && $history->prev_watching_type === 'lesson') {
               $prevLesson = SectionLesson::where('course_id', $course_id)
                  ->where('sort', '<', $lesson_sort)
                  ->orderBy('sort', 'desc')
                  ->first();

               if ($prevLesson) {
                  $history->prev_watching_id = $prevLesson->id;
                  $history->prev_watching_type = 'lesson';
               } else {
                  $history->prev_watching_id = null;
                  $history->prev_watching_type = null;
               }

               $updateNeeded = true;
            }

            if ($updateNeeded) {
               $history->save();
            }
         }
      }

      return true;
   }

   function sortSectionLessons(array $sortedData): bool
   {
      foreach ($sortedData as $value) {
         SectionLesson::where('id', $value['id'])->update([
            'sort' => $value['sort']
         ]);
      }

      return true;
   }

   private function lessonHandler(SectionLesson $lesson, array $data): SectionLesson
   {
      $updatedLesson = $data;

      switch ($data['lesson_type']) {
         case 'image':
         case 'document':
         case 'video':
            if (array_key_exists('lesson_src_new', $data) && $data['lesson_src_new']) {
               $embedCode = '<iframe src="' . $data['lesson_src_new'] . '" width="100%" height="500" frameborder="0" allowfullscreen></iframe>';

               $chunkedUpload = ChunkedUpload::where('file_url', $lesson->lesson_src)->first();
               $chunkedUpload && $this->uploaderService->deleteFile($chunkedUpload);

               $updatedLesson = [
                  ...$updatedLesson,
                  'lesson_src' => $data['lesson_src_new'],
                  'embed_source' => $embedCode,
                  'lesson_provider' => 'html5',
               ];
            } else {
               $updatedLesson = [
                  ...$updatedLesson,
                  'lesson_provider' => $data['lesson_provider'] ?? 'html5',
               ];
            }

            break;

         case 'video_url':
            $src = trim($data['lesson_src'] ?? '');
            $provider = $data['lesson_provider'] ?? null;

            if (!$provider) {
               if ($this->isYouTubeUrl($src)) {
                  $provider = 'youtube';
               } elseif ($this->isVimeoUrl($src)) {
                  $provider = 'vimeo';
               }
            }

            $updatedLesson = [
               ...$updatedLesson,
               'lesson_src' => $src,
               'lesson_provider' => $provider,
            ];

            break;

         case 'embed':
            $updatedLesson = [
               ...$updatedLesson,
               'lesson_src' => $data['embed_source'],
            ];

            break;

         default:
            $updatedLesson = $data;
            break;
      }

      $lesson->update($updatedLesson);

      return $lesson;
   }

   public function initWatchHistory(string $course_id, string $watching_type, string $user_id): ?WatchHistory
   {
      $lesson = SectionLesson::query()->where('course_id', $course_id);
      $history = WatchHistory::where('course_id', $course_id)
         ->where('user_id', $user_id)
         ->first();

      if ($lesson->count() >= 0 && !$history) {
         $lesson = $lesson->orderBy('sort', 'asc')->first();

         if (!$lesson) {
            return null;
         }

         $coursePlay = new CoursePlayerService();
         $course = Course::where('id', $course_id)->with('sections')->first();

         if (!$course) {
            return null;
         }

         return $coursePlay->watchHistory($course, $lesson->id, $watching_type, $user_id);
      }

      return $history;
   }

   protected function isYouTubeUrl(string $url): bool
   {
      return str_contains($url, 'youtube.com') || str_contains($url, 'youtu.be');
   }

   protected function isVimeoUrl(string $url): bool
   {
      return str_contains($url, 'vimeo.com') || str_contains($url, 'player.vimeo.com');
   }

   /**
    * Extract YouTube video ID from URL
    *
    * @param string $url
    * @return string|null
    */
   protected function extractYouTubeVideoId(string $url): ?string
   {
      $pattern = '/(youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/';

      if (preg_match($pattern, $url, $matches)) {
         return $matches[2];
      }

      return null;
   }

   /**
    * Extract Vimeo video ID from URL
    *
    * @param string $url
    * @return string|null
    */
   protected function extractVimeoVideoId(string $url): ?string
   {
      $pattern = '/(?:vimeo\.com\/(?:video\/)?|player\.vimeo\.com\/video\/)(\d+)/i';

      if (preg_match($pattern, $url, $matches)) {
         return $matches[1];
      }

      return null;
   }
}