import TiptapRenderer from '@/components/text-editor/tiptap-renderer/client-renderer';
import { Card } from '@/components/ui/card';
import VideoPlayer from '@/components/video-player';
import { cn } from '@/lib/utils';
import { CoursePlayerProps } from '@/types/page';
import { usePage } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';
import DocumentViewer from './document-viewer';
import EmbedViewer from './embed-viewer';
import LessonControl from './lesson-control';

interface LessonViewerProps {
   lesson: SectionLesson;
}

const getVimeoId = (url?: string | null): string | null => {
   if (!url) return null;
   const regExp = /(?:vimeo\.com\/(?:video\/)?|player\.vimeo\.com\/video\/)(\d+)/i;
   const match = url.match(regExp);
   return match ? match[1] : null;
};

const LessonViewer = ({ lesson }: LessonViewerProps) => {
   const { props } = usePage<CoursePlayerProps>();
   const { translate } = props;
   const { frontend } = translate;

   const [isMobile, setIsMobile] = useState(false);

   useEffect(() => {
      const checkMobile = () => setIsMobile(window.innerWidth < 768);
      checkMobile();
      window.addEventListener('resize', checkMobile);
      return () => window.removeEventListener('resize', checkMobile);
   }, []);

   const vimeoId = useMemo(() => getVimeoId(lesson?.lesson_src || ''), [lesson?.lesson_src]);

   const useDirectMobileVimeo =
      lesson?.lesson_type === 'video_url' &&
      lesson?.lesson_provider === 'vimeo' &&
      !!vimeoId &&
      isMobile;

   const mobileVimeoEmbedUrl = vimeoId
      ? `https://player.vimeo.com/video/${vimeoId}?autoplay=0&title=0&byline=0&portrait=0&dnt=1&playsinline=1`
      : '';

   return lesson ? (
      <Card className={cn('group lesson-container relative')}>
         <LessonControl className="opacity-0 transition-all duration-300 group-hover:opacity-100" />

         {['video_url', 'video'].includes(lesson.lesson_type) && (
            useDirectMobileVimeo ? (
               <div
                  key={`mobile-vimeo-${lesson.id}-${vimeoId}`}
                  className="relative w-full overflow-hidden bg-black"
                  style={{ paddingTop: '56.25%' }}
               >
                  <iframe
                     src={mobileVimeoEmbedUrl}
                     className="absolute inset-0 h-full w-full"
                     frameBorder="0"
                     allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
                     allowFullScreen
                     title={lesson.title || 'Vimeo video player'}
                  />
               </div>
            ) : (
               <div key={`default-player-${lesson.id}-${lesson.lesson_provider || lesson.lesson_type}`}>
                  <VideoPlayer
                     source={{
                        type: 'video' as const,
                        sources: [
                           {
                              src: lesson.lesson_src || '',
                              type: lesson.lesson_type === 'video' ? 'video/mp4' : undefined,
                              provider:
                                 lesson.lesson_provider === 'youtube'
                                    ? 'youtube'
                                    : lesson.lesson_provider === 'vimeo'
                                      ? 'vimeo'
                                      : lesson.lesson_type === 'video'
                                        ? 'html5'
                                        : undefined,
                           },
                        ],
                     }}
                     translate={translate}
                  />
               </div>
            )
         )}

         {lesson.lesson_type === 'document' && <DocumentViewer src={lesson.lesson_src || ''} />}

         {lesson.lesson_type === 'embed' && <EmbedViewer src={lesson.lesson_src || ''} />}

         {lesson.lesson_type === 'text' && (
            <div className="h-full w-full overflow-y-auto">
               <TiptapRenderer>{lesson.lesson_src || ''}</TiptapRenderer>
            </div>
         )}

         {lesson.lesson_type === 'image' && (
            <div className="flex h-full w-full items-center justify-center overflow-y-auto">
               <img className="h-full max-h-[calc(100vh-60px)] min-h-[80vh]" src={lesson.lesson_src} />
            </div>
         )}
      </Card>
   ) : (
      <Card className="min-h-[60vh] w-full overflow-hidden rounded-lg">
         <div className="flex h-full items-center justify-center">
            <p>{frontend.no_lesson_found}</p>
         </div>
      </Card>
   );
};

export default LessonViewer;