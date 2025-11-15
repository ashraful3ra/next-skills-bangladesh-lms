import { Button } from '@/components/ui/button';
import DashboardLayout from '@/layouts/dashboard/layout';
import { Head, Link } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import MarksheetBuilderForm from './partials/marksheet-builder-form';

interface MarksheetTemplate extends TableCommon {
   name: string;
   logo_path: string | null;
   template_data: {
      primaryColor: string;
      secondaryColor: string;
      backgroundColor: string;
      borderColor: string;
      headerText: string;
      institutionName: string;
      footerText: string;
      fontFamily: string;
   };
   is_active: boolean;
}

interface MarksheetBuilderPageProps {
   template?: MarksheetTemplate;
}

const MarksheetBuilder = ({ template }: MarksheetBuilderPageProps) => {
   return (
      <>
         <Head title={`${template ? 'Edit' : 'Create'} Marksheet Template`} />

         <div className="space-y-6">
            <div className="flex items-center justify-between">
               <div>
                  <h2 className="text-2xl font-bold">{template ? 'Edit' : 'Create'} Marksheet Template</h2>
                  <p className="text-muted-foreground">Customize your marksheet design and content</p>
               </div>

               <Link href={route('marksheet.templates.index')}>
                  <Button variant="outline">
                     <ArrowLeft className="mr-2 h-4 w-4" />
                     Back to Templates
                  </Button>
               </Link>
            </div>

            <MarksheetBuilderForm template={template} />
         </div>
      </>
   );
};

MarksheetBuilder.layout = (page: React.ReactNode) => <DashboardLayout children={page} />;

export default MarksheetBuilder;
