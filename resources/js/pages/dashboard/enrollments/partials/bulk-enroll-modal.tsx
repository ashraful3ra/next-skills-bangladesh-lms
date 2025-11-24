import { useState } from "react";
import { useForm } from "@inertiajs/react";
import axios from "axios";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, Upload, FileSpreadsheet, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface Course {
    id: number;
    title: string;
    batch_no?: string | null;
}

interface Props {
    courses: Course[];
}

export default function BulkEnrollModal({ courses }: Props) {
    const [isOpen, setIsOpen] = useState(false);
    
    const { data, setData, processing, errors, reset } = useForm({
        course_id: "",
        file: null as File | null,
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        
        const formData = new FormData();
        formData.append('course_id', data.course_id);
        if(data.file) formData.append('file', data.file);

        axios.post(route('enrollments.bulk'), formData, {
            responseType: 'blob',
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        }).then((response) => {
            const contentType = response.data.type;
            
            // যদি রেসপন্স ফাইল হয় (JSON বা HTML না হয়)
            const isFile = response.data instanceof Blob && 
                           contentType !== 'application/json' && 
                           contentType !== 'text/html';
            
            if (isFile) {
                const url = window.URL.createObjectURL(response.data);
                const link = document.createElement('a');
                link.href = url;
                link.setAttribute('download', 'enrollment_errors.xlsx');
                document.body.appendChild(link);
                link.click();
                
                const message = response.headers['x-message'];
                toast.success(message || "Enrollment completed. Check the error file.");
                
                setIsOpen(false);
                setTimeout(() => window.location.reload(), 1500);
            } else {
                // ফাইল না হলে টেক্সট রিড করা
                const reader = new FileReader();
                reader.onload = () => {
                    const text = reader.result as string;
                    
                    // [FIX] চেক করা রেসপন্সটি HTML কি না
                    if (text.trim().startsWith("<")) {
                        console.error("Server returned HTML Error:", text);
                        toast.error("Server Error occurred. Check logs.");
                        return;
                    }

                    try {
                        const jsonData = JSON.parse(text);
                        toast.success(jsonData.message || "All students enrolled successfully!");
                        setIsOpen(false);
                        reset();
                        setTimeout(() => window.location.reload(), 1000);
                    } catch (e) {
                        console.error("JSON Parse Error:", e);
                        toast.error("Failed to process server response.");
                    }
                };
                reader.readAsText(response.data);
            }
        }).catch((error) => {
            console.error(error);
            // যদি Blob এরর রেসপন্স আসে, সেটা রিড করার চেষ্টা করা
            if (error.response && error.response.data instanceof Blob) {
                const reader = new FileReader();
                reader.onload = () => {
                    try {
                        const text = reader.result as string;
                        // HTML এরর চেক
                        if(text.startsWith("<")) {
                             toast.error("Server Internal Error (500).");
                        } else {
                            const json = JSON.parse(text);
                            toast.error(json.message || "Something went wrong.");
                        }
                    } catch {
                        toast.error("An error occurred during upload.");
                    }
                };
                reader.readAsText(error.response.data);
            } else {
                toast.error("Something went wrong. Please check your connection.");
            }
        });
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="gap-2 border-primary text-primary hover:text-primary hover:bg-primary/10">
                    <FileSpreadsheet className="w-4 h-4" />
                    Bulk Enroll
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[550px]">
                <DialogHeader>
                    <DialogTitle className="text-xl font-semibold">Bulk Enroll Students</DialogTitle>
                    <p className="text-sm text-muted-foreground">Upload an Excel file to enroll students in bulk.</p>
                </DialogHeader>
                
                <form onSubmit={submit} className="space-y-6 mt-2">
                    
                    <div className="space-y-2">
                        <Label htmlFor="course" className="text-sm font-medium">Select Course</Label>
                        <Select onValueChange={(val) => setData('course_id', val)}>
                            <SelectTrigger className="w-full focus:ring-offset-0 focus:ring-1">
                                <SelectValue placeholder="Choose a course from the list" />
                            </SelectTrigger>
                            <SelectContent className="max-h-[200px]">
                                {courses && courses.map((course) => (
                                    <SelectItem key={course.id} value={course.id.toString()}>
                                        {course.title} {course.batch_no ? `(Batch: ${course.batch_no})` : ''}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {errors.course_id && <span className="text-red-500 text-xs">{errors.course_id}</span>}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="file" className="text-sm font-medium">Upload Excel File (.xlsx)</Label>
                        <div className="relative">
                            <Input 
                                id="file" 
                                type="file" 
                                accept=".xlsx,.xls,.csv"
                                className="h-auto py-2 px-3 file:mr-4 file:py-1 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer"
                                onChange={(e) => setData('file', e.target.files ? e.target.files[0] : null)}
                            />
                        </div>
                        {errors.file && <span className="text-red-500 text-xs">{errors.file}</span>}
                    </div>

                    <div className="bg-muted/50 p-4 rounded-lg border border-border flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-muted-foreground mt-0.5 shrink-0" />
                        <div className="space-y-1 flex-1">
                            <p className="text-sm font-medium">Need the format?</p>
                            <p className="text-xs text-muted-foreground break-words leading-relaxed">
                                Please download the sample template to avoid errors.
                                <br />
                                <span className="opacity-70 block mt-1">
                                    Required Columns: Name, Phone, Email, Paid Amount, Payment Method, TrxID
                                </span>
                            </p>
                            <a 
                                href={route('enrollments.template')} 
                                className="inline-flex items-center gap-1 text-sm font-semibold text-blue-600 hover:text-blue-800 hover:underline mt-2"
                            >
                                <Download className="w-3 h-3" />
                                Download Sample Template
                            </a>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-2">
                        <Button type="button" variant="secondary" onClick={() => setIsOpen(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={processing} className="gap-2">
                            {processing ? (<>Processing...</>) : (<><Upload className="w-4 h-4" /> Start Enrollment</>)}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}