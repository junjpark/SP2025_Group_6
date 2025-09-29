import React, {useEffect, useState, useRef } from "react";
import "./CustomVideoPlayer.css"


const CustomVideoPlayer = React.forwardRef((props, vpr) => {
const [videoSource, setVideoSource] = useState("")
const videoBaseDir = "/videos/sample.mp4"
return(
    <>
        <video
            controls
            width={400}
            loop
            id="myVideo"
            ref={vpr}
        >
            <source src={videoBaseDir + videoSource} type="video/mp4"></source>
            Not working
        </video>
    </>
)

});

export default CustomVideoPlayer;