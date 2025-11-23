import Combobox from '@/components/combobox';
import InputError from '@/components/input-error';
import LoadingButton from '@/components/loading-button';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import DashboardLayout from '@/layouts/dashboard/layout';
import { SharedData, User, Course } from '@/types/global';
import { useForm } from '@inertiajs/react';
import { ReactNode } from 'react';

interface Props extends SharedData {
   users: User[];
   courses: Course[];
   prices: string[];
}

const Index = (props: Props) => {
   const { users, courses, prices, translate } = props;
   const { input, button } = translate;

   const { data, setData, post, errors, processing } = useForm({
      user_id: '',
      course_id: '',
      enrollment_type: 'free',
      amount: '',
      payment_method: '',
      transaction_id: '',
      coupon_applied: false,
      coupon_code: '',
      discount_amount: '',
   });

   const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      post(route('enrollments.store'));
   };

   const transformedUsers = users.map((user) => ({
      label: user.name,
      value: user.id as string,
   }));

   const transformedCourses = courses.map((course) => ({
      label: course.batch_no ? `${course.title} (Batch: ${course.batch_no})` : course.title,
      value: course.id as string,
   }));

   return (
      <Card className="mx-auto max-w-2xl p-6">
         <form onSubmit={handleSubmit} className="space-y-6">
            {/* User Selection */}
            <div>
               <Label>{input.select} User</Label>
               <Combobox
                  data={transformedUsers}
                  defaultValue={data.user_id}
                  placeholder={input.select_user}
                  onSelect={(selected) => setData('user_id', selected.value)}
               />
               <InputError message={errors.user_id} />
            </div>

            {/* Course Selection */}
            <div>
               <Label>{input.select_course}</Label>
               <Combobox
                  data={transformedCourses}
                  defaultValue={data.course_id}
                  placeholder={input.select_course_placeholder}
                  onSelect={(selected) => setData('course_id', selected.value)}
               />
               <InputError message={errors.course_id} />
            </div>

            {/* Enrollment Type */}
            <div>
               <Label>{input.enrollment_type}</Label>
               <RadioGroup
                  defaultValue={data.enrollment_type}
                  className="flex items-center space-x-4 pt-2 pb-1"
                  onValueChange={(value) => setData('enrollment_type', value)}
               >
                  {prices.map((price) => (
                     <div key={price} className="flex items-center space-x-2">
                        <RadioGroupItem className="cursor-pointer" id={price} value={price} />
                        <Label htmlFor={price} className="capitalize cursor-pointer">
                           {price}
                        </Label>
                     </div>
                  ))}
               </RadioGroup>
               <InputError message={errors.enrollment_type} />
            </div>

            {/* Payment Details (Visible only if 'paid') */}
            {data.enrollment_type === 'paid' && (
               <div className="border p-4 rounded-md bg-gray-50 space-y-4 animate-in fade-in slide-in-from-top-2">
                  <h3 className="font-semibold text-gray-700 border-b pb-2">Payment Information</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     {/* Amount */}
                     <div>
                        <Label>Amount (TK)</Label>
                        <Input 
                           type="number" 
                           placeholder="e.g. 5000"
                           value={data.amount}
                           onChange={(e) => setData('amount', e.target.value)}
                        />
                        <InputError message={errors.amount} />
                     </div>

                     {/* Payment Method */}
                     <div>
                        <Label>Payment Method <span className="text-gray-400 text-xs">(Optional)</span></Label>
                        <Select onValueChange={(val) => setData('payment_method', val)}>
                           <SelectTrigger>
                              <SelectValue placeholder="Select Method" />
                           </SelectTrigger>
                           <SelectContent>
                              <SelectItem value="bKash">bKash</SelectItem>
                              <SelectItem value="Nagad">Nagad</SelectItem>
                              <SelectItem value="Rocket">Rocket</SelectItem>
                              <SelectItem value="Bank">Bank Transfer</SelectItem>
                           </SelectContent>
                        </Select>
                        <InputError message={errors.payment_method} />
                     </div>

                     {/* Transaction ID (Optional) */}
                     <div className="col-span-2">
                        <Label>Transaction ID <span className="text-gray-400 text-xs">(Optional)</span></Label>
                        <Input 
                           type="text" 
                           placeholder="Enter Transaction ID (Optional)"
                           value={data.transaction_id}
                           onChange={(e) => setData('transaction_id', e.target.value)}
                        />
                        <InputError message={errors.transaction_id} />
                     </div>
                  </div>

                  {/* Coupon Section (Optional) */}
                  <div className="pt-2">
                     <div className="flex items-center space-x-2 mb-3">
                        <Checkbox 
                           id="coupon" 
                           checked={data.coupon_applied} 
                           onCheckedChange={(checked) => setData('coupon_applied', checked === true)}
                        />
                        <Label htmlFor="coupon" className="cursor-pointer font-medium text-gray-700 select-none">
                           Coupon Applied? <span className="text-gray-400 text-xs">(Optional)</span>
                        </Label>
                     </div>

                     {data.coupon_applied && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-6 border-l-2 border-blue-200">
                           <div>
                              <Label>Coupon Code <span className="text-gray-400 text-xs">(Optional)</span></Label>
                              <Input 
                                 placeholder="Enter Coupon Code"
                                 value={data.coupon_code}
                                 onChange={(e) => setData('coupon_code', e.target.value)}
                              />
                              <InputError message={errors.coupon_code} />
                           </div>
                           <div>
                              <Label>Discount Amount</Label>
                              <Input 
                                 type="number" 
                                 placeholder="Discount Value"
                                 value={data.discount_amount}
                                 onChange={(e) => setData('discount_amount', e.target.value)}
                              />
                              <InputError message={errors.discount_amount} />
                           </div>
                        </div>
                     )}
                  </div>
               </div>
            )}

            <div className="col-span-2 mt-6 text-right">
               <LoadingButton loading={processing}>{button.submit}</LoadingButton>
            </div>
         </form>
      </Card>
   );
};

Index.layout = (page: ReactNode) => <DashboardLayout children={page} />;

export default Index;