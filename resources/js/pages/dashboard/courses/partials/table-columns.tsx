import DeleteModal from '@/components/inertia/delete-modal';
import { Button } from '@/components/ui/button';
import { Link, router } from '@inertiajs/react';
import { ColumnDef } from '@tanstack/react-table';
import { ArrowUpDown, Pencil, Trash2 } from 'lucide-react';
import CourseStatusFilter from './course-status-filter';
import { Badge } from '@/components/ui/badge'; // ✅ Badge কম্পোনেন্ট ইম্পোর্ট করা হয়েছে
import { cn } from '@/lib/utils'; // ✅ cn ইউটিলিটি ইম্পোর্ট করা হয়েছে

// ✅ টাইপ ইন্টারফেস আপডেট করা হয়েছে
interface CourseCategory {
    title: string;
}

interface CourseCategoryChild {
    title: string;
}

interface CourseUser {
    name: string;
    email: string;
}

interface CourseInstructor {
    user: CourseUser;
}

interface Course {
    id: string | number;
    title: string;
    instructor: CourseInstructor;
    status: string;
    course_category: CourseCategory;
    course_category_child?: CourseCategoryChild;
    lessons_count?: number;
    enrollments_count?: number; // ✅ enrollments_count যোগ করা হয়েছে
    price: number | null;
    course_mode: string;
    batch_no?: string;
    visibility?: string;
}

// ✅ LanguageTranslations টাইপটি সংজ্ঞায়িত করা হয়েছে
interface LanguageTranslations {
    table: {
        [key: string]: string;
    };
}

const TableColumn = (isAdmin: boolean, translate: LanguageTranslations): ColumnDef<Course>[] => {
    const { table } = translate;
   
    return [
        {
            accessorKey: 'name',
            header: ({ column }) => {
                return (
                    <div className="flex items-center pl-4">
                        <Button
                            variant="ghost"
                            className="p-0 hover:bg-transparent"
                            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
                        >
                            {table.instructor}
                            <ArrowUpDown />
                        </Button>
                    </div>
                );
            },
            cell: ({ row }) => (
                <div className="pl-4">
                    <p className="mb-0.5 text-base font-medium">{row.original.instructor.user.name}</p>
                    <p className="text-muted-foreground text-xs">{row.original.instructor.user.email}</p>
                </div>
            ),
        },
        {
            accessorKey: 'title',
            header: table.course_title,
            cell: ({ row }) => (
                <div className="py-1 capitalize">
                    <Link
                        href={route('courses.edit', {
                            id: row.original.id, 
                        })}
                    >
                        {row.getValue('title')}
                    </Link>
                </div>
            ),
        },

        // ✅ ===== নতুন কলাম: Batch No / Mode =====
        {
            accessorKey: 'batch_no',
            header: () => (
                <div className="flex justify-center font-semibold">
                    {table.batch_no ?? 'Batch'}
                </div>
            ),
            cell: ({ row }) => (
                <div className="py-1 text-center font-medium capitalize">
                    {row.original.batch_no || row.original.course_mode}
                </div>
            ),
        },

        // ✅ ===== আপডেট করা কলাম: Visibility (ব্যাজ সহ) =====
        {
            accessorKey: 'visibility',
            header: () => (
                <div className="flex justify-center font-semibold">
                    {table.visibility ?? 'Visibility'}
                </div>
            ),
            cell: ({ row }) => {
                const isPrivate = row.original.visibility === 'private';
                return (
                    <div className="flex justify-center py-1 capitalize">
                        <Badge
                            variant="outline"
                            className={cn(
                                isPrivate
                                    ? 'border-destructive/60 bg-destructive/5 text-destructive dark:border-destructive/80'
                                    : 'border-green-500/60 bg-green-500/5 text-green-700 dark:border-green-500/80 dark:text-green-400'
                            )}
                        >
                            {isPrivate ? 'Private' : 'Public'}
                        </Badge>
                    </div>
                );
            },
        },

        {
            accessorKey: 'status',
            header: ({ column }) => (
                <div className="flex justify-center">
                    <CourseStatusFilter />
                </div>
            ),
            cell: ({ row }) => <div className="py-1 text-center capitalize">{row.getValue('status')}</div>,
        },
        {
            accessorKey: 'category',
            header: ({ column }) => {
                return (
                    <div className="flex items-center justify-center">
                        <p>{table.category}</p>
                    </div>
                );
            },
            cell: ({ row }) => (
                <div className="py-1 text-center capitalize">
                    <p>{row.original.course_category.title}</p>
                </div>
            ),
        },
        {
            accessorKey: 'category_child',
            header: ({ column }) => {
                return (
                    <div className="flex items-center justify-center">
                        <p>{table.category_child}</p>
                    </div>
                );
            },
            cell: ({ row }) => (
                <div className="py-1 text-center capitalize">
                    <p>{row.original.course_category_child?.title || '--'}</p>
                </div>
            ),
        },

       {
            accessorKey: 'lessons_count',
            header: ({ column }) => (
                <div className="flex items-center justify-center">
                    <Button
                        variant="ghost"
                        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
                    >
                        {table.lessons ?? 'Lessons'}
                        <ArrowUpDown />
                    </Button>
                </div>
            ),
            cell: ({ row }) => (
                <div className="py-1 text-center">
                    <p>{row.original.lessons_count ?? 0}</p>
                </div>
            ),
        },

        {
            accessorKey: 'enrollments_count',
            header: ({ column }) => (
                <div className="flex items-center justify-center">
                    <Button
                        variant="ghost"
                        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
                    >
                        {table.enrollments ?? 'Enrollments'}
                        <ArrowUpDown />
                    </Button>
                </div>
            ),
            cell: ({ row }) => (
                <div className="py-1 text-center">
                    <p>{row.original.enrollments_count ?? 0}</p>
                </div>
            ),
        },

        {
            accessorKey: 'price',
            header: ({ column }) => (
                <div className="flex items-center justify-center">
                    <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
                        {table.price}
                        <ArrowUpDown />
                    </Button>
                </div>
            ),
            cell: ({ row }) => (
                <div className="py-1 text-center capitalize">
                    <p>{row.original.price ?? table.free}</p>
                </div>
            ),
        },
        {
            id: 'actions',
            header: () => <div className="pr-4 text-end">{table.action}</div>,
            cell: ({ row }) => {
                const course = row.original;

                return (
                    <div className="flex justify-end gap-2 py-1 pr-4">
                        <Button
                            size="icon"
                            variant="secondary"
                            className="h-8 w-8"
                            onClick={() =>
                                router.get(
                                    route('courses.edit', {
                                        id: course.id, // ✅ Fix: 'course' এর বদলে 'id'
                                    }),
                                )
                            }
                        >
                            <Pencil />
                        </Button>

                        {isAdmin && (
                            <DeleteModal
                                routePath={route('courses.destroy', course.id)}
                                message={table.delete_course_warning}
                                actionComponent={
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        className="bg-destructive/8 hover:bg-destructive/6 h-8 w-8 p-0"
                                    >
                                        <Trash2 className="text-destructive text-sm" />
                                    </Button>
                                }
                            />
                        )}
                    </div>
                );
            },
        },
    ];
};

export default TableColumn;