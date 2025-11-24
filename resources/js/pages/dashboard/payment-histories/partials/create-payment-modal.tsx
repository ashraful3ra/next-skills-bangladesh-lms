import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { useForm } from '@inertiajs/react';
import { Plus, Loader2, Check, ChevronsUpDown, Search } from 'lucide-react';
import { useState, useEffect } from 'react';
import InputError from '@/components/input-error';
import { cn } from '@/lib/utils';
import axios from 'axios';

export default function CreatePaymentModal({ courses }: { courses: any[] }) {
    const [open, setOpen] = useState(false);
    
    // State for Course Combobox
    const [openCourseBox, setOpenCourseBox] = useState(false);

    // State for Student Search Combobox
    const [openStudentBox, setOpenStudentBox] = useState(false);
    const [students, setStudents] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [loadingStudents, setLoadingStudents] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState<any>(null);

    const { data, setData, post, processing, errors, reset } = useForm({
        course_id: '',
        user_id: '', // Changed from user_identifier to user_id
        amount: '',
        payment_method: 'manual',
        transaction_id: '',
        coupon_code: '',
    });

    // Live Search Logic with Debounce
    useEffect(() => {
        const delayDebounceFn = setTimeout(async () => {
            if (searchQuery.length > 1) {
                setLoadingStudents(true);
                try {
                    const response = await axios.get(route('payment-histories.search-students'), {
                        params: { query: searchQuery }
                    });
                    setStudents(response.data);
                } catch (error) {
                    console.error("Error fetching students:", error);
                } finally {
                    setLoadingStudents(false);
                }
            } else {
                setStudents([]);
            }
        }, 300); // 300ms delay

        return () => clearTimeout(delayDebounceFn);
    }, [searchQuery]);

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('payment-histories.store'), {
            onSuccess: () => {
                setOpen(false);
                reset();
                setSelectedStudent(null);
                setSearchQuery("");
            },
        });
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="gap-2 shadow-sm">
                    <Plus className="h-4 w-4" /> Create Payment
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden">
                <DialogHeader className="px-6 pt-6 pb-4 bg-gray-50/50 border-b">
                    <DialogTitle className="text-xl text-primary">Add New Payment</DialogTitle>
                    <DialogDescription>
                        Search student and course to add a payment record manually.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={submit} className="space-y-5 px-6 py-6">
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        
                        {/* ✅ Live Search Student Identifier */}
                        <div className="space-y-2 flex flex-col">
                            <Label className="text-sm font-medium text-gray-700">Student (Email/Phone) <span className="text-red-500">*</span></Label>
                            
                            <Popover open={openStudentBox} onOpenChange={setOpenStudentBox}>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        role="combobox"
                                        aria-expanded={openStudentBox}
                                        className="w-full justify-between bg-white"
                                    >
                                        {selectedStudent 
                                            ? `${selectedStudent.name} (${selectedStudent.phone || selectedStudent.email})` 
                                            : "Search by email or phone..."}
                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[300px] p-0" align="start">
                                    <Command shouldFilter={false}> {/* Disable local filtering because we do server-side */}
                                        <CommandInput 
                                            placeholder="Type email or phone..." 
                                            value={searchQuery}
                                            onValueChange={setSearchQuery}
                                        />
                                        <CommandList>
                                            {loadingStudents && <div className="p-4 text-sm text-center text-muted-foreground">Searching...</div>}
                                            {!loadingStudents && students.length === 0 && searchQuery.length > 1 && (
                                                <CommandEmpty>No student found.</CommandEmpty>
                                            )}
                                            
                                            {!loadingStudents && students.map((student) => (
                                                <CommandItem
                                                    key={student.id}
                                                    value={student.id.toString()} // Value must be string
                                                    onSelect={() => {
                                                        setData('user_id', student.id);
                                                        setSelectedStudent(student);
                                                        setOpenStudentBox(false);
                                                    }}
                                                >
                                                    <Check
                                                        className={cn(
                                                            "mr-2 h-4 w-4",
                                                            data.user_id === student.id ? "opacity-100" : "opacity-0"
                                                        )}
                                                    />
                                                    <div className="flex flex-col">
                                                        <span>{student.name}</span>
                                                        <span className="text-xs text-gray-500">{student.email}</span>
                                                        {student.phone && <span className="text-xs text-gray-400">{student.phone}</span>}
                                                    </div>
                                                </CommandItem>
                                            ))}
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                            <InputError message={errors.user_id} />
                        </div>

                        {/* ✅ Searchable Course Select with Batch */}
                        <div className="space-y-2 flex flex-col">
                            <Label className="text-sm font-medium text-gray-700">Select Course <span className="text-red-500">*</span></Label>
                            
                            <Popover open={openCourseBox} onOpenChange={setOpenCourseBox}>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        role="combobox"
                                        aria-expanded={openCourseBox}
                                        className="w-full justify-between bg-white truncate"
                                    >
                                        {data.course_id
                                            ? (() => {
                                                const course = courses.find((c) => c.id.toString() === data.course_id.toString());
                                                return course ? `${course.title} ${course.batch_no ? `(Batch: ${course.batch_no})` : ''}` : "Select course..."
                                              })()
                                            : "Select course..."}
                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[300px] p-0" align="start">
                                    <Command>
                                        <CommandInput placeholder="Search course..." />
                                        <CommandList>
                                            <CommandEmpty>No course found.</CommandEmpty>
                                            <CommandGroup>
                                                {courses.map((course) => (
                                                    <CommandItem
                                                        key={course.id}
                                                        value={course.title} // Search by title
                                                        onSelect={() => {
                                                            setData('course_id', course.id.toString());
                                                            setOpenCourseBox(false);
                                                        }}
                                                    >
                                                        <Check
                                                            className={cn(
                                                                "mr-2 h-4 w-4",
                                                                data.course_id === course.id.toString() ? "opacity-100" : "opacity-0"
                                                            )}
                                                        />
                                                        <div className="flex flex-col">
                                                            <span className="line-clamp-1">{course.title}</span>
                                                            <span className="text-xs text-gray-500">
                                                                {course.batch_no ? `Batch: ${course.batch_no}` : 'No Batch'}
                                                            </span>
                                                        </div>
                                                    </CommandItem>
                                                ))}
                                            </CommandGroup>
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                            <InputError message={errors.course_id} />
                        </div>
                    </div>

                    {/* Amount & TRX ID */}
                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label htmlFor="amount" className="text-sm font-medium text-gray-700">Amount (TK) <span className="text-red-500">*</span></Label>
                            <Input
                                id="amount"
                                type="number"
                                placeholder="0.00"
                                value={data.amount}
                                onChange={(e) => setData('amount', e.target.value)}
                                className="bg-white"
                            />
                            <InputError message={errors.amount} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="trx" className="text-sm font-medium text-gray-700">Transaction ID</Label>
                            <Input
                                id="trx"
                                placeholder="e.g. TRX123456"
                                value={data.transaction_id}
                                onChange={(e) => setData('transaction_id', e.target.value)}
                                className="bg-white"
                            />
                        </div>
                    </div>

                    {/* Method & Coupon */}
                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label className="text-sm font-medium text-gray-700">Payment Method <span className="text-red-500">*</span></Label>
                            <Select 
                                value={data.payment_method}
                                onValueChange={(val) => setData('payment_method', val)}
                            >
                                <SelectTrigger className="bg-white">
                                    <SelectValue placeholder="Method" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="manual">Manual / Cash</SelectItem>
                                    <SelectItem value="bkash">Bkash</SelectItem>
                                    <SelectItem value="nagad">Nagad</SelectItem>
                                    <SelectItem value="rocket">Rocket</SelectItem>
                                    <SelectItem value="bank">Bank Transfer</SelectItem>
                                </SelectContent>
                            </Select>
                            <InputError message={errors.payment_method} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="coupon" className="text-sm font-medium text-gray-700">Coupon (Optional)</Label>
                            <Input
                                id="coupon"
                                placeholder="CODE2025"
                                value={data.coupon_code}
                                onChange={(e) => setData('coupon_code', e.target.value)}
                                className="bg-white"
                            />
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t mt-4">
                        <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                        <Button type="submit" disabled={processing} className="min-w-[120px]">
                            {processing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                            Save Payment
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}