import { useEffect, useState, useRef } from "react";
import "./CustomVideoPlayer.css"


const CustomVideoPlayer = () => {
const [videoSource, setVideoSource] = useState("")
const videoBaseDir = "/videos/sample.mp4"
return(
    <>
        <video
            controls
            width={400}
            loop
            id="myVideo"
        >
            <source src={videoBaseDir + videoSource} type="video/mp4"></source>
            Not working
        </video>
    </>
)

};

export default CustomVideoPlayer;