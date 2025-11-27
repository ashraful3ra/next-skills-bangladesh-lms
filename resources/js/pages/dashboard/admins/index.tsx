import React, { ReactNode, useState } from 'react';
import { Head } from '@inertiajs/react';
import { SortingState, flexRender, getCoreRowModel, getFilteredRowModel, getSortedRowModel, useReactTable } from '@tanstack/react-table';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';
import DashboardLayout from '@/layouts/dashboard/layout';
import TableFilter from '@/components/table/table-filter';
import TableFooter from '@/components/table/table-footer';
import TableHeader from '@/components/table/table-header';
import TableColumn from './Partials/table-columns';
import CreateAdminDialog from './Partials/create-admin-dialog';
import { SharedData } from '@/types/global';

interface AdminUser {
  id: number;
  name: string;
  email: string;
  photo?: string;
  role: string;
  created_at: string;
}

interface Pagination<T> {
    data: T[];
    links: any[];
    meta?: any;
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
}

interface Props extends SharedData {
   admins: Pagination<AdminUser>;
}

const Index = (props: Props) => {
   const [sorting, setSorting] = useState<SortingState>([]);

   const table = useReactTable({
      data: props.admins.data,
      columns: TableColumn(),
      onSortingChange: setSorting,
      getCoreRowModel: getCoreRowModel(),
      getSortedRowModel: getSortedRowModel(),
      getFilteredRowModel: getFilteredRowModel(),
      state: { sorting },
   });

   return (
      <>
        <Head title="Admins" />
        <Card>
           {/* Custom Header with Create Button mimicking TableFilter header style if needed, 
               or placing Button alongside filter if layout permits. 
               Since TableFilter handles 'title', we put the button in a flexible container if needed,
               but TableFilter structure is fixed. Let's place the button above for clarity 
               or modify TableFilter to accept actions (if your component allows).
               
               Assuming TableFilter is just the filter bar, here is a clean layout:
           */}
           
           <div className="flex flex-col gap-4">
               <div className="flex items-center justify-between px-6 pt-6 pb-0">
                   <h2 className="text-xl font-semibold">Admin List</h2>
                   <CreateAdminDialog />
               </div>

               <TableFilter
                  data={props.admins}
                  title="" // Title disabled here since we added custom header above
                  globalSearch={true}
                  tablePageSizes={[10, 15, 20, 25]}
                  routeName="admins.index"
               />
           </div>

           <Table className="border-border border-y">
              <TableHeader table={table} tableHeadClass="px-6" />

              <TableBody>
                 {table.getRowModel().rows.length > 0 ? (
                    table.getRowModel().rows.map((row) => (
                       <TableRow key={row.id} data-state={row.getIsSelected() && 'selected'}>
                          {row.getVisibleCells().map((cell) => (
                             <TableCell key={cell.id} className="px-6">
                                {flexRender(cell.column.columnDef.cell, cell.getContext())}
                             </TableCell>
                          ))}
                       </TableRow>
                    ))
                 ) : (
                    <TableRow>
                       <TableCell colSpan={TableColumn().length} className="h-24 text-center">
                          No results.
                       </TableCell>
                    </TableRow>
                 )}
              </TableBody>
           </Table>

           <TableFooter className="p-5 sm:p-7" routeName="admins.index" paginationInfo={props.admins} />
        </Card>
      </>
   );
};

Index.layout = (page: ReactNode) => <DashboardLayout children={page} />;

export default Index;