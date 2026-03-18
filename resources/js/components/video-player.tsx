import Plyr from 'plyr-react';
import 'plyr-react/plyr.css';

interface Props {
   source: {
      type: 'video' | 'audio';
      sources: Array<{
         src: string;
         type?: string;
         provider?: 'youtube' | 'vimeo' | 'html5';
      }>;
   };
   translate?: any;
}

const VideoPlayer = ({ source, translate }: Props) => {
   const plyrOptions = {
      controls: ['play-large', 'play', 'progress', 'current-time', 'duration', 'mute', 'volume', 'settings', 'fullscreen'],
      settings: ['quality', 'speed'],
      speed: { selected: 1, options: [0.5, 0.75, 1, 1.25, 1.5, 2] },
      resetOnEnd: true,
      keyboard: { focused: true, global: true },
      displayDuration: true,
      tooltips: { controls: true, seek: true },
      fullscreen: {
         enabled: true,
         iosNative: true,
      },
      vimeo: {
         byline: false,
         portrait: false,
         title: false,
         speed: true,
         transparent: false,
      },
   };

   const getYouTubeId = (url: string): string | null => {
      const regExp = /^.*(youtu.be\/|v\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
      const match = url.match(regExp);
      return match && match[2].length === 11 ? match[2] : null;
   };

   const getVimeoId = (url: string): string | null => {
      const regExp = /(?:vimeo\.com\/(?:video\/)?|player\.vimeo\.com\/video\/)(\d+)/i;
      const match = url.match(regExp);
      return match ? match[1] : null;
   };

   const src = source.sources[0]?.src?.trim();
   if (!src) {
      return (
         <div className="flex h-full items-center justify-center">
            <p>{translate?.frontend?.no_video_available || 'No video available'}</p>
         </div>
      );
   }

   let processedSource = source;

   if (source.sources[0]?.provider === 'youtube' || src.includes('youtube.com') || src.includes('youtu.be')) {
      const id = getYouTubeId(src);
      if (!id) {
         return (
            <div className="flex h-full items-center justify-center">
               <p>{translate?.frontend?.no_video_available || 'No video available'}</p>
            </div>
         );
      }

      processedSource = {
         type: 'video',
         sources: [{ src: id, provider: 'youtube' }],
      };
   } else if (source.sources[0]?.provider === 'vimeo' || src.includes('vimeo.com') || src.includes('player.vimeo.com')) {
      const id = getVimeoId(src);
      if (!id) {
         return (
            <div className="flex h-full items-center justify-center">
               <p>{translate?.frontend?.no_video_available || 'No video available'}</p>
            </div>
         );
      }

      processedSource = {
         type: 'video',
         sources: [{ src: id, provider: 'vimeo' }],
      };
   }

   return (
      <div key={`${processedSource.sources[0].provider || 'html5'}-${processedSource.sources[0].src}`}>
         <Plyr options={plyrOptions} source={processedSource} />
      </div>
   );
};

export default VideoPlayer;