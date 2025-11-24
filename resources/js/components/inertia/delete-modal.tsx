import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { SharedData } from '@/types/global';
import { router, usePage } from '@inertiajs/react';
import { useState } from 'react';

interface Props {
    // ব্যবহার বা Usage অনুযায়ী প্রপস আপডেট করা হলো
    id?: string | number;
    url?: string;           // admin-table-columns থেকে 'url' আসছে
    title?: string;         // admin-table-columns থেকে 'title' আসছে
    description?: string;   // admin-table-columns থেকে 'description' আসছে
    
    // ব্যাকওয়ার্ড কম্প্যাটিবিলিটির জন্য আগের প্রপসগুলোও রাখা হলো
    message?: string;
    routePath?: string;
    actionComponent: React.ReactNode;
}

const DeleteModal = (props: Props) => {
    const page = usePage<SharedData>();
    const { button, frontend } = page.props.translate;

    // প্রপস রিসিভ করা হচ্ছে (নতুন এবং পুরাতন নামগুলো হ্যান্ডেল করা হলো)
    const { 
        id, 
        url, 
        routePath, 
        title, 
        message, 
        description, 
        actionComponent 
    } = props;

    const [modal, setModal] = useState<boolean>(false);

    // URL কনস্ট্রাকশন লজিক
    // যদি url পাস করা হয় এবং id থাকে, তাহলে url/id তৈরি হবে
    // অন্যথায় সরাসরি routePath ব্যবহার করবে
    const targetPath = url ? (id ? `${url}/${id}` : url) : routePath;

    const handleOpen = () => {
        setModal((prev) => !prev);
    };

    const deleteHandler = () => {
        if (!targetPath) {
            console.error("Delete URL is missing!");
            return;
        }

        router.delete(targetPath, {
            preserveScroll: true,
            onSuccess: () => {
                setModal(false);
            },
        });
    };

    return (
        <Dialog open={modal} onOpenChange={setModal}>
            <DialogTrigger asChild>{actionComponent}</DialogTrigger>

            <DialogContent className={cn('px-6 py-8 sm:max-w-[425px]')}>
                {/* Accessibility Warning ফিক্স: DialogHeader, Title এবং Description যোগ করা হলো */}
                <DialogHeader className="space-y-3">
                    <DialogTitle className="text-destructive text-center text-xl font-semibold">
                        {title || frontend.delete_warning || "Are you sure?"}
                    </DialogTitle>
                    
                    <DialogDescription className="text-center text-sm text-muted-foreground">
                        {description || message || "This action cannot be undone. This will permanently delete the item."}
                    </DialogDescription>
                </DialogHeader>

                {/* অতিরিক্ত মেসেজ যদি থাকে */}
                {(message && !description) && (
                    <div className="bg-destructive/5 rounded-xl p-4 mt-2">
                        <p className="text-destructive text-center text-sm">{message}</p>
                    </div>
                )}

                <div className="mt-6 flex items-center justify-center gap-6">
                    <Button 
                        onClick={handleOpen} 
                        className="text-destructive border-destructive border bg-transparent px-5 hover:bg-destructive/10"
                    >
                        {button.cancel}
                    </Button>

                    <Button 
                        type="button" 
                        onClick={deleteHandler} 
                        className="hover:bg-primary-hover bg-primary px-5"
                    >
                        {button.delete}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default DeleteModal;