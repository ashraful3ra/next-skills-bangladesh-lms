import React, { useState, useRef } from 'react';
import Layout from '@/layouts/dashboard/layout';
import { Head, useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CheckCircle, Eye, Printer, Upload, AlertCircle } from 'lucide-react';
import { useReactToPrint } from 'react-to-print';

interface Refund {
    id: number;
    uuid: string;
    user: { name: string; email: string; phone?: string };
    course: { title: string; batch_no?: string };
    refund_amount: string;
    refund_method: string;
    account_number: string;
    reason: string;
    status: string;
    payment_proof?: string;
    updated_at: string;
}

export default function ApprovedRefunds({ refunds }: { refunds: Refund[] }) {
    const [selectedRefund, setSelectedRefund] = useState<Refund | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    
    // Print Ref
    const printRef = useRef<HTMLDivElement>(null);
    
    // Print Handler
    const handlePrint = useReactToPrint({
        contentRef: printRef,
        documentTitle: selectedRefund ? `Refund_Receipt_${selectedRefund.id}` : 'Receipt',
    });

    // Form Setup
    const { data, setData, post, processing, errors, reset } = useForm({
        payment_proof: null as File | null,
    });

    const openModal = (refund: Refund) => {
        setSelectedRefund(refund);
        setIsModalOpen(true);
        setPreviewUrl(refund.payment_proof ? `/storage/${refund.payment_proof}` : null);
        reset();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setData('payment_proof', file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const submitPayment = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedRefund) return;

        post(route('refunds.mark-paid', selectedRefund.id), {
            onSuccess: () => {
                setIsModalOpen(false); 
            },
            forceFormData: true,
        });
    };

    return (
        <Layout>
            <Head title="Approved Refunds" />
            <div className="p-6 space-y-6">
                <h1 className="text-2xl font-bold text-gray-800">Refund Requests (Approved & Paid)</h1>

                <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 border-b">
                            <tr>
                                <th className="p-4">Date</th>
                                <th className="p-4">Student</th>
                                <th className="p-4">Course</th>
                                <th className="p-4">Amount</th>
                                <th className="p-4">Status</th>
                                <th className="p-4 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {refunds.length > 0 ? refunds.map((refund) => (
                                <tr key={refund.id} className="hover:bg-gray-50">
                                    <td className="p-4 text-gray-600">{new Date(refund.updated_at).toLocaleDateString()}</td>
                                    <td className="p-4">
                                        <div className="font-bold text-gray-900">{refund.user.name}</div>
                                        <div className="text-xs text-gray-500">{refund.user.phone}</div>
                                    </td>
                                    <td className="p-4 text-gray-800">{refund.course.title}</td>
                                    <td className="p-4 font-bold text-green-600">{refund.refund_amount} TK</td>
                                    <td className="p-4">
                                        {refund.status === 'paid' ? (
                                            <Badge className="bg-green-100 text-green-800 border-green-200">Paid</Badge>
                                        ) : (
                                            <Badge variant="secondary" className="bg-blue-100 text-blue-800">Approved</Badge>
                                        )}
                                    </td>
                                    <td className="p-4 text-right">
                                        <Button size="sm" variant="outline" onClick={() => openModal(refund)} className="border-gray-300">
                                            <Eye className="w-4 h-4 mr-2" /> View
                                        </Button>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={6} className="p-8 text-center text-gray-500">No approved refunds found.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* MODAL */}
                <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                    <DialogContent className="sm:max-w-[90vw] w-full max-h-[95vh] overflow-y-auto p-0">
                        <DialogHeader className="px-6 py-4 border-b bg-gray-50 sticky top-0 z-10">
                            <DialogTitle className="flex items-center justify-between">
                                <span>Refund Details & Action</span>
                                <span className="text-sm font-normal text-gray-500 px-2">ID: #{selectedRefund?.id}</span>
                            </DialogTitle>
                        </DialogHeader>

                        {selectedRefund && (
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 h-full min-h-[600px]">
                                
                                {/* Left Side: Info & Form */}
                                <div className="lg:col-span-4 p-6 bg-white border-r border-gray-200 space-y-6 overflow-y-auto">
                                    
                                    {/* Status */}
                                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border">
                                        <span className="text-sm font-medium text-gray-600">Status:</span>
                                        {selectedRefund.status === 'paid' ? (
                                            <Badge className="bg-green-600 text-white px-3 py-1">PAID</Badge>
                                        ) : (
                                            <Badge variant="secondary" className="bg-blue-600 text-white px-3 py-1">APPROVED</Badge>
                                        )}
                                    </div>

                                    {/* Refund Reason */}
                                    <div className="space-y-2">
                                        <Label className="text-xs uppercase font-bold text-gray-500 flex items-center gap-2">
                                            <AlertCircle className="w-3 h-3" /> Reason for Refund
                                        </Label>
                                        <div className="p-3 bg-orange-50 border border-orange-100 rounded-md text-sm text-gray-800 italic">
                                            "{selectedRefund.reason}"
                                        </div>
                                    </div>

                                    {/* Action Form */}
                                    <div className="space-y-4 pt-4 border-t">
                                        <h3 className="font-semibold text-lg text-gray-800">Payment Action</h3>
                                        
                                        {selectedRefund.status === 'approved' ? (
                                            <form onSubmit={submitPayment} className="space-y-5">
                                                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md text-sm text-yellow-800">
                                                    <p className="mb-2">Please send <strong>{selectedRefund.refund_amount} TK</strong> to:</p>
                                                    <div className="font-mono bg-white p-2 rounded border text-center font-bold text-lg">
                                                        {selectedRefund.account_number}
                                                    </div>
                                                    <p className="text-center mt-1 uppercase text-xs font-bold text-yellow-700">({selectedRefund.refund_method})</p>
                                                </div>

                                                <div className="space-y-2">
                                                    <Label>Upload Payment Proof</Label>
                                                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:bg-gray-50 transition-colors text-center relative">
                                                        <Input type="file" accept="image/*" onChange={handleFileChange} className="absolute inset-0 opacity-0 w-full h-full cursor-pointer" />
                                                        <div className="flex flex-col items-center gap-2 pointer-events-none">
                                                            <Upload className="w-8 h-8 text-gray-400" />
                                                            <span className="text-sm text-gray-500">Click to upload</span>
                                                        </div>
                                                    </div>
                                                    {errors.payment_proof && <p className="text-red-500 text-xs mt-1">{errors.payment_proof}</p>}
                                                </div>

                                                {previewUrl && (
                                                    <div className="relative h-40 w-full border rounded-lg overflow-hidden bg-gray-100">
                                                        <img src={previewUrl} alt="Preview" className="h-full w-full object-contain" />
                                                    </div>
                                                )}

                                                <Button type="submit" disabled={processing} className="w-full bg-green-600 hover:bg-green-700 text-white py-6 text-md font-bold shadow-sm">
                                                    <CheckCircle className="w-5 h-5 mr-2" /> Confirm & Mark Paid
                                                </Button>
                                            </form>
                                        ) : (
                                            <div className="space-y-6 text-center py-8">
                                                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto text-green-600 mb-4">
                                                    <CheckCircle className="w-10 h-10" />
                                                </div>
                                                <div>
                                                    <h3 className="text-xl font-bold text-green-700">Payment Successful</h3>
                                                    <p className="text-sm text-gray-500 mt-1">Transaction recorded.</p>
                                                </div>
                                                
                                                <Button onClick={() => handlePrint()} variant="outline" className="w-full border-2 border-gray-300 py-5 font-semibold">
                                                    <Printer className="w-5 h-5 mr-2" /> Print Receipt
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Right Side: Receipt Preview (Compact A4) */}
                                <div className="lg:col-span-8 bg-gray-100 p-8 overflow-y-auto flex justify-center items-start">
                                    <div 
                                        ref={printRef} 
                                        className="bg-white text-black shadow-xl relative print:shadow-none" 
                                        style={{ 
                                            width: '210mm', 
                                            height: '297mm', // Fixed A4 Height
                                            padding: '40px', // Padding
                                            margin: '0 auto',
                                            boxSizing: 'border-box',
                                            overflow: 'hidden' // Prevent overflow to 2nd page
                                        }}
                                    >
                                        
                                        {/* Watermark */}
                                        <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none select-none overflow-hidden">
                                            <h1 className="text-[100px] font-black -rotate-45 uppercase">
                                                {selectedRefund.status === 'paid' ? 'PAID' : 'DRAFT'}
                                            </h1>
                                        </div>

                                        {/* Header - Compact */}
                                        <div className="flex justify-between items-start border-b-2 border-gray-800 pb-4 mb-6">
                                            <div>
                                                <h1 className="text-3xl font-black text-gray-900 uppercase tracking-tight">Refund Receipt</h1>
                                                <p className="text-xs text-gray-500 mt-1 font-mono">ID: #REF-{selectedRefund.id.toString().padStart(6, '0')}</p>
                                                <p className="text-xs text-gray-500 font-mono">Date: {new Date().toLocaleDateString()}</p>
                                            </div>
                                            <div className="text-right">
                                                <h2 className="text-xl font-bold text-primary">NextSkills Bangladesh</h2>
                                                <p className="text-xs text-gray-600 mt-1">refunds@nextskillsbd.com</p>
                                                <p className="text-xs text-gray-600">www.nextskillsbd.com</p>
                                            </div>
                                        </div>

                                        {/* Info Grid - Compact */}
                                        <div className="flex justify-between mb-6 text-sm">
                                            <div className="w-1/2">
                                                <h3 className="text-[10px] font-bold uppercase text-gray-400 mb-1 tracking-wider">Refund To</h3>
                                                <p className="font-bold text-base text-gray-900">{selectedRefund.user.name}</p>
                                                <p className="text-gray-600 text-xs">{selectedRefund.user.email}</p>
                                                <p className="text-gray-600 text-xs">{selectedRefund.user.phone}</p>
                                            </div>
                                            <div className="w-1/2 text-right">
                                                <h3 className="text-[10px] font-bold uppercase text-gray-400 mb-1 tracking-wider">Course Info</h3>
                                                <p className="font-bold text-base text-gray-900">{selectedRefund.course.title}</p>
                                                <p className="text-gray-600 text-xs">Batch: <span className="bg-gray-100 px-1 rounded font-mono">{selectedRefund.course.batch_no || 'N/A'}</span></p>
                                            </div>
                                        </div>

                                        {/* Table - Compact */}
                                        <table className="w-full border-collapse mb-6 text-sm">
                                            <thead>
                                                <tr className="bg-gray-50 border-y border-gray-200">
                                                    <th className="text-left p-2 font-bold text-gray-600 uppercase text-xs">Description</th>
                                                    <th className="text-right p-2 font-bold text-gray-600 uppercase text-xs">Amount</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                <tr className="border-b border-gray-100">
                                                    <td className="p-2">
                                                        <p className="font-semibold text-gray-800">Course Fee Refund</p>
                                                        <div className="text-xs text-gray-500 mt-1 flex gap-3">
                                                            <span>Method: <span className="uppercase font-bold">{selectedRefund.refund_method}</span></span>
                                                            <span>Account: {selectedRefund.account_number}</span>
                                                        </div>
                                                    </td>
                                                    <td className="p-2 text-right font-mono text-base font-bold text-gray-800">
                                                        {selectedRefund.refund_amount} TK
                                                    </td>
                                                </tr>
                                            </tbody>
                                            <tfoot>
                                                <tr>
                                                    <td className="p-2 text-right font-bold text-gray-700 border-t border-gray-800 text-sm">Total Refunded:</td>
                                                    <td className="p-2 text-right font-black text-gray-900 text-xl border-t border-gray-800">
                                                        {selectedRefund.refund_amount} TK
                                                    </td>
                                                </tr>
                                            </tfoot>
                                        </table>

                                        {/* Reason - Compact */}
                                        <div className="mb-6">
                                            <h3 className="text-[10px] font-bold uppercase text-gray-400 mb-1 tracking-wider">Reason</h3>
                                            <div className="p-2 bg-gray-50 border border-gray-100 rounded text-xs text-gray-700 italic">
                                                "{selectedRefund.reason}"
                                            </div>
                                        </div>

                                        {/* Proof Image - UPDATED HEIGHT & WIDTH */}
                                        {previewUrl ? (
                                            <div className="mt-4 border-t pt-4 page-break-inside-avoid">
                                                <h3 className="text-[10px] font-bold uppercase text-gray-400 mb-2 tracking-wider">Attached Payment Proof</h3>
                                                <div className="flex justify-center border border-gray-200 p-1 rounded bg-gray-50">
                                                    {/* Height Increased to 480px and width to full to fill space */}
                                                    <img src={previewUrl} alt="Proof" className="max-h-[480px] w-full object-contain" />
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="mt-4 h-20 border-2 border-dashed border-gray-100 rounded flex items-center justify-center text-gray-300 text-xs">
                                                No Proof Image Attached
                                            </div>
                                        )}

                                        {/* Footer */}
                                        <div className="absolute bottom-8 left-10 right-10 pt-4 border-t border-gray-200 text-center">
                                            <p className="text-[9px] text-gray-400 mt-4">This is a computer-generated receipt. Generated on {new Date().toLocaleString()}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </DialogContent>
                </Dialog>
            </div>
        </Layout>
    );
}