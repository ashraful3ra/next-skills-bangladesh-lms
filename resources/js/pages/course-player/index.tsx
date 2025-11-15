import { Sidebar, SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import Main from '@/layouts/main';
import LandingFooter from '@/layouts/partials/landing-footer';
import { getQueryParams } from '@/lib/route';
import { getCompletedContents, getCourseCompletion } from '@/lib/utils';
import { CoursePlayerProps } from '@/types/page';
import { usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import ContentList from './partials/content-list';
import ContentSummery from './partials/content-summery';
import LessonViewer from './partials/lesson-viewer';
import Navbar from './partials/navbar';
import QuizViewer from './partials/quiz-viewer';

const Index = (props: CoursePlayerProps) => {
   const { type, watching, watchHistory } = props;
   const page = usePage();
   const params = getQueryParams(page.url);
   const [sidebarWidth, setSidebarWidth] = useState('calc(var(--spacing) * 100)');

   const completed = getCompletedContents(watchHistory);
   const completion = getCourseCompletion(props.course, completed);

   useEffect(() => {
      const handleResize = () => {
         if (window.innerWidth < 880) {
            setSidebarWidth('calc(var(--spacing) * 70)'); // Mobile
         } else if (window.innerWidth < 1024) {
            setSidebarWidth('calc(var(--spacing) * 80)'); // Tablet
         } else {
            setSidebarWidth('calc(var(--spacing) * 100)'); // Desktop
         }
      };

      // Set initial value
      handleResize();

      // Add event listener
      window.addEventListener('resize', handleResize);

      // Cleanup
      return () => window.removeEventListener('resize', handleResize);
   }, []);

   return (
      <SidebarProvider
         className="flex-col"
         style={
            {
               '--sidebar-width': sidebarWidth,
            } as React.CSSProperties
         }
      >
         <Navbar />

         <div className="flex w-full flex-row-reverse">
            <Sidebar side="right" className="top-[60px] shadow-lg">
               <ContentList completedContents={completed} courseCompletion={completion} />
            </Sidebar>

            <SidebarInset>
               <Main>
                  {type === 'lesson' ? <LessonViewer lesson={watching as SectionLesson} /> : <QuizViewer quiz={watching as SectionQuiz} />}

                  <ContentSummery />
                  <LandingFooter />
               </Main>
            </SidebarInset>
         </div>
      </SidebarProvider>
   );
};

export default Index;
