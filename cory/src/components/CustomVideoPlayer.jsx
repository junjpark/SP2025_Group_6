import React, {useEffect, useState } from "react";
import "./CustomVideoPlayer.css"


const CustomVideoPlayer = React.forwardRef(({start, end, onPause, onPlay}, ref) => {
    CustomVideoPlayer.displayName = 'CustomVideoPlayer'
const [videoSource, ] = useState("sample.mp4")
const videoBaseDir = "/videos/"

useEffect(()=>{
    const videoPlayer = ref.current;
    const resetClip = () =>{ //if the timer ever goes past the end go back to the beginning
        if(videoPlayer.currentTime >= end){
            videoPlayer.currentTime = start;
        }
    };
    videoPlayer.currentTime = start; //start the clip over
    videoPlayer.addEventListener("timeupdate", resetClip);
    return () =>{ //runs once the useEffect is going to run again
        videoPlayer.removeEventListener("timeupdate", resetClip); //makes sure we don't get too many event listeners
    };
// eslint-disable-next-line react-hooks/exhaustive-deps
}, [start, end]);

return(
    <>
        {/* Just a video and a sorce with a fall back*/}
        <video
            controls
            width={400}
            id="myVideo"
            ref={ref}
            onPlay={onPlay}
            onPause={onPause}
        >
            <source src={videoBaseDir + videoSource} type="video/mp4"></source>
            <track kind="captions" />
            Not working
        </video>
    </>
)

});

export default CustomVideoPlayer;