import React, { useState } from 'react';
import { Head, useForm } from '@inertiajs/react';
import Layout from '@/layouts/dashboard/layout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import DeleteModal from '@/components/inertia/delete-modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Trash2, User, BookOpen, CreditCard, History, Edit, Save, X, Lock, Phone, Mail, AlertCircle, CheckCircle } from 'lucide-react';

export default function UserShow({ student }: { student: any }) {
    const [isEditing, setIsEditing] = useState(false);

    // Form handling with Inertia
    const { data, setData, put, processing, errors, reset } = useForm({
        name: student.name || '',
        email: student.email || '',
        phone: student.phone || '',
        password: '',
        password_confirmation: '',
    });

    // Filter Transactions
    const activeTransactions = student.payment_histories.filter((h: any) => !h.is_refunded);
    const refundedTransactions = student.payment_histories.filter((h: any) => h.is_refunded);

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        put(route('users.update', student.id), {
            onSuccess: () => {
                setIsEditing(false);
                reset('password', 'password_confirmation');
            },
        });
    };

    const cancelEdit = () => {
        setIsEditing(false);
        reset();
    };

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

                    {/* Tab 1: Profile Info (Editable) */}
                    <TabsContent value="profile" className="mt-6">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle>User Information</CardTitle>
                                {!isEditing && (
                                    <Button variant="outline" size="sm" onClick={() => setIsEditing(true)} className="gap-2">
                                        <Edit className="w-4 h-4" /> Edit Profile
                                    </Button>
                                )}
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={submit} className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <Label htmlFor="name" className="text-gray-500">Full Name</Label>
                                            {isEditing ? (
                                                <div>
                                                    <Input
                                                        id="name"
                                                        value={data.name}
                                                        onChange={(e) => setData('name', e.target.value)}
                                                        placeholder="Enter full name"
                                                        disabled={processing}
                                                    />
                                                    {errors.name && <p className="text-sm text-red-500 mt-1">{errors.name}</p>}
                                                </div>
                                            ) : (
                                                <p className="text-lg font-medium text-gray-900 flex items-center gap-2">
                                                    <User className="w-4 h-4 text-gray-400" /> {student.name}
                                                </p>
                                            )}
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="phone" className="text-gray-500">Phone Number</Label>
                                            {isEditing ? (
                                                <div>
                                                    <Input
                                                        id="phone"
                                                        value={data.phone}
                                                        onChange={(e) => setData('phone', e.target.value)}
                                                        placeholder="Enter phone number"
                                                        disabled={processing}
                                                    />
                                                    {errors.phone && <p className="text-sm text-red-500 mt-1">{errors.phone}</p>}
                                                </div>
                                            ) : (
                                                <p className="text-lg font-medium text-gray-900 flex items-center gap-2">
                                                    <Phone className="w-4 h-4 text-gray-400" /> {student.phone || 'Not Provided'}
                                                </p>
                                            )}
                                        </div>

                                        <div className="space-y-2 md:col-span-2">
                                            <Label htmlFor="email" className="text-gray-500">Email Address</Label>
                                            {isEditing ? (
                                                <div>
                                                    <Input
                                                        id="email"
                                                        type="email"
                                                        value={data.email}
                                                        onChange={(e) => setData('email', e.target.value)}
                                                        placeholder="Enter email address"
                                                        disabled={processing}
                                                    />
                                                    {errors.email && <p className="text-sm text-red-500 mt-1">{errors.email}</p>}
                                                </div>
                                            ) : (
                                                <p className="text-lg font-medium text-gray-900 flex items-center gap-2">
                                                    <Mail className="w-4 h-4 text-gray-400" /> {student.email}
                                                </p>
                                            )}
                                        </div>

                                        {isEditing && (
                                            <div className="md:col-span-2 border-t pt-4 mt-2 border-dashed">
                                                <h3 className="text-md font-semibold mb-3 text-gray-700 flex items-center gap-2">
                                                    <Lock className="w-4 h-4" /> Change Password <span className="text-xs font-normal text-gray-500">(Leave blank to keep current)</span>
                                                </h3>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                    <div className="space-y-2">
                                                        <Label htmlFor="password">New Password</Label>
                                                        <Input
                                                            id="password"
                                                            type="password"
                                                            value={data.password}
                                                            onChange={(e) => setData('password', e.target.value)}
                                                            placeholder="New password"
                                                            disabled={processing}
                                                        />
                                                        {errors.password && <p className="text-sm text-red-500 mt-1">{errors.password}</p>}
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label htmlFor="password_confirmation">Confirm Password</Label>
                                                        <Input
                                                            id="password_confirmation"
                                                            type="password"
                                                            value={data.password_confirmation}
                                                            onChange={(e) => setData('password_confirmation', e.target.value)}
                                                            placeholder="Confirm new password"
                                                            disabled={processing}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {!isEditing && (
                                            <div className="space-y-2">
                                                <Label className="text-gray-500">Joined Date</Label>
                                                <p className="text-lg font-medium text-gray-900">
                                                    {new Date(student.created_at).toLocaleDateString()}
                                                </p>
                                            </div>
                                        )}
                                    </div>

                                    {isEditing && (
                                        <div className="flex items-center justify-end gap-3 pt-4 border-t mt-4">
                                            <Button type="button" variant="ghost" onClick={cancelEdit} disabled={processing}>
                                                <X className="w-4 h-4 mr-2" /> Cancel
                                            </Button>
                                            <Button type="submit" disabled={processing} className="bg-primary text-white">
                                                <Save className="w-4 h-4 mr-2" /> Save Changes
                                            </Button>
                                        </div>
                                    )}
                                </form>
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
                                                    <th className="px-4 py-3 font-medium text-center">Batch</th>
                                                    <th className="px-4 py-3 font-medium">Enrolled Date</th>
                                                    <th className="px-4 py-3 font-medium text-right">Action</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y">
                                                {student.enrollments.map((enroll: any) => (
                                                    <tr key={enroll.id} className="hover:bg-gray-50">
                                                        <td className="px-4 py-3 font-medium text-gray-900">{enroll.course?.title || 'Unknown Course'}</td>
                                                        <td className="px-4 py-3 text-center">
                                                            <Badge variant="outline" className="font-mono">
                                                                {enroll.batch_label}
                                                            </Badge>
                                                        </td>
                                                        <td className="px-4 py-3 text-gray-500">{new Date(enroll.created_at).toLocaleDateString()}</td>
                                                        <td className="px-4 py-3 text-right">
                                                            <DeleteModal
                                                                url={`/dashboard/enrollments`}
                                                                id={enroll.id}
                                                                title="Remove Enrollment"
                                                                description="Are you sure you want to remove this student from this course?"
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
                                        <p className="text-gray-500">No active enrollments found.</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Tab 3: Payment Info */}
                    <TabsContent value="payment" className="mt-6 space-y-6">
                        
                        {/* Section 1: Course Payment Summary */}
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
                                                    <th className="px-4 py-3 font-medium text-center">Batch</th>
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
                                                        <td className="px-4 py-3 text-center">
                                                            <Badge variant="outline" className="font-mono">
                                                                {enroll.payment_info.batch_label}
                                                            </Badge>
                                                        </td>
                                                        <td className="px-4 py-3 font-bold text-gray-700">{enroll.payment_info.course_price} TK</td>
                                                        <td className="px-4 py-3 text-green-600 font-medium">{enroll.payment_info.paid_amount} TK</td>
                                                        <td className="px-4 py-3 text-red-600 font-medium">{enroll.payment_info.due_amount} TK</td>
                                                        <td className="px-4 py-3 text-center">
                                                            <Badge 
                                                                variant="outline" 
                                                                className={
                                                                    enroll.payment_info.status === 'Paid' 
                                                                        ? "bg-green-100 text-green-800 hover:bg-green-200 border-green-200" 
                                                                    : enroll.payment_info.status === 'Refunded' 
                                                                        ? "bg-gray-800 text-white hover:bg-gray-700 border-gray-600" 
                                                                    : enroll.payment_info.status === 'Partial'
                                                                        ? "bg-yellow-100 text-yellow-800 border-yellow-200"
                                                                    : enroll.payment_info.due_amount > 0 
                                                                        ? "bg-red-100 text-red-800 border-red-200" 
                                                                    : "bg-gray-100 text-gray-800"
                                                                }
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

                        {/* Section 2: Active Transaction History */}
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <CardTitle className="flex items-center gap-2">
                                    <History className="w-5 h-5"/> Transaction History
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {activeTransactions.length > 0 ? (
                                    <div className="overflow-hidden rounded-lg border">
                                        <table className="w-full text-sm text-left">
                                            <thead className="text-gray-500 bg-gray-50 border-b">
                                                <tr>
                                                    <th className="px-4 py-3 font-medium">Date</th>
                                                    <th className="px-4 py-3 font-medium">Course</th>
                                                    <th className="px-4 py-3 font-medium text-center">Batch</th>
                                                    <th className="px-4 py-3 font-medium">Method</th>
                                                    <th className="px-4 py-3 font-medium text-right">Amount</th>
                                                    <th className="px-4 py-3 font-medium text-right">Action</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y">
                                                {activeTransactions.map((history: any) => (
                                                    <tr key={history.id} className="hover:bg-gray-50">
                                                        <td className="px-4 py-3 text-gray-600">
                                                            {new Date(history.created_at).toLocaleDateString()}
                                                        </td>
                                                        <td className="px-4 py-3 font-medium text-gray-900">
                                                            {history.course?.title || 'Unknown'}
                                                        </td>
                                                        <td className="px-4 py-3 text-center">
                                                            <Badge variant="outline" className="font-mono text-xs">
                                                                {history.course?.batch_no || 'Main'}
                                                            </Badge>
                                                        </td>
                                                        <td className="px-4 py-3 capitalize text-gray-600">
                                                            <Badge variant="outline" className="text-gray-600 border-gray-300">
                                                                {history.payment_type || 'Manual'}
                                                            </Badge>
                                                        </td>
                                                        <td className="px-4 py-3 text-right font-bold text-green-600">
                                                            {history.amount} TK
                                                        </td>
                                                        <td className="px-4 py-3 text-right">
                                                            <DeleteModal
                                                                url={`/dashboard/payment-histories`} 
                                                                id={history.id}
                                                                title="Delete Transaction"
                                                                description={`Delete payment of ${history.amount} TK?`}
                                                                actionComponent={
                                                                    <Button size="sm" variant="outline" className="h-8 px-3 text-red-500 hover:text-red-600 border-red-200">
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
                                        <p className="text-gray-500">No active payment records found.</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Section 3: Refunded History (Only Shows if Exists) */}
                        {refundedTransactions.length > 0 && (
                            <Card className="border-red-100 bg-red-50/30">
                                <CardHeader className="flex flex-row items-center justify-between">
                                    <CardTitle className="flex items-center gap-2 text-red-700">
                                        <AlertCircle className="w-5 h-5"/> Refunded & Cancelled Transactions
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="overflow-hidden rounded-lg border border-red-200 bg-white">
                                        <table className="w-full text-sm text-left">
                                            <thead className="text-red-700 bg-red-50 border-b border-red-100">
                                                <tr>
                                                    <th className="px-4 py-3 font-medium">Refund Date</th>
                                                    <th className="px-4 py-3 font-medium">Course</th>
                                                    <th className="px-4 py-3 font-medium text-center">Batch</th>
                                                    <th className="px-4 py-3 font-medium">Status</th>
                                                    <th className="px-4 py-3 font-medium text-right">Amount Refunded</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-red-100">
                                                {refundedTransactions.map((history: any) => (
                                                    <tr key={history.id} className="hover:bg-red-50/50">
                                                        <td className="px-4 py-3 text-gray-600">
                                                            {new Date(history.updated_at).toLocaleDateString()}
                                                        </td>
                                                        <td className="px-4 py-3 font-medium text-gray-900">
                                                            {history.course?.title || 'Unknown'}
                                                        </td>
                                                        <td className="px-4 py-3 text-center">
                                                            <Badge variant="outline" className="font-mono text-xs border-red-200 text-red-600">
                                                                {history.course?.batch_no || 'Main'}
                                                            </Badge>
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <Badge variant="destructive" className="bg-red-600 hover:bg-red-700">
                                                                Refunded
                                                            </Badge>
                                                        </td>
                                                        <td className="px-4 py-3 text-right font-bold text-red-600">
                                                            -{history.amount} TK
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                    </TabsContent>
                </Tabs>
            </div>
        </Layout>
    );
}