import { StudentDashboardProps } from '@/types/page';
import { Head } from '@inertiajs/react';
import { ReactNode } from 'react';
import Layout from './partials/layout';
import BecomeInstructor from './tabs-content/become-instructor';
import MyCourses from './tabs-content/my-courses';
import MyProfile from './tabs-content/my-profile';
import Settings from './tabs-content/settings';
import Wishlist from './tabs-content/wishlist';

const Index = (props: StudentDashboardProps) => {
   const { instructor, enrollments, wishlists, translate } = props;
   const { frontend } = translate;

   const renderContent = () => {
      switch (props.tab) {
         case 'courses':
            return <MyCourses enrollments={enrollments} />;
         case 'wishlist':
            return <Wishlist wishlists={wishlists} />;
         case 'profile':
            return <MyProfile />;
         case 'settings':
            return <Settings />;
         case 'instructor':
            return <BecomeInstructor instructor={instructor} />;
         default:
            return <></>;
      }
   };

   return (
      <>
         <Head title={frontend.student_dashboard} />

         {renderContent()}
      </>
   );
};

Index.layout = (page: ReactNode & StudentDashboardProps) => <Layout children={page} tab={page.tab} />;

export default Index;
