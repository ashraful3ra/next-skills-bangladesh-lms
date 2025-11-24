import { Head } from '@inertiajs/react';
import Layout from '@/layouts/dashboard/layout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import DeleteModal from '@/components/inertia/delete-modal';
import { Button } from '@/components/ui/button';
import { Trash2, User, BookOpen, CreditCard, History } from 'lucide-react';

export default function UserShow({ student }: { student: any }) {
    return (
        <Layout>
            <Head title={`${student.name} - Profile`} />

            <div className="space-y-6 p-6">
                {/* Header Section */}
                <div className="flex items-center gap-4 bg-white p-6 rounded-lg border shadow-sm">
                    <div className="h-20 w-20 overflow-hidden rounded-full border-2 border-primary/10">
                        {student.photo ? (
                            <img src={student.photo} alt={student.name} className="h-full w-full object-cover" />
                        ) : (
                            <div className="flex h-full w-full items-center justify-center bg-gray-100 text-2xl font-bold text-gray-500">
                                {student.name.charAt(0)}
                            </div>
                        )}
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">{student.name}</h2>
                        <p className="text-gray-500">{student.email}</p>
                        <div className="flex gap-2 mt-2">
                            <Badge className="capitalize" variant="secondary">{student.role}</Badge>
                            {student.phone && <Badge variant="outline">{student.phone}</Badge>}
                        </div>
                    </div>
                </div>

                {/* Tabs Section */}
                <Tabs defaultValue="profile" className="w-full">
                    <TabsList className="grid w-full max-w-md grid-cols-3">
                        <TabsTrigger value="profile" className="gap-2"><User className="w-4 h-4"/> Profile</TabsTrigger>
                        <TabsTrigger value="enrollments" className="gap-2"><BookOpen className="w-4 h-4"/> Enrollments</TabsTrigger>
                        <TabsTrigger value="payment" className="gap-2"><CreditCard className="w-4 h-4"/> Payment</TabsTrigger>
                    </TabsList>

                    {/* Tab 1: Profile Info */}
                    <TabsContent value="profile" className="mt-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>User Information</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-1">
                                        <label className="text-sm font-medium text-gray-500">Full Name</label>
                                        <p className="text-lg font-medium text-gray-900">{student.name}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-sm font-medium text-gray-500">Email Address</label>
                                        <p className="text-lg font-medium text-gray-900">{student.email}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-sm font-medium text-gray-500">Phone Number</label>
                                        <p className="text-lg font-medium text-gray-900">{student.phone || 'Not Provided'}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-sm font-medium text-gray-500">Joined Date</label>
                                        <p className="text-lg font-medium text-gray-900">{new Date(student.created_at).toLocaleDateString()}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Tab 2: Enrollments List */}
                    <TabsContent value="enrollments" className="mt-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Enrolled Courses ({student.enrollments.length})</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {student.enrollments.length > 0 ? (
                                    <div className="overflow-hidden rounded-lg border">
                                        <table className="w-full text-sm text-left">
                                            <thead className="text-gray-500 bg-gray-50 border-b">
                                                <tr>
                                                    <th className="px-4 py-3 font-medium">Course Name</th>
                                                    <th className="px-4 py-3 font-medium">Enrolled Date</th>
                                                    <th className="px-4 py-3 font-medium text-right">Action</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y">
                                                {student.enrollments.map((enroll: any) => (
                                                    <tr key={enroll.id} className="hover:bg-gray-50">
                                                        <td className="px-4 py-3 font-medium text-gray-900">{enroll.course?.title || 'Unknown Course'}</td>
                                                        <td className="px-4 py-3 text-gray-500">{new Date(enroll.created_at).toLocaleDateString()}</td>
                                                        <td className="px-4 py-3 text-right">
                                                            <DeleteModal
                                                                url={`/dashboard/enrollments`}
                                                                id={enroll.id}
                                                                title="Remove Enrollment"
                                                                description="Are you sure you want to remove this student from this course? This cannot be undone."
                                                                actionComponent={
                                                                    <Button size="sm" variant="destructive" className="h-8 px-3">
                                                                        <Trash2 className="w-4 h-4 mr-1" /> Remove
                                                                    </Button>
                                                                }
                                                            />
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-10 text-center">
                                        <BookOpen className="h-10 w-10 text-gray-300 mb-2" />
                                        <p className="text-gray-500">No active enrollments found for this student.</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Tab 3: Payment Info */}
                    <TabsContent value="payment" className="mt-6 space-y-6">
                        
                        {/* Section 1: Course Summary (Aggregated) */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Course Payment Summary</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {student.enrollments.length > 0 ? (
                                    <div className="overflow-hidden rounded-lg border">
                                        <table className="w-full text-sm text-left">
                                            <thead className="text-gray-500 bg-gray-50 border-b">
                                                <tr>
                                                    <th className="px-4 py-3 font-medium">Course Name</th>
                                                    <th className="px-4 py-3 font-medium">Total Price</th>
                                                    <th className="px-4 py-3 font-medium text-green-600">Paid Total</th>
                                                    <th className="px-4 py-3 font-medium text-red-600">Due</th>
                                                    <th className="px-4 py-3 font-medium text-center">Status</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y">
                                                {student.enrollments.map((enroll: any) => (
                                                    <tr key={enroll.id} className="hover:bg-gray-50">
                                                        <td className="px-4 py-3 font-medium text-gray-900">{enroll.payment_info.course_title}</td>
                                                        <td className="px-4 py-3 font-bold text-gray-700">{enroll.payment_info.course_price} TK</td>
                                                        <td className="px-4 py-3 text-green-600 font-medium">{enroll.payment_info.paid_amount} TK</td>
                                                        <td className="px-4 py-3 text-red-600 font-medium">{enroll.payment_info.due_amount} TK</td>
                                                        <td className="px-4 py-3 text-center">
                                                            <Badge 
                                                                variant={enroll.payment_info.due_amount > 0 ? "destructive" : "secondary"} 
                                                                className={enroll.payment_info.status === 'Paid' ? "bg-green-100 text-green-800 hover:bg-green-200" : ""}
                                                            >
                                                                {enroll.payment_info.status}
                                                            </Badge>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <p className="text-center text-gray-500">No enrollment data found.</p>
                                )}
                            </CardContent>
                        </Card>

                        {/* Section 2: Detailed Transaction History (Delete allowed here) */}
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <CardTitle className="flex items-center gap-2">
                                    <History className="w-5 h-5"/> Transaction History
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {student.payment_histories.length > 0 ? (
                                    <div className="overflow-hidden rounded-lg border">
                                        <table className="w-full text-sm text-left">
                                            <thead className="text-gray-500 bg-gray-50 border-b">
                                                <tr>
                                                    <th className="px-4 py-3 font-medium">Date</th>
                                                    <th className="px-4 py-3 font-medium">Course</th>
                                                    <th className="px-4 py-3 font-medium">Invoice</th>
                                                    <th className="px-4 py-3 font-medium">Method</th>
                                                    <th className="px-4 py-3 font-medium text-right">Amount</th>
                                                    <th className="px-4 py-3 font-medium text-right">Action</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y">
                                                {student.payment_histories.map((history: any) => (
                                                    <tr key={history.id} className="hover:bg-gray-50">
                                                        <td className="px-4 py-3 text-gray-600">
                                                            {new Date(history.created_at).toLocaleDateString()}
                                                        </td>
                                                        <td className="px-4 py-3 font-medium text-gray-900">
                                                            {history.course?.title || 'Unknown'}
                                                        </td>
                                                        <td className="px-4 py-3 font-mono text-xs text-gray-500">
                                                            {history.invoice || history.transaction_id || 'N/A'}
                                                        </td>
                                                        <td className="px-4 py-3 capitalize text-gray-600">
                                                            {history.payment_type || 'Manual'}
                                                        </td>
                                                        <td className="px-4 py-3 text-right font-bold text-gray-800">
                                                            {history.amount} TK
                                                        </td>
                                                        <td className="px-4 py-3 text-right">
                                                            <DeleteModal
                                                                // ✅ Deleting specific payment history ID
                                                                url={`/dashboard/payment-histories`} 
                                                                id={history.id}
                                                                title="Delete Transaction"
                                                                description={`Are you sure you want to delete this payment of ${history.amount} TK? The due amount will increase.`}
                                                                actionComponent={
                                                                    <Button size="sm" variant="outline" className="h-8 px-3 text-red-500 hover:text-red-600 hover:bg-red-50 border-red-200">
                                                                        <Trash2 className="w-4 h-4" />
                                                                    </Button>
                                                                }
                                                            />
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-8 text-center">
                                        <CreditCard className="h-10 w-10 text-gray-300 mb-2" />
                                        <p className="text-gray-500">No individual payment records found.</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                    </TabsContent>
                </Tabs>
            </div>
        </Layout>
    );
}