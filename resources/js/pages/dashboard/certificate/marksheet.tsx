import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import DashboardLayout from '@/layouts/dashboard/layout';
import { SharedData } from '@/types/global';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { Check, ClipboardList, Edit, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import MarksheetPreview from './partials/marksheet-preview';

interface CertificatePageProps extends SharedData {
   marksheetTemplates: MarksheetTemplate[];
}

const MarksheetIndex = () => {
   const { props } = usePage<CertificatePageProps>();
   const { marksheetTemplates } = props;
   const [previewMarksheet, setPreviewMarksheet] = useState<MarksheetTemplate | null>(null);

   const handleMarksheetActivate = (templateId: number) => {
      router.post(
         route('marksheet.templates.activate', templateId),
         {},
         {
            preserveScroll: true,
         },
      );
   };

   const handleMarksheetDelete = (templateId: number) => {
      if (confirm('Are you sure you want to delete this marksheet template?')) {
         router.delete(route('marksheet.templates.destroy', templateId), {
            preserveScroll: true,
         });
      }
   };

   const handleMarksheetPreview = (template: MarksheetTemplate) => {
      setPreviewMarksheet(template);
   };

   const handleCloseMarksheetPreview = () => {
      setPreviewMarksheet(null);
   };

   return (
      <>
         <Head title="Certificate & Marksheet Templates" />

         <div className="space-y-6">
            <div className="flex items-center justify-between">
               <div>
                  <h2 className="text-xl font-semibold">Marksheet Templates</h2>
                  <p className="text-muted-foreground text-sm">Design marksheets showing course grades</p>
               </div>
               <Link href={route('marksheet.templates.create')}>
                  <Button>
                     <Plus className="mr-2 h-4 w-4" />
                     Create Template
                  </Button>
               </Link>
            </div>

            {marksheetTemplates.length === 0 ? (
               <Card className="p-12">
                  <div className="flex flex-col items-center justify-center text-center">
                     <ClipboardList className="text-muted-foreground mb-4 h-16 w-16" />
                     <h3 className="mb-2 text-xl font-semibold">No marksheet templates yet</h3>
                     <p className="text-muted-foreground mb-4">Create your first marksheet template to get started</p>
                     <Link href={route('marksheet.templates.create')}>
                        <Button>
                           <Plus className="mr-2 h-4 w-4" />
                           Create Your First Template
                        </Button>
                     </Link>
                  </div>
               </Card>
            ) : (
               <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {marksheetTemplates.map((template) => (
                     <Card key={template.id} className={`relative ${template.is_active ? 'ring-primary ring-2' : ''}`}>
                        {template.is_active && (
                           <div className="bg-primary text-primary-foreground absolute top-4 right-4 rounded-full px-3 py-1 text-xs font-semibold">
                              <Check className="mr-1 inline h-3 w-3" />
                              Active
                           </div>
                        )}
                        <CardHeader>
                           <CardTitle className="flex items-center">
                              <ClipboardList className="mr-2 h-5 w-5" />
                              {template.name}
                           </CardTitle>
                           <CardDescription>Created: {new Date(template.created_at).toLocaleDateString()}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                           {/* Mini Preview */}
                           <div
                              className="cursor-pointer rounded-lg border-2 p-4 text-center transition-all hover:shadow-md"
                              style={{
                                 backgroundColor: template.template_data.backgroundColor,
                                 borderColor: template.template_data.borderColor,
                              }}
                              onClick={() => handleMarksheetPreview(template)}
                           >
                              <div className="mb-2 text-xs font-bold" style={{ color: template.template_data.primaryColor }}>
                                 {template.template_data.headerText}
                              </div>
                              <div className="text-[8px]" style={{ color: template.template_data.secondaryColor }}>
                                 {template.template_data.institutionName}
                              </div>
                           </div>

                           {/* Color Indicators */}
                           <div className="flex gap-2">
                              <div className="flex items-center gap-1">
                                 <div className="h-4 w-4 rounded border" style={{ backgroundColor: template.template_data.primaryColor }} />
                                 <span className="text-xs">Primary</span>
                              </div>
                              <div className="flex items-center gap-1">
                                 <div className="h-4 w-4 rounded border" style={{ backgroundColor: template.template_data.secondaryColor }} />
                                 <span className="text-xs">Secondary</span>
                              </div>
                           </div>

                           {/* Actions */}
                           <div className="flex gap-2">
                              {!template.is_active && (
                                 <Button
                                    size="sm"
                                    variant="outline"
                                    className="flex-1"
                                    onClick={() => handleMarksheetActivate(template.id as number)}
                                 >
                                    <Check className="mr-1 h-3 w-3" />
                                    Activate
                                 </Button>
                              )}
                              <Button asChild size="sm" variant="outline" className="flex-1">
                                 <Link href={route('marksheet.templates.edit', template.id)}>
                                    <Edit className="mr-1 h-3 w-3" />
                                    Edit
                                 </Link>
                              </Button>
                              <Button size="sm" variant="destructive" onClick={() => handleMarksheetDelete(template.id as number)}>
                                 <Trash2 className="h-3 w-3" />
                              </Button>
                           </div>
                        </CardContent>
                     </Card>
                  ))}
               </div>
            )}
         </div>

         {/* Marksheet Preview Dialog */}
         {previewMarksheet && (
            <Dialog open={!!previewMarksheet} onOpenChange={(open) => !open && handleCloseMarksheetPreview()}>
               <DialogContent className="w-full gap-0 overflow-y-auto p-0 sm:max-w-4xl">
                  <ScrollArea className="max-h-[90vh]">
                     <div className="p-6">
                        <DialogHeader className="mb-6">
                           <DialogTitle>Preview: {previewMarksheet?.name}</DialogTitle>
                        </DialogHeader>

                        <MarksheetPreview
                           template={previewMarksheet}
                           studentName="John Doe"
                           courseName="Sample Course Name"
                           completionDate="January 1, 2025"
                        />
                     </div>
                  </ScrollArea>
               </DialogContent>
            </Dialog>
         )}
      </>
   );
};

MarksheetIndex.layout = (page: React.ReactNode) => <DashboardLayout children={page} />;

export default MarksheetIndex;
