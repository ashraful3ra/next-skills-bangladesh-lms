import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { SharedData } from '@/types/global';
import { usePage } from '@inertiajs/react';
import { File, FileQuestion, FileText, Image, PlayCircle, Video, X } from 'lucide-react';
import { useState } from 'react';

// ── Video embed URL builder ───────────────────────────────────

function buildEmbedUrl(lesson: SectionLesson): string | null {
   const src = lesson.lesson_src ?? '';
   if (!src) return null;

   const provider = lesson.lesson_provider?.toLowerCase();

   if (provider === 'youtube') {
      const match = src.match(
         /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([^&\n?#]+)/,
      );
      const id = match?.[1];
      return id ? `https://www.youtube.com/embed/${id}?autoplay=1&rel=0&modestbranding=1` : null;
   }

   if (provider === 'vimeo') {
      const match = src.match(/vimeo\.com\/(?:video\/)?(\d+)/);
      const id = match?.[1];
      return id ? `https://player.vimeo.com/video/${id}?autoplay=1&title=0&byline=0&portrait=0` : null;
   }

   return null;
}

// ── Free Preview Modal ────────────────────────────────────────

interface PreviewModalProps {
   lesson: SectionLesson | null;
   open: boolean;
   onClose: () => void;
}

const FreePreviewModal = ({ lesson, open, onClose }: PreviewModalProps) => {
   if (!lesson) return null;

   const embedUrl = buildEmbedUrl(lesson);

   return (
      <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
         <DialogContent className="w-[95vw] max-w-[95vw] sm:max-w-[900px] gap-0 overflow-hidden p-0">
            <DialogHeader className="flex flex-row items-center justify-between gap-3 bg-gray-900 px-4 py-3">
               <div className="flex items-center gap-2 min-w-0">
                  <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-green-500 px-2 py-0.5 text-xs font-semibold text-white">
                     <PlayCircle className="h-3 w-3" />
                     Free Preview
                  </span>
                  <DialogTitle className="truncate text-sm font-medium text-white">
                     {lesson.title}
                  </DialogTitle>
               </div>
            </DialogHeader>

            {/* 16:9 video area */}
            <div className="relative w-full bg-black" style={{ paddingTop: '56.25%' }}>
               {embedUrl ? (
                  <iframe
                     src={embedUrl}
                     className="absolute inset-0 h-full w-full"
                     allow="autoplay; fullscreen; picture-in-picture"
                     allowFullScreen
                     title={lesson.title}
                     frameBorder="0"
                  />
               ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-gray-900 text-gray-500">
                     <Video className="h-10 w-10 opacity-40" />
                     <p className="text-sm">Video preview unavailable</p>
                  </div>
               )}
            </div>

            {lesson.duration && (
               <div className="bg-gray-900 px-4 py-2 text-right text-xs text-gray-400">
                  Duration: {lesson.duration}
               </div>
            )}
         </DialogContent>
      </Dialog>
   );
};

// ── Main Curriculum Component ─────────────────────────────────

const Curriculum = ({ course }: { course: Course }) => {
   const { props } = usePage<SharedData>();
   const { translate } = props;
   const { frontend } = translate;
   const videoTypes = ['video', 'video_url'];

   const [previewLesson, setPreviewLesson] = useState<SectionLesson | null>(null);

   const isPreviewable = (lesson: SectionLesson) =>
      Boolean(lesson.is_free_preview) && videoTypes.includes(lesson.lesson_type);

   return (
      <>
         <h6 className="mb-4 text-xl font-semibold">{frontend.course_curriculum}</h6>

         <Separator className="my-6" />

         <Accordion
            type="single"
            collapsible
            className="space-y-4"
            defaultValue={course.sections.length > 0 ? (course.sections[0].id as string) : ''}
         >
            {course.sections.map((section, index) => (
               <AccordionItem key={section.id} value={section.id as string} className="overflow-hidden rounded-lg border">
                  <AccordionTrigger className="[&[data-state=open]]:!bg-muted px-4 py-3 text-base hover:no-underline">
                     {index + 1}. {section.title}
                  </AccordionTrigger>

                  <AccordionContent className="space-y-1 p-4">
                     {section.section_lessons.length > 0 ? (
                        <>
                           {section.section_lessons.map((lesson) => (
                              <div
                                 key={lesson.id}
                                 onClick={() => isPreviewable(lesson) && setPreviewLesson(lesson)}
                                 className={`flex items-center justify-between gap-3 rounded-md px-2 py-2 transition-colors ${
                                    isPreviewable(lesson)
                                       ? 'cursor-pointer hover:bg-muted'
                                       : 'cursor-default'
                                 }`}
                              >
                                 {/* Left: icon + title */}
                                 <div className="flex items-center gap-2 min-w-0">
                                    <div className="bg-secondary flex h-6 w-6 shrink-0 items-center justify-center rounded-full">
                                       {videoTypes.includes(lesson.lesson_type) && <Video className="h-4 w-4" />}
                                       {['document', 'iframe'].includes(lesson.lesson_type) && <File className="h-4 w-4" />}
                                       {lesson.lesson_type === 'text' && <FileText className="h-4 w-4" />}
                                       {lesson.lesson_type === 'image' && <Image className="h-4 w-4" />}
                                    </div>

                                    <p className={`truncate text-sm ${isPreviewable(lesson) ? 'text-primary font-medium' : ''}`}>
                                       {lesson.title}
                                    </p>
                                 </div>

                                 {/* Right: free preview badge + duration */}
                                 <div className="flex shrink-0 items-center gap-2">
                                    {isPreviewable(lesson) && (
                                       <span className="inline-flex items-center gap-1 rounded-full border border-green-200 bg-green-50 px-2 py-0.5 text-xs font-semibold text-green-600">
                                          <PlayCircle className="h-3 w-3" />
                                          Preview
                                       </span>
                                    )}
                                    {videoTypes.includes(lesson.lesson_type) && lesson.duration && lesson.duration !== '00:00:00' && (
                                       <span className="text-sm text-muted-foreground">{lesson.duration}</span>
                                    )}
                                 </div>
                              </div>
                           ))}

                           {section.section_quizzes.map((quiz) => (
                              <div key={quiz.id} className="flex items-center justify-between gap-3 rounded-md px-2 py-2">
                                 <div className="flex items-center gap-2">
                                    <div className="bg-secondary flex h-6 w-6 items-center justify-center rounded-full">
                                       <FileQuestion className="h-4 w-4" />
                                    </div>
                                    <p>{quiz.title}</p>
                                 </div>
                                 <span>{quiz.duration}</span>
                              </div>
                           ))}
                        </>
                     ) : (
                        <div className="px-4 py-3 text-center">
                           <p>{frontend.there_is_no_lesson_added}</p>
                        </div>
                     )}
                  </AccordionContent>
               </AccordionItem>
            ))}
         </Accordion>

         {/* Free Preview Modal */}
         <FreePreviewModal
            lesson={previewLesson}
            open={previewLesson !== null}
            onClose={() => setPreviewLesson(null)}
         />
      </>
   );
};

export default Curriculum;