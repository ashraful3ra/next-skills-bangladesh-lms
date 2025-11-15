import CourseCard7 from '@/components/cards/course-card-7';
import Tabs from '@/components/tabs';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StudentCourseProps } from '@/types/page';
import { Head, Link } from '@inertiajs/react';
import { ReactNode } from 'react';
import Layout from './partials/layout';
import Assignments from './tabs-content/assignments';
import Certificate from './tabs-content/certificate';
import LiveClasses from './tabs-content/live_classes';
import Modules from './tabs-content/modules';
import Quizzes from './tabs-content/quizzes';
import Resources from './tabs-content/resources';

const Course = (props: StudentCourseProps) => {
   const { tab, course, watchHistory, completion } = props;

   const tabs = [
      {
         value: 'modules',
         label: 'Modules',
      },
      {
         value: 'live_classes',
         label: 'Live Classes',
      },
      {
         value: 'assignments',
         label: 'Assignments',
      },
      {
         value: 'quizzes',
         label: 'Quizzes',
      },
      {
         value: 'resources',
         label: 'Resources',
      },
      {
         value: 'certificate',
         label: 'Certificate',
      },
   ];

   const renderContent = () => {
      switch (tab) {
         case 'modules':
            return <Modules />;
         case 'live_classes':
            return <LiveClasses />;
         case 'assignments':
            return <Assignments />;
         case 'quizzes':
            return <Quizzes />;
         case 'resources':
            return <Resources />;
         case 'certificate':
            return <Certificate />;
         default:
            return <></>;
      }
   };

   return (
      <>
         <Head title={course.title} />

         <CourseCard7 course={course} watch_history={watchHistory} completion={completion} />

         <Card className="mt-6">
            <Tabs value={tab} className="bg-card w-full overflow-hidden rounded-md">
               <div className="overflow-x-auto overflow-y-hidden">
                  <TabsList className="bg-transparent px-0 py-6">
                     {tabs.map(({ label, value }) => {
                        return (
                           <TabsTrigger
                              key={value}
                              value={value}
                              className="border-primary data-[state=active]:!bg-muted data-[state=active]:before:bg-primary relative flex cursor-pointer items-center justify-start gap-3 rounded-none bg-transparent px-8 py-4 text-start !shadow-none before:absolute before:right-0 before:bottom-0 before:left-0 before:h-1 before:rounded-t-xl data-[state=active]:before:content-['.']"
                              asChild
                           >
                              <Link
                                 href={route('student.show', {
                                    id: course.id,
                                    tab: value,
                                 })}
                              >
                                 <span>{label}</span>
                              </Link>
                           </TabsTrigger>
                        );
                     })}
                  </TabsList>
               </div>

               <Separator className="mt-[1px]" />

               <TabsContent value={tab} className="m-0 p-5">
                  {renderContent()}
               </TabsContent>
            </Tabs>
         </Card>
      </>
   );
};

Course.layout = (page: ReactNode) => <Layout children={page} tab="courses" />;

export default Course;
