import React from 'react';
import Layout from '@/layouts/dashboard/layout';
import { Head, router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function PendingRefunds({ refunds }) {
    
    const approve = (id) => {
        if(confirm('Are you sure you want to approve this request?')) {
            router.post(route('refunds.approve', id));
        }
    };

    return (
        <Layout>
            <Head title="Pending Refunds" />
            <div className="p-6">
                <h1 className="text-2xl font-bold mb-6">Pending Applications</h1>
                <div className="bg-white rounded shadow overflow-hidden">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-100">
                            <tr>
                                <th className="p-3">Date</th>
                                <th className="p-3">Student Info</th>
                                <th className="p-3">Payment Info</th>
                                <th className="p-3">Reason</th>
                                <th className="p-3 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {refunds.map((refund) => (
                                <tr key={refund.id} className="border-b hover:bg-gray-50">
                                    <td className="p-3">{new Date(refund.updated_at).toLocaleDateString()}</td>
                                    <td className="p-3">
                                        <p className="font-bold">{refund.user.name}</p>
                                        <p className="text-xs text-gray-500">{refund.course.title} (Batch: {refund.batch_no})</p>
                                    </td>
                                    <td className="p-3">
                                        <p className="font-bold text-green-600">{refund.refund_amount} TK</p>
                                        <Badge variant="outline" className="uppercase">{refund.refund_method}</Badge>
                                        <p className="text-xs mt-1">{refund.account_number}</p>
                                    </td>
                                    <td className="p-3 text-gray-600 max-w-xs truncate">{refund.reason}</td>
                                    <td className="p-3 text-right">
                                        <Button size="sm" onClick={() => approve(refund.id)}>Approve</Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </Layout>
    );
}