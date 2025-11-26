import { Button } from '@/components/ui/button';
import { CoursePlayerProps } from '@/types/page';
import { Link, usePage } from '@inertiajs/react';
import { parseISO } from 'date-fns';
import { ExternalLink } from 'lucide-react';
import { useEffect, useState, useCallback } from 'react';

interface Props {
   courseId: string | number;
   liveClass: CourseLiveClass;
   zoomConfig: any;
}

const LiveClassStatus = ({ courseId, liveClass, zoomConfig }: Props) => {
   const { props } = usePage<CoursePlayerProps>();
   const { translate } = props;
   const { frontend } = translate;

   // 1. Helper to calculate countdown string
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

   // Initialize state with immediate calculation
   const [currentTime, setCurrentTime] = useState(new Date());
   const [countdown, setCountdown] = useState<string>(calculateCountdown());

   // 2. Helper to safely get end time
   const getEndTime = (liveClassData: CourseLiveClass) => {
      if (liveClassData.additional_info && typeof liveClassData.additional_info === 'object' && 'end_time' in liveClassData.additional_info) {
         return new Date(liveClassData.additional_info.end_time);
      }
      // Default duration 1 hour
      return new Date(parseISO(liveClassData.class_date_and_time).getTime() + 60 * 60 * 1000);
   };

   // 3. Helper to safely get join URL
   const getJoinUrl = () => {
      if (liveClass.meeting_link) {
         return liveClass.meeting_link;
      }
      if (liveClass.additional_info && typeof liveClass.additional_info === 'object' && 'join_url' in liveClass.additional_info) {
         return liveClass.additional_info.join_url;
      }
      return '#';
   };

   // 4. Determine Status
   const getClassStatus = (liveClassData: CourseLiveClass): string => {
      const now = currentTime;
      const classStart = parseISO(liveClassData.class_date_and_time);
      const classEnd = getEndTime(liveClassData);

      if (now > classEnd) {
         return 'ended';
      } else if (now >= classStart && now <= classEnd) {
         return 'live';
      } else {
         return 'upcoming';
      }
   };

   const status = getClassStatus(liveClass);

   // 5. Update Timer every second
   useEffect(() => {
      const timer = setInterval(() => {
         const now = new Date();
         setCurrentTime(now);
         
         // Only recalculate countdown if the class hasn't started yet
         const start = parseISO(liveClass.class_date_and_time);
         if (now < start) {
            setCountdown(calculateCountdown());
         } else {
            setCountdown('');
         }
      }, 1000);

      return () => clearInterval(timer);
   }, [liveClass.class_date_and_time, calculateCountdown]);

   const isSdkConfig = zoomConfig?.zoom_web_sdk && zoomConfig?.zoom_sdk_client_id && zoomConfig?.zoom_sdk_client_secret;
   const joinUrl = getJoinUrl();
   const hasValidLink = liveClass.meeting_link || (joinUrl && joinUrl !== '#');

   const getStatusColor = (status: string) => {
      switch (status) {
         case 'live':
            return 'text-green-600 bg-green-100';
         case 'upcoming':
            return 'text-blue-600 bg-blue-100';
         case 'ended':
            return 'text-muted-foreground bg-gray-100';
         default:
            return 'text-orange-600 bg-orange-100';
      }
   };

   return (
      <>
         {/* Status Badge with Countdown */}
         <span className={`rounded-full px-3 py-1 text-center text-xs font-medium capitalize ${getStatusColor(status)}`}>
            {status === 'upcoming' && countdown ? `Starts in: ${countdown}` : status}
         </span>

         {/* Join Button Logic */}
         {status === 'live' ? (
            isSdkConfig && liveClass.provider === 'zoom' && !liveClass.meeting_link ? (
               <Link href={route('live-class.start', liveClass.id)}>
                  <Button size="sm" variant="default" className="flex w-full items-center gap-2">
                     <ExternalLink className="h-4 w-4" />
                     {frontend.join_class}
                  </Button>
               </Link>
            ) : (
               <a href={joinUrl} target="_blank" rel="noopener noreferrer">
                  <Button 
                     size="sm" 
                     variant="default" 
                     className="flex w-full items-center gap-2"
                     disabled={!hasValidLink}
                  >
                     <ExternalLink className="h-4 w-4" />
                     {frontend.join_class}
                  </Button>
               </a>
            )
         ) : (
            <Button disabled variant="outline" size="sm" className="flex w-full items-center gap-2">
               <ExternalLink className="h-4 w-4" />
               {status === 'ended' ? 'Class Ended' : frontend.join_class}
            </Button>
         )}
      </>
   );
};

export default LiveClassStatus;