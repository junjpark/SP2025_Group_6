import React, {useEffect, useState, useRef } from "react";
import "./CustomVideoPlayer.css"


const CustomVideoPlayer = React.forwardRef(({start, end}, ref) => {
const [videoSource, setVideoSource] = useState("")
const videoBaseDir = "/videos/sample.mp4"

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
}, [start, end]);

return(
    <>
        <video
            controls
            width={400}
            loop
            id="myVideo"
            ref={ref}
        >
            <source src={videoBaseDir + videoSource} type="video/mp4"></source>
            Not working
        </video>
    </>
)

});

export default CustomVideoPlayer;