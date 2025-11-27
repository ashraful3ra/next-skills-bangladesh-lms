import DeleteModal from '@/components/inertia/delete-modal';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ColumnDef } from '@tanstack/react-table';
import { ArrowUpDown, Trash2, UserCheck } from 'lucide-react';
import { PageProps } from '@/types';
import { usePage } from '@inertiajs/react';

// Admin টাইপ টি আপনার প্রজেক্টের টাইপ অনুযায়ী এডজাস্ট করে নিন অথবা any ব্যবহার করুন
export const TableColumn = (): ColumnDef<any>[] => {
   const { auth } = usePage<PageProps>().props;

   return [
      {
         accessorKey: 'name',
         header: ({ column }) => {
            return (
               <Button variant="ghost" className="p-0 hover:bg-transparent" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
                  Name
                  <ArrowUpDown className="ml-2 h-4 w-4" />
               </Button>
            );
         },
         cell: ({ row }) => (
            <div className="flex items-center gap-2">
               <Avatar className="h-11 w-11">
                  <AvatarImage src={row.original.photo || ''} className="object-cover" />
                  <AvatarFallback>{row.original.name?.charAt(0)}</AvatarFallback>
               </Avatar>

               <div>
                  <p className="mb-0.5 text-base font-medium flex items-center gap-1">
                     {row.original.name}
                     {row.original.id === auth.user.id && <span className="text-xs text-muted-foreground">(You)</span>}
                  </p>
                  <p className="text-muted-foreground text-xs">{row.original.email}</p>
               </div>
            </div>
         ),
      },
      {
         accessorKey: 'created_at',
         header: 'Joined Date',
         cell: ({ row }) => (
            <div className="capitalize">
               <span>{new Date(row.original.created_at).toLocaleDateString()}</span>
            </div>
         ),
      },
      {
         id: 'actions',
         header: () => <div className="text-end">Action</div>,
         cell: ({ row }) => {
            // নিজেকে ডিলিট করা যাবে না
            if (row.original.id === auth.user.id) return null;

            return (
               <div className="flex justify-end gap-2 py-1">
                  <DeleteModal
                     url={route('admins.destroy', row.original.id)}
                     id={row.original.id}
                     message="Are you sure you want to remove this admin? This action cannot be undone."
                     actionComponent={
                        <Button size="icon" variant="ghost" className="bg-destructive/10 hover:bg-destructive/20 h-8 w-8 p-0 text-destructive">
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