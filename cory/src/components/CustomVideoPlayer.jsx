import React, {useEffect, useState } from "react";
import "./CustomVideoPlayer.css"


const CustomVideoPlayer = React.forwardRef(({start, end}, ref) => {
    CustomVideoPlayer.displayName = 'CustomVideoPlayer'
const [videoSource, ] = useState("sample.mp4")
const videoBaseDir = "/videos/"

useEffect(()=>{
    const videoPlayer = ref.current;
    const resetClip = () =>{
        if(videoPlayer.currentTime >= end){
            videoPlayer.currentTime = start;
        }
    };
    videoPlayer.currentTime = start;
    videoPlayer.addEventListener("timeupdate", resetClip);
    return () =>{
        videoPlayer.removeEventListener("timeupdate", resetClip);
    };
// eslint-disable-next-line react-hooks/exhaustive-deps
}, [start, end]);

return(
    <>
        <video
            controls
            width={400}
            id="myVideo"
            ref={ref}
        >
            <source src={videoBaseDir + videoSource} type="video/mp4"></source>
            <track kind="captions" />
            Not working
        </video>
    </>
)

});

export default CustomVideoPlayer;