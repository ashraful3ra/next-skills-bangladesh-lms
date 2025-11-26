import DeleteModal from '@/components/inertia/delete-modal';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ColumnDef } from '@tanstack/react-table';
import { Trash2, UserCheck } from 'lucide-react';

const AdminTableColumn = (translate: LanguageTranslations): ColumnDef<Enrollment>[] => {
   const { table } = translate;
   
   return [
      {
         id: 'index',
         header: () => <div className="pl-4">#</div>,
         cell: ({ row }) => <div className="w-4 pl-4 text-center font-medium">{row.index + 1}</div>,
      },
      {
         id: 'student',
         header: table.name,
         cell: ({ row }) => {
            const user = row.original.user;
            return (
               <div className="flex items-center gap-3">
                  <div className="h-10 w-10 overflow-hidden rounded-full border border-gray-200 bg-gray-100">
                     {user.photo ? (
                        <img src={user.photo} alt={user.name} className="h-full w-full object-cover" />
                     ) : (
                        <div className="flex h-full w-full items-center justify-center text-sm font-semibold text-gray-500">
                           {user.name.charAt(0).toUpperCase()}
                        </div>
                     )}
                  </div>
                  <div>
                     <p className="font-medium text-gray-900">{user.name}</p>
                     <p className="text-sm text-gray-500">{user.email}</p>
                  </div>
               </div>
            );
         },
      },
      {
         id: 'enrolled_course',
         header: table.enrolled_course,
         cell: ({ row }) => (
            <div className="max-w-md">
               <p className="line-clamp-1">{row.original.course.title}</p>
            </div>
         ),
      },
      // ✅ Enrolled By Column (Fixed: Shows ONLY the creator from DB)
      {
         accessorKey: 'enrolled_by',
         header: "Enrolled By",
         cell: ({ row }) => {
            const enroller = row.original.enrolled_by;
            // যদি ডাটাবেসে নাম থাকে, তবেই সেটা দেখাবে। না হলে System/Self দেখাবে।
            const displayName = enroller ? enroller.name : 'System/Self';

            return (
               <div className="flex items-center gap-2 text-sm">
                  <UserCheck className="h-3 w-3 text-gray-400" />
                  <span className="font-medium text-gray-700">
                     {displayName}
                  </span>
               </div>
            );
         },
      },
      // ✅ Batch No Column (Included as requested)
      {
         id: 'batch_no',
         header: () => <div className="text-center">{table.batch_no ?? 'Batch'}</div>,
         cell: ({ row }) => {
            const course = row.original.course;
            return <div className="text-center font-medium capitalize">{course?.batch_no || course?.course_mode || '--'}</div>;
         },
      },
      {
         id: 'enrolled_date',
         header: table.enrolled_date,
         cell: ({ row }) => {
            const date = new Date(row.original.entry_date);
            return <div>{date.toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' })}</div>;
         },
      },
      {
         id: 'expiry_date',
         header: table.expiry_date,
         cell: ({ row }) => {
            if (!row.original.expiry_date) return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">{table.lifetime_access}</Badge>;
            const date = new Date(row.original.expiry_date);
            return <div>{date.toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' })}</div>;
         },
      },
      {
         id: 'actions',
         header: table.action,
         cell: ({ row }) => (
            <div className="flex items-center justify-end gap-2 pr-4">
               <DeleteModal
                  id={row.original.id}
                  title={table.delete_title}
                  url="/dashboard/enrollments"
                  description={table.delete_description}
                  actionComponent={
                     <Button size="icon" variant="ghost" className="h-8 w-8 bg-red-50 text-red-500 hover:bg-red-100 hover:text-red-500">
                        <Trash2 className="h-5 w-5" />
                     </Button>
                  }
               />
            </div>
         ),
      },
   ];
};

export default AdminTableColumn;