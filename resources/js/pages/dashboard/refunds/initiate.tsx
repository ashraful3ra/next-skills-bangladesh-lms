import React, { useState } from 'react';
import Layout from '@/layouts/dashboard/layout';
import { Head, useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import axios from 'axios';
import { Copy, Search, Loader2 } from 'lucide-react';

export default function InitiateRefund({ refunds }: { refunds: any[] }) {
    const [searchQuery, setSearchQuery] = useState('');
    const [students, setStudents] = useState<any[]>([]);
    const [selectedStudent, setSelectedStudent] = useState<any>(null);
    const [courses, setCourses] = useState<any[]>([]);
    const [selectedCourse, setSelectedCourse] = useState<any>(null);
    const [isOpen, setIsOpen] = useState(false);
    const [isSearching, setIsSearching] = useState(false);

    // Form State
    const { data, setData, post, processing, reset } = useForm({
        user_id: '',
        course_id: '',
        batch_no: '',
        total_paid: 0,
        refund_amount: 0,
        service_charge_percentage: 10,
        service_charge_amount: 0,
    });

    // Search Student
    const handleSearch = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const query = e.target.value;
        setSearchQuery(query);
        
        if (query.length > 2) {
            setIsSearching(true);
            try {
                const res = await axios.get(route('api.search-students', { query }));
                setStudents(res.data);
            } catch (error) {
                console.error(error);
            } finally {
                setIsSearching(false);
            }
        } else {
            setStudents([]);
        }
    };

    // Select Student
    const selectStudent = async (student: any) => {
        setSelectedStudent(student);
        setSearchQuery(student.name);
        setData('user_id', student.id);
        setStudents([]);

        // Fetch courses
        try {
            const res = await axios.get(route('api.student-courses', student.id));
            setCourses(res.data);
        } catch (error) {
            console.error(error);
        }
    };

    // Select Course & Auto-calculate
    const selectCourse = (courseId: string) => {
        const course = courses.find(c => c.course_id.toString() === courseId);
        
        if (course) {
            setSelectedCourse(course);
            
            const total = parseFloat(course.paid_amount);
            const charge = (total * data.service_charge_percentage) / 100;
            
            setData(prev => ({
                ...prev,
                course_id: course.course_id,
                batch_no: course.batch_no,
                total_paid: total,
                service_charge_amount: charge,
                refund_amount: total - charge
            }));
        }
    };

    // Update Charge
    const handleChargeChange = (val: string) => {
        const percent = parseInt(val);
        const total = data.total_paid;
        const charge = (total * percent) / 100;
        
        setData(prev => ({
            ...prev,
            service_charge_percentage: percent,
            service_charge_amount: charge,
            refund_amount: total - charge
        }));
    };

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('refunds.store-initiate'), {
            onSuccess: () => {
                setIsOpen(false);
                reset();
                setSearchQuery('');
                setSelectedStudent(null);
                setSelectedCourse(null);
            }
        });
    };

    const copyLink = (uuid: string) => {
        const url = route('refunds.public-form', uuid);
        navigator.clipboard.writeText(url);
        alert('Link Copied to Clipboard!');
    };

    return (
        <Layout>
            <Head title="Initiate Refund" />
            <div className="p-6 space-y-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold">Initiated Refunds</h1>
                    
                    <Dialog open={isOpen} onOpenChange={setIsOpen}>
                        <DialogTrigger asChild>
                            <Button>Create New Refund</Button>
                        </DialogTrigger>
                        
                        {/* 👇 CHANGED: max-w-lg -> sm:max-w-2xl (Makes it wider/medium size) */}
                        <DialogContent 
                            className="sm:max-w-2xl"
                            onPointerDownOutside={(e) => e.preventDefault()} 
                        >
                            <DialogHeader>
                                <DialogTitle>Initiate Refund Process</DialogTitle>
                            </DialogHeader>
                            
                            <form onSubmit={submit} className="space-y-5 mt-4">
                                
                                {/* 1. Student Search with Dropdown */}
                                <div className="space-y-2 relative z-50">
                                    <Label>Search Student</Label>
                                    <div className="relative">
                                        <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                        <Input 
                                            placeholder="Search by name, email or phone..." 
                                            className="pl-9"
                                            value={searchQuery}
                                            onChange={handleSearch}
                                        />
                                        {isSearching && <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin text-gray-400" />}
                                    </div>

                                    {/* Custom Dropdown Result */}
                                    {students.length > 0 && (
                                        <div className="absolute top-full left-0 right-0 bg-white border rounded-md shadow-lg mt-1 max-h-60 overflow-y-auto z-[100]">
                                            {students.map(s => (
                                                <div 
                                                    key={s.id} 
                                                    className="p-3 hover:bg-gray-50 cursor-pointer border-b last:border-0"
                                                    onClick={() => selectStudent(s)}
                                                >
                                                    <p className="font-medium text-sm">{s.name}</p>
                                                    <p className="text-xs text-gray-500">{s.email} • {s.phone}</p>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    {selectedStudent && (
                                        <div className="text-xs text-green-600 font-medium px-1">
                                            Selected: {selectedStudent.name} ({selectedStudent.phone})
                                        </div>
                                    )}
                                </div>

                                {/* 2. Course Selection */}
                                {courses.length > 0 && (
                                    <div className="space-y-2 relative z-40">
                                        <Label>Select Course to Refund</Label>
                                        <Select onValueChange={selectCourse}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select a course" />
                                            </SelectTrigger>
                                            <SelectContent className="z-[200] max-h-[300px]">
                                                {courses.map(c => (
                                                    <SelectItem key={c.course_id} value={c.course_id.toString()}>
                                                        {c.course_title} <span className="text-xs text-gray-400">({c.paid_amount} TK)</span>
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )}

                                {/* 3. Calculation Display */}
                                {selectedCourse && (
                                    <div className="bg-gray-50 p-4 rounded-lg border space-y-3">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-500">Paid Amount:</span>
                                            <span className="font-bold">{data.total_paid} TK</span>
                                        </div>
                                        
                                        <div className="flex items-center justify-between gap-4">
                                            <Label className="text-xs text-gray-500 whitespace-nowrap">Service Charge (%):</Label>
                                            <Select defaultValue="10" onValueChange={handleChargeChange}>
                                                <SelectTrigger className="h-8 w-24 text-xs">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent className="z-[200]">
                                                    {[0, 5, 10, 15, 20, 25, 30, 50, 100].map(p => (
                                                        <SelectItem key={p} value={p.toString()}>{p}%</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="flex justify-between text-sm text-red-500">
                                            <span>Deduction:</span>
                                            <span>- {data.service_charge_amount} TK</span>
                                        </div>
                                        
                                        <div className="border-t pt-2 flex justify-between font-bold text-green-600 text-lg">
                                            <span>Refund Amount:</span>
                                            <span>{data.refund_amount} TK</span>
                                        </div>
                                    </div>
                                )}

                                <Button type="submit" className="w-full" disabled={processing}>
                                    {processing ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : null}
                                    Generate Refund Link
                                </Button>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>

                {/* Data Table */}
                <div className="bg-white rounded-md border shadow-sm overflow-hidden">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 border-b text-gray-500 font-medium">
                            <tr>
                                <th className="p-4">Student Name</th>
                                <th className="p-4">Course Info</th>
                                <th className="p-4 text-right">Refund Amount</th>
                                <th className="p-4 text-center">Link</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {refunds.map((refund) => (
                                <tr key={refund.id} className="hover:bg-gray-50 transition">
                                    <td className="p-4">
                                        <p className="font-semibold text-gray-900">{refund.user.name}</p>
                                        <p className="text-xs text-gray-500">{refund.user.phone || refund.user.email}</p>
                                    </td>
                                    <td className="p-4">
                                        <p className="text-gray-800">{refund.course.title}</p>
                                        {refund.batch_no && <span className="text-xs bg-gray-100 px-2 py-0.5 rounded">Batch: {refund.batch_no}</span>}
                                    </td>
                                    <td className="p-4 text-right font-bold text-green-600">
                                        {refund.refund_amount} TK
                                    </td>
                                    <td className="p-4 text-center">
                                        <Button size="sm" variant="outline" onClick={() => copyLink(refund.uuid)}>
                                            <Copy className="w-3 h-3 mr-1" /> Copy Link
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                            {refunds.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="p-8 text-center text-gray-400">No initiated refunds found.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </Layout>
    );
}