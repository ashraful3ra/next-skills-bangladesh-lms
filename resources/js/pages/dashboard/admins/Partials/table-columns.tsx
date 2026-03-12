import DeleteModal from '@/components/inertia/delete-modal';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ColumnDef } from '@tanstack/react-table';
import { ArrowUpDown, Trash2 } from 'lucide-react';
import { PageProps } from '@/types';
import { usePage } from '@inertiajs/react';

// টাইপ ডিফিনিশন (ঐচ্ছিক কিন্তু ভালো প্র্যাকটিস)
interface AdminUser {
    id: number;
    name: string;
    email: string;
    photo?: string;
    created_at: string;
}

export const TableColumn = (): ColumnDef<AdminUser>[] => {
   const { auth } = usePage<PageProps>().props;

   return [
      {
         accessorKey: 'name',
         header: ({ column }) => (
            <Button 
                variant="ghost" 
                className="p-0 hover:bg-transparent" 
                onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            >
               Name
               <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
         ),
         cell: ({ row }) => {
            const admin = row.original;
            const isCurrentUser = admin.id === auth.user.id;

            return (
               <div className="flex items-center gap-2">
                  <Avatar className="h-10 w-10 border">
                     <AvatarImage src={admin.photo || ''} className="object-cover" />
                     <AvatarFallback>{admin.name?.charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>

                  <div className="flex flex-col">
                     <span className="text-sm font-semibold flex items-center gap-1.5">
                        {admin.name}
                        {isCurrentUser && (
                           <span className="px-1.5 py-0.5 rounded-full bg-primary/10 text-[10px] text-primary font-medium">
                              You
                           </span>
                        )}
                     </span>
                     <span className="text-muted-foreground text-xs">{admin.email}</span>
                  </div>
               </div>
            );
         },
      },
      {
         accessorKey: 'created_at',
         header: 'Joined Date',
         cell: ({ row }) => (
            <div className="text-sm text-muted-foreground">
               {new Date(row.original.created_at).toLocaleDateString('en-GB', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
               })}
            </div>
         ),
      },
      {
         id: 'actions',
         header: () => <div className="text-right pr-4">Action</div>,
         cell: ({ row }) => {
            const admin = row.original;

            // নিজেকে ডিলিট করার অপশন হাইড করা হলো
            if (admin.id === auth.user.id) return null;

            return (
               <div className="flex justify-end pr-2">
                  <DeleteModal
                     // নিশ্চিত করুন যে route('admins.destroy', admin.id) সঠিক URL জেনারেট করছে
                     url={route('admins.destroy', admin.id)}
                     message={`Are you sure you want to remove ${admin.name}? This action cannot be undone.`}
                     actionComponent={
                        <Button 
                           size="icon" 
                           variant="ghost" 
                           className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 w-8"
                        >
                           <Trash2 className="h-4 w-4" />
                        </Button>
                     }
                  />
               </div>
            );
         },
      },
   ];
};

export default TableColumn;