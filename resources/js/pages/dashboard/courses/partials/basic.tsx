import Combobox from '@/components/combobox';
import InputError from '@/components/input-error';
import LoadingButton from '@/components/loading-button';
import TiptapEditor from '@/components/text-editor/tiptap-editor';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import courseLanguages from '@/data/course-languages';
import DashboardLayout from '@/layouts/dashboard/layout';
import { onHandleChange } from '@/lib/inertia';
import { useForm, usePage } from '@inertiajs/react';
import { ReactNode, useEffect, useMemo, useState } from 'react';
import { CourseUpdateProps } from '../update';

const Basic = () => {
   const { props } = usePage<CourseUpdateProps>();
   const { auth, system, tab, labels, categories, course, instructors, translate } = props;
   const { input, button, common } = translate;

   const { data, setData, post, errors, processing } = useForm({
      tab: tab,
      title: course.title,
      short_description: course.short_description,
      description: course.description,
      status: course.status,

      course_mode: (course.course_mode as string) || 'main',
      main_course_id: course.main_course_id ?? null,
      batch_no: course.batch_no ?? '',          // 👈 NEW

      visibility: (course.visibility as string) || 'public',
      is_completed: Boolean(course.is_completed),

      level: course.level,
      language: course.language,
      instructor_id: course.instructor_id,
      drip_content: Boolean(course.drip_content),
      course_category_id: course.course_category_id,
      course_category_child_id: course.course_category_child_id,
   });

   // NEW: main course list for batch selection
   const [mainCourses, setMainCourses] = useState<{ label: string; value: string }[]>([]);

   // Handle form submission
   const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();

      post(route('courses.update', { id: course.id }));
   };

   const transformedCategories = useMemo(() => {
      return categories.flatMap((category) => {
         const categoryItem = {
            id: category.id,
            label: category.title,
            value: category.title,
            child_id: '',
         };

         const childrenItems =
            category.category_children?.map((child) => ({
               id: child.id,
               label: `${category.title} > ${child.title}`,
               value: `${category.title} > ${child.title}`,
               child_id: child.id,
            })) || [];

         return [categoryItem, ...childrenItems];
      });
   }, [categories]);

   const transformedInstructors = instructors?.map((instructor) => ({
      label: instructor.user.name,
      value: instructor.id as string,
   }));

   let selectedCategory: any;
   categories.map((category) => {
      if (course.course_category_child_id) {
         category.category_children?.map((child) => {
            if (child.id === data.course_category_child_id) {
               selectedCategory = child;
               return;
            }
         });
      } else {
         if (category.id === data.course_category_id) {
            selectedCategory = category;
            return;
         }
      }
   });

   // NEW: load main courses only when needed (batch mode)
   useEffect(() => {
      if (data.course_mode !== 'batch') return;
      if (mainCourses.length > 0) return;

      fetch(route('courses.main-courses'))
         .then((res) => res.json())
         .then((response) => {
            const items =
               response?.data?.map((c: any) => ({
                  label: c.title as string,
                  value: String(c.id),
               })) || [];

            setMainCourses(items);
         })
         .catch((error) => {
            console.error('Failed to load main courses', error);
         });
   }, [data.course_mode, mainCourses.length]);

   const selectedMainCourse = useMemo(
      () => mainCourses.find((item) => Number(item.value) === Number(data.main_course_id)),
      [mainCourses, data.main_course_id]
   );

   return (
      <Card className="container p-4 sm:p-6">
         <form onSubmit={handleSubmit} className="space-y-4">
            <div>
               <Label>{input.title} *</Label>
               <Input
                  name="title"
                  value={data.title}
                  onChange={(e) => onHandleChange(e, setData)}
                  placeholder={input.title_placeholder}
               />
               <InputError message={errors.title} />
            </div>

            <div>
               <Label>{input.short_description}</Label>
               <Textarea
                  rows={5}
                  name="short_description"
                  value={data.short_description}
                  onChange={(e) => onHandleChange(e, setData)}
                  placeholder={input.short_description_placeholder}
               />
               <InputError message={errors.short_description} />
            </div>

            <div>
               <Label>{input.description}</Label>
               <TiptapEditor
                  editorClassName="min-h-[256px] max-h-[640px]"
                  placeholder={{
                     paragraph: input.description_placeholder,
                     imageCaption: input.description_placeholder,
                  }}
                  contentMinHeight={256}
                  contentMaxHeight={640}
                  initialContent={data.description}
                  onContentChange={(value) =>
                     setData((prev) => ({
                        ...prev,
                        description: value as string,
                     }))
                  }
               />
               <InputError message={errors.description} />
            </div>

            {/* Instructor field (only for admin) */}
            {auth?.user?.role === 'admin' && (
               <div>
                  <Label>{input.instructor ?? 'Instructor'} *</Label>
                  <Select
                     value={String(data.instructor_id)}
                     onValueChange={(value) => setData('instructor_id', Number(value))}
                  >
                     <SelectTrigger>
                        <SelectValue placeholder={input.instructor_placeholder} />
                     </SelectTrigger>
                     <SelectContent>
                        {transformedInstructors?.map((instructor) => (
                           <SelectItem key={instructor.value} value={String(instructor.value)}>
                              {instructor.label}
                           </SelectItem>
                        ))}
                     </SelectContent>
                  </Select>
                  <InputError message={errors.instructor_id} />
               </div>
            )}

            {/* NEW: Course Mode (Main / Batch) + Main course select */}
            <div className="grid gap-6 md:grid-cols-2">
               <div>
                  <Label>{input.course_mode_label ?? 'Course type'} *</Label>
                  <RadioGroup
                     value={data.course_mode}
                     className="flex items-center space-x-4 pt-2 pb-1"
                     onValueChange={(value) => setData('course_mode', value)}
                  >
                     <div className="flex items-center space-x-2">
                        <RadioGroupItem className="cursor-pointer" id="course_mode_main" value="main" />
                        <Label htmlFor="course_mode_main">
                           {input.main_course_label ?? 'Main course'}
                        </Label>
                     </div>
                     <div className="flex items-center space-x-2">
                        <RadioGroupItem className="cursor-pointer" id="course_mode_batch" value="batch" />
                        <Label htmlFor="course_mode_batch">
                           {input.batch_course_label ?? 'Batch course'}
                        </Label>
                     </div>
                  </RadioGroup>
                  <InputError message={errors.course_mode} />
               </div>

               {data.course_mode === 'batch' && (
                  <div className="space-y-4">
                     <div>
                        <Label>{input.main_course_select_label ?? 'Select main course'} *</Label>
                        <Combobox
                           data={mainCourses}
                           placeholder={input.main_course_placeholder ?? 'Choose main course'}
                           defaultValue={selectedMainCourse?.label || ''}
                           onSelect={(selected) => setData('main_course_id', Number(selected.value))}
                        />
                        <InputError message={errors.main_course_id} />
                     </div>

                     <div>
                        <Label>{input.batch_no_label ?? 'Batch number'} *</Label>
                        <Input
                           name="batch_no"
                           value={data.batch_no}
                           onChange={(e) => setData('batch_no', e.target.value)}
                           placeholder={input.batch_no_placeholder ?? 'e.g. Batch 1, 2025 Jan'}
                        />
                        <InputError message={errors.batch_no} />
                     </div>
                  </div>
               )}
            </div>

            {/* NEW: Public / Private + Completed status */}
            <div className="grid gap-6 md:grid-cols-2">
               <div>
                  <Label>{input.visibility_label ?? 'Visibility'} *</Label>
                  <RadioGroup
                     value={data.visibility}
                     className="flex items-center space-x-4 pt-2 pb-1"
                     onValueChange={(value) => setData('visibility', value)}
                  >
                     <div className="flex items-center space-x-2">
                        <RadioGroupItem
                           className="cursor-pointer"
                           id="visibility_public"
                           value="public"
                        />
                        <Label htmlFor="visibility_public">
                           {input.public_label ?? 'Public'}
                        </Label>
                     </div>
                     <div className="flex items-center space-x-2">
                        <RadioGroupItem
                           className="cursor-pointer"
                           id="visibility_private"
                           value="private"
                        />
                        <Label htmlFor="visibility_private">
                           {input.private_label ?? 'Private'}
                        </Label>
                     </div>
                  </RadioGroup>
                  <InputError message={errors.visibility} />
               </div>

               <div>
                  <Label>{input.course_completed_label ?? 'Course completed?'}</Label>
                  <RadioGroup
                     defaultValue={data.is_completed ? 'yes' : 'no'}
                     className="flex items-center space-x-4 pt-2 pb-1"
                     onValueChange={(value) => setData('is_completed', value === 'yes')}
                  >
                     <div className="flex items-center space-x-2">
                        <RadioGroupItem className="cursor-pointer" id="course_completed_no" value="no" />
                        <Label htmlFor="course_completed_no">No</Label>
                     </div>
                     <div className="flex items-center space-x-2">
                        <RadioGroupItem className="cursor-pointer" id="course_completed_yes" value="yes" />
                        <Label htmlFor="course_completed_yes">Yes</Label>
                     </div>
                  </RadioGroup>
                  <InputError message={errors.is_completed} />
               </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
               <div>
                  <Label>{input.category} *</Label>
                  <Combobox
                     defaultValue={
                        selectedCategory
                           ? selectedCategory.parent
                              ? `${selectedCategory.parent.title} > ${selectedCategory.title}`
                              : selectedCategory.title
                           : ''
                     }
                     data={transformedCategories}
                     placeholder={input.category_placeholder}
                     onSelect={(selected) => {
                        const selectedCategory = transformedCategories.find(
                           (category) => category.value === selected.value
                        );

                        if (!selectedCategory) return;

                        setData('course_category_id', selectedCategory.id);
                        setData('course_category_child_id', selectedCategory.child_id || null);
                     }}
                  />
                  <InputError message={errors.course_category_id} />
               </div>

               <div>
                  <Label>{input.course_level} *</Label>
                  <Select
                     value={String(data.level ?? '')}
                     onValueChange={(value) => setData('level', value)}
                  >
                     <SelectTrigger>
                        <SelectValue placeholder={input.course_level_placeholder} />
                     </SelectTrigger>
                     <SelectContent>
                        {labels.map((level: any) => {
                        // PHP enum হলে { name, value } থাকবে, string হলে সরাসরি নেব
                        const value = typeof level === 'string' ? level : String(level.value);
                        const text =
                           (input as any)[value] // যদি translate ফাইলে থাকে (beginner, intermediate...)
                           ?? (typeof level === 'object' && level !== null
                              ? (level.name ?? value)
                              : value);

                        return (
                           <SelectItem key={value} value={value}>
                              {text}
                           </SelectItem>
                        );
                        })}
                     </SelectContent>
                  </Select>
                  <InputError message={errors.level} />
               </div>

               <div>
                  <Label>{input.course_language} *</Label>
                  <Combobox
                     defaultValue={data.language}
                     data={courseLanguages}
                     placeholder={input.course_language_placeholder}
                     onSelect={(selected) => setData('language', selected.value)}
                  />
                  <InputError message={errors.language} />
               </div>

               <div>
                  <Label>{input.drip_content}</Label>
                  <RadioGroup
                     defaultValue={data.drip_content ? 'on' : 'off'}
                     className="flex items-center space-x-4 pt-2 pb-1"
                     onValueChange={(value) => setData('drip_content', value === 'on')}
                  >
                     <div className="flex items-center space-x-2">
                        <RadioGroupItem className="cursor-pointer" id="drip_content_off" value="off" />
                        <Label htmlFor="drip_content_off">{common.off}</Label>
                     </div>
                     <div className="flex items-center space-x-2">
                        <RadioGroupItem className="cursor-pointer" id="drip_content_on" value="on" />
                        <Label htmlFor="drip_content_on">{common.on}</Label>
                     </div>
                  </RadioGroup>
                  <InputError message={errors.drip_content} />
               </div>
            </div>

            <div className="mt-8">
               <LoadingButton loading={processing} type="submit">
                  {button.save_changes}
               </LoadingButton>
            </div>
         </form>
      </Card>
   );
};

Basic.layout = (page: ReactNode) => <DashboardLayout children={page} />;

export default Basic;
