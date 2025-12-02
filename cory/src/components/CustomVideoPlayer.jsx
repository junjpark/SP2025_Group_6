import React, { useEffect, useRef } from "react";
import "./CustomVideoPlayer.css";

const CustomVideoPlayer = React.forwardRef(
  (
    { url, start = 0, end = Infinity },
    ref
  ) => {
    CustomVideoPlayer.displayName = "CustomVideoPlayer";

    // console.log(
    //   "Rendering CustomVideoPlayer with URL:",
    //   url,
    //   "start:",
    //   start,
    //   "end:",
    //   end
    // );

    const containerRef = useRef(null);

    useEffect(() => {
      const video = ref.current;
      if (!video) return;

      const resetClip = () => {
        //if the timer ever goes past the end go back to the beginning
        if (video.currentTime >= end) {
          video.currentTime = start;
        }
      };

      // ensure video starts at the requested start time
      video.currentTime = start;
      video.addEventListener("timeupdate", resetClip);

      return () => {
        //makes sure we don't get too many event listeners
        video.removeEventListener("timeupdate", resetClip);
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [start, end, ref]);

    // No overlay drawing; backend returns annotated video directly

    return (
      <div
        className="video-container"
        ref={containerRef}
        style={{ position: "relative", display: "inline-block" }}
      >
        <video
          controls
          width={400}
          id="myVideo"
          ref={ref}
          src={url}
          onError={(e) => console.error("Video error:", e, "Video URL:", url)}
          style={{ display: "block" }}
        >
          <track kind="captions" />
          Not working
        </video>
      </div>
    );
  }
);

export default CustomVideoPlayer;
