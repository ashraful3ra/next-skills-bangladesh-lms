import { Head, Link } from '@inertiajs/react';
import Layout from '@/layouts/dashboard/layout';
import { Card } from '@/components/ui/card';
import TableFilter from '@/components/table/table-filter';
import TableHeader from '@/components/table/table-header';
import TableFooter from '@/components/table/table-footer';
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { 
    useReactTable, 
    getCoreRowModel, 
    flexRender,
    ColumnDef
} from '@tanstack/react-table';
import CreatePaymentModal from './partials/create-payment-modal';
import { Trash2 } from 'lucide-react';
import DeleteModal from '@/components/inertia/delete-modal';
import { Button } from '@/components/ui/button';

// কলাম ডিফিনিশন
const columns: ColumnDef<any>[] = [
    {
        accessorKey: 'id',
        header: '#ID',
        cell: ({ row }) => <span className="font-medium text-gray-600">#{row.original.id}</span>,
    },
    {
        accessorKey: 'user',
        header: 'Student',
        cell: ({ row }) => (
            <div className="flex flex-col">
                {row.original.user ? (
                    <>
                        <Link 
                            href={`/dashboard/users/${row.original.user_id}`} 
                            className="font-medium text-primary hover:underline truncate max-w-[180px]"
                        >
                            {row.original.user.name}
                        </Link>
                        <span className="text-xs text-gray-500">{row.original.user.email}</span>
                    </>
                ) : (
                    <span className="text-red-500">User Deleted</span>
                )}
            </div>
        ),
    },
    {
        accessorKey: 'course',
        header: 'Course',
        cell: ({ row }) => (
            <span className="line-clamp-2 max-w-[200px] font-medium" title={row.original.course?.title}>
                {row.original.course?.title || 'Unknown Course'}
            </span>
        ),
    },
    // ✅ New Batch No Column
    {
        accessorKey: 'batch_no',
        header: 'Batch',
        cell: ({ row }) => (
            <Badge variant="outline" className="font-mono text-xs">
                {row.original.course?.batch_no || 'Main'}
            </Badge>
        ),
    },
    {
        accessorKey: 'payment_type',
        header: 'Method',
        cell: ({ row }) => (
            <div className="flex flex-col gap-1">
                <Badge variant="outline" className="capitalize w-fit">{row.original.payment_type || 'Manual'}</Badge>
                {row.original.transaction_id && (
                    <span className="text-[10px] text-gray-500 font-mono" title="Transaction ID">{row.original.transaction_id}</span>
                )}
            </div>
        ),
    },
    {
        accessorKey: 'amount',
        header: 'Paid Amount',
        cell: ({ row }) => <div className="font-bold text-green-600">{row.original.amount} TK</div>,
    },
    {
        accessorKey: 'calculated_due',
        header: 'Total Due',
        cell: ({ row }) => <div className="font-medium text-red-500">{row.original.calculated_due} TK</div>,
    },
    {
        accessorKey: 'calculated_status',
        header: 'Status',
        cell: ({ row }) => {
            const status = row.original.calculated_status;
            let className = "bg-gray-100 text-gray-800";
            if(status === 'Paid') className = "bg-green-100 text-green-800 hover:bg-green-200 border-green-200";
            else if(status === 'Due') className = "bg-red-100 text-red-800 hover:bg-red-200 border-red-200";
            else if(status === 'Partial') className = "bg-yellow-100 text-yellow-800 hover:bg-yellow-200 border-yellow-200";
            
            return <Badge variant="outline" className={className}>{status}</Badge>;
        },
    },
    {
        id: 'actions',
        header: 'Action',
        cell: ({ row }) => (
            <DeleteModal
                url={`/dashboard/payment-histories`} 
                id={row.original.id}
                title="Delete Transaction"
                description="Are you sure you want to delete this payment record?"
                actionComponent={
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-red-500 hover:bg-red-50 hover:text-red-600">
                        <Trash2 className="h-4 w-4" />
                    </Button>
                }
            />
        ),
    },
];

export default function PaymentHistories({ paymentHistories, courses }: { paymentHistories: any, courses: any[] }) {
    
    const table = useReactTable({
        data: paymentHistories.data,
        columns,
        getCoreRowModel: getCoreRowModel(),
        manualPagination: true,
        pageCount: paymentHistories.last_page,
    });

    return (
        <Layout>
            <Head title="Payment Histories" />
            <div className="p-6">
                <Card>
                    <TableFilter
                        title="Payment Histories"
                        data={paymentHistories}
                        globalSearch={true}
                        tablePageSizes={[10, 20, 50]}
                        routeName="payment-histories.index"
                        component={<CreatePaymentModal courses={courses} />}
                    />

                    <div className="border-t border-b">
                        <Table>
                            <TableHeader table={table} tableHeadClass="px-6" />
                            
                            <TableBody>
                                {table.getRowModel().rows.length > 0 ? (
                                    table.getRowModel().rows.map((row) => (
                                        <TableRow key={row.id}>
                                            {row.getVisibleCells().map((cell) => (
                                                <TableCell key={cell.id} className="px-6 py-3">
                                                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                                </TableCell>
                                            ))}
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={columns.length} className="h-24 text-center">
                                            No results found.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    <TableFooter 
                        routeName="payment-histories.index" 
                        paginationInfo={paymentHistories} 
                        className="p-4"
                    />
                </Card>
            </div>
        </Layout>
    );
}