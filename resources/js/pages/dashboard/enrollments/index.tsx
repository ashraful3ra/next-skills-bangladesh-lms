import TableFilter from '@/components/table/table-filter';
import TableFooter from '@/components/table/table-footer';
import TableHeader from '@/components/table/table-header';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';
import DashboardLayout from '@/layouts/dashboard/layout';
import { SharedData } from '@/types/global';
import { Link } from '@inertiajs/react';
import { SortingState, flexRender, getCoreRowModel, getFilteredRowModel, getSortedRowModel, useReactTable } from '@tanstack/react-table';
import * as React from 'react';
import { ReactNode } from 'react';
import AdminTableColumn from './partials/admin-table-columns';
import InstructorTableColumn from './partials/instructor-table-columns';
import BulkEnrollModal from "./partials/bulk-enroll-modal"; // নতুন মডাল ইমপোর্ট

interface Props extends SharedData {
   enrollments: Pagination<Enrollment>;
   courses: any[]; // নতুন প্রপস যুক্ত করা হয়েছে
}

const Index = (props: Props) => {
   const [sorting, setSorting] = React.useState<SortingState>([]);
   const { translate, enrollments, courses } = props;
   const { button, dashboard } = translate;

   const table = useReactTable({
      data: enrollments.data,
      columns: props.auth.user.role === 'admin' ? AdminTableColumn(translate) : InstructorTableColumn(translate),
      onSortingChange: setSorting,
      getCoreRowModel: getCoreRowModel(),
      getSortedRowModel: getSortedRowModel(),
      getFilteredRowModel: getFilteredRowModel(),
      state: { sorting },
   });

   return (
      <div>
         <div className="flex gap-2">
             <Link href={route('enrollments.create')}>
                <Button>{button.add_new_enrollment}</Button>
             </Link>
             
             {/* নতুন বাল্ক এনরোল বাটন ও মডাল */}
             <BulkEnrollModal courses={courses} />
         </div>

         <Separator className="my-6" />

         <Card>
            <TableFilter
               data={enrollments}
               title={dashboard.course_list}
               globalSearch={true}
               tablePageSizes={[10, 15, 20, 25]}
               routeName="enrollments.index"
            />

            <Table className="border-border border-y">
               <TableHeader table={table} />

               <TableBody>
                  {enrollments.data && enrollments.data.length > 0 ? (
                     table.getRowModel().rows.map((row) => (
                        <TableRow key={row.id} data-state={row.getIsSelected() && 'selected'}>
                           {row.getVisibleCells().map((cell) => (
                              <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                           ))}
                        </TableRow>
                     ))
                  ) : (
                     <TableRow>
                        <TableCell className="h-24 text-center">{dashboard.no_results}</TableCell>
                     </TableRow>
                  )}
               </TableBody>
            </Table>

            <TableFooter className="p-5 sm:p-7" routeName="enrollments.index" paginationInfo={enrollments} />
         </Card>
      </div>
   );
};

Index.layout = (page: ReactNode) => <DashboardLayout children={page} />;

export default Index;