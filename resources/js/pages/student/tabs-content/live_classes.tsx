import TiptapRenderer from '@/components/text-editor/tiptap-renderer/client-renderer';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { StudentCourseProps } from '@/types/page';
import { usePage } from '@inertiajs/react';
import { addHours, differenceInMinutes, format, isPast, parseISO } from 'date-fns';
import { Calendar, Clock, Video } from 'lucide-react';
import { useEffect, useState, useCallback } from 'react';

// আলাদা কম্পোনেন্ট কাউন্টডাউন এবং বাটনের জন্য
const LiveClassItem = ({ liveClass }: { liveClass: any }) => {
   const [currentTime, setCurrentTime] = useState(new Date());
   const [countdown, setCountdown] = useState<string>('');

   // 1. Countdown Calculator
   const calculateCountdown = useCallback(() => {
      const now = new Date().getTime();
      const start = parseISO(liveClass.class_date_and_time).getTime();
      const distance = start - now;

      if (distance < 0) return '';

      const days = Math.floor(distance / (1000 * 60 * 60 * 24));
      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);

      let timeString = '';
      if (days > 0) timeString += `${days}d `;
      if (hours > 0 || days > 0) timeString += `${hours}h `;
      timeString += `${minutes}m ${seconds}s`;

      return timeString;
   }, [liveClass.class_date_and_time]);

   // 2. Timer Effect
   useEffect(() => {
      const timer = setInterval(() => {
         setCurrentTime(new Date());
         const start = parseISO(liveClass.class_date_and_time);
         if (new Date() < start) {
            setCountdown(calculateCountdown());
         } else {
            setCountdown('');
         }
      }, 1000);

      // Initial call
      setCountdown(calculateCountdown());

      return () => clearInterval(timer);
   }, [liveClass.class_date_and_time, calculateCountdown]);

   // 3. Button Status Logic
   const getButtonStatus = () => {
      const classTime = parseISO(liveClass.class_date_and_time);
      const diff = differenceInMinutes(classTime, currentTime);
      const classEndTime = addHours(classTime, 1); // 1 Hour Duration

      const joinUrl = liveClass.meeting_link;
      const hasValidLink = !!joinUrl;

      // Case 1: Class Ended
      if (isPast(classEndTime)) {
         return (
            <Button disabled variant="outline" className="w-full sm:w-auto">
               Class Ended
            </Button>
         );
      }

      // Case 2: Live Now (Start time passed or within 15 mins)
      if (diff <= 15 && hasValidLink) {
         return (
            <div className="flex flex-col gap-2">
                <span className="text-xs font-medium text-green-600 text-center bg-green-100 px-2 py-1 rounded-full animate-pulse">
                    Live Now
                </span>
                <a href={joinUrl} target="_blank" rel="noopener noreferrer">
                   <Button className="w-full gap-2 sm:w-auto">
                      <Video className="h-4 w-4" />
                      Join Class
                   </Button>
                </a>
            </div>
         );
      }

      // Case 3: Upcoming with Countdown
      return (
         <div className="flex flex-col gap-2 items-center">
            {countdown && (
               <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-full whitespace-nowrap">
                  Starts in: {countdown}
               </span>
            )}
            <Button disabled variant="secondary" className="w-full sm:w-auto">
               Upcoming
            </Button>
         </div>
      );
   };

   return (
      <div className="flex flex-col gap-2 min-w-[140px]">
         {getButtonStatus()}
      </div>
   );
};

const LiveClasses = () => {
   const { props } = usePage<StudentCourseProps>();
   const { live_classes } = props;

   return (
      <div className="space-y-4">
         {live_classes.length <= 0 ? (
            <div className="p-8 text-center">
               <Calendar className="mx-auto mb-4 h-12 w-12 text-gray-400" />
               <h3 className="mb-2 text-lg font-medium">No Live Classes Scheduled</h3>
               <p className="text-gray-500">Schedule your first live class to get started.</p>
            </div>
         ) : (
            live_classes.map((liveClass) => {
               return (
                  <Card key={liveClass.id} className="space-y-4 p-4">
                     <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                           <p className="text-base font-medium">{liveClass.class_topic}</p>
                           <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                              <div className="flex items-center gap-2">
                                 <Clock className="h-4 w-4" />
                                 <span>{format(parseISO(liveClass.class_date_and_time), 'p')}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                 <Calendar className="h-4 w-4" />
                                 <span>{format(parseISO(liveClass.class_date_and_time), 'PPP')}</span>
                              </div>
                           </div>
                        </div>

                        {/* Using the separate component here */}
                        <LiveClassItem liveClass={liveClass} />
                     </div>

                     {liveClass.class_note && (
                        <Accordion type="single" collapsible className="w-full">
                           <AccordionItem value="item-1" className="bg-muted overflow-hidden rounded-lg border-none">
                              <AccordionTrigger className="[&[data-state=open]]:!bg-secondary-lighter px-3 py-1.5 text-sm font-normal hover:no-underline">
                                 Class Note
                              </AccordionTrigger>
                              <AccordionContent className="p-3">
                                 <TiptapRenderer>{liveClass.class_note}</TiptapRenderer>
                              </AccordionContent>
                           </AccordionItem>
                        </Accordion>
                     )}
                  </Card>
               );
            })
         )}
      </div>
   );
};

export default LiveClasses;