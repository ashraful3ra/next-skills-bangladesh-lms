import DefaultCard from '@/components/cards/course-card-1';
import { Card } from '@/components/ui/card';
import { SharedData } from '@/types/global';
import { usePage } from '@inertiajs/react';

const Wishlist = ({ wishlists }: { wishlists?: CourseWishlist[] }) => {
   const { props } = usePage<SharedData>();
   const { frontend } = props.translate;

   return wishlists && wishlists.length > 0 ? (
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3">
         {wishlists.map(({ id, course }) => (
            <DefaultCard key={id} course={course} wishlists={wishlists} />
         ))}
      </div>
   ) : (
      <Card className="flex items-center justify-center p-6">
         <p>{frontend.no_wishlist_items}</p>
      </Card>
   );
};

export default Wishlist;
