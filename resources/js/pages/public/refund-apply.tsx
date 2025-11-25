import React from 'react';
import { Head, useForm } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

export default function RefundApply({ refund }) {
    const { data, setData, post, processing, errors } = useForm({
        refund_method: '',
        account_number: '',
        reason: ''
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('refunds.public-submit', refund.uuid));
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
            <Head title="Apply for Refund" />
            <Card className="w-full max-w-lg shadow-lg">
                <CardHeader className="bg-primary text-primary-foreground rounded-t-lg">
                    <CardTitle>Refund Application</CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                    
                    {/* Read-only Info */}
                    <div className="bg-gray-50 p-4 rounded border space-y-2">
                        <p><strong>Name:</strong> {refund.user.name}</p>
                        <p><strong>Course:</strong> {refund.course.title}</p>
                        <p><strong>Batch:</strong> {refund.batch_no || 'N/A'}</p>
                        <p className="text-xl font-bold text-primary mt-2">Refund Amount: {refund.refund_amount} TK</p>
                    </div>

                    <form onSubmit={submit} className="space-y-4">
                        <div>
                            <Label>Select Refund Method</Label>
                            <Select onValueChange={(v) => setData('refund_method', v)}>
                                <SelectTrigger><SelectValue placeholder="Select method" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="bkash">bKash</SelectItem>
                                    <SelectItem value="rocket">Rocket</SelectItem>
                                    <SelectItem value="nagad">Nagad</SelectItem>
                                </SelectContent>
                            </Select>
                            {errors.refund_method && <span className="text-red-500 text-sm">{errors.refund_method}</span>}
                        </div>

                        <div>
                            <Label>Account Number</Label>
                            <Input 
                                value={data.account_number} 
                                onChange={e => setData('account_number', e.target.value)} 
                                placeholder="017xxxxxxxx" 
                            />
                            {errors.account_number && <span className="text-red-500 text-sm">{errors.account_number}</span>}
                        </div>

                        <div>
                            <Label>Refund Reason</Label>
                            <Textarea 
                                value={data.reason} 
                                onChange={e => setData('reason', e.target.value)} 
                                placeholder="Why are you requesting a refund?" 
                            />
                            {errors.reason && <span className="text-red-500 text-sm">{errors.reason}</span>}
                        </div>

                        <Button type="submit" className="w-full" disabled={processing}>Submit Application</Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}