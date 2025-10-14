import './ProjectView.css'
import CustomVideoPlayer from "../../components/CustomVideoPlayer";
import Clip from '../../components/Clip';
import { useRef, useState } from 'react';
// Project view component for video annotation
const ProjectView = () => {
const videoPlayerRef = useRef(null);
const [startClipTimeStamp, setStartClipTimeStamp] = useState(0);
const [endClipTimeStamp, setEndClipTimeStamp] = useState(13.346667);
const [clipTimings, setClipTimings] = useState([[0, 5],[5,13.346667]]); //time stamps are of the form [a,b)
const [selectedClipDiv, setSelectedClipDiv] = useState(null)

function setClipTimeStamps(a,b, divToHighlight){
    if(selectedClipDiv != null){
        selectedClipDiv.classList.remove("selected")
    }
    if((a == startClipTimeStamp && b == endClipTimeStamp) || divToHighlight == null){
        setStartClipTimeStamp(0);
        setEndClipTimeStamp(13.346667);
        return;
    }
    setSelectedClipDiv(divToHighlight);
    divToHighlight.classList.add("selected")
    setStartClipTimeStamp(a);
    setEndClipTimeStamp(b);
}

function clip(){
    setClipTimeStamps(0, 13.346667, null); // Reset to full video
    const videoCurrentTime = videoPlayerRef.current.currentTime;
    let newClipTimings = []
    for(const interval of clipTimings){
        if(videoCurrentTime >= interval[0] && videoCurrentTime < interval[1]){
            newClipTimings.push([interval[0], videoCurrentTime]);
            newClipTimings.push([videoCurrentTime, interval[1]]);
        } else{
            newClipTimings.push([interval[0], interval[1]]);
        }
    }
    console.log(newClipTimings)
    setClipTimings(newClipTimings);
}

return (
<div id="projectView">
    <nav id="projectViewNav">
        <p>
            Logo Here
        </p>
    </nav>
    <div id="projectViewEditor">
        <div id="projectViewToolbar">
            <button id="scissorsHolder" onClick={clip} onKeyDown={(e) => {
                if (e.key == 'Enter' || e.key == ' ') {
                    e.preventDefault();
                    clip(e);
                }
             }}>
                <img src="./images/scissors.jpg" alt="Girl in a jacket" width="50" height="60"></img>
            </button>
            
        </div>
        <div id="projectViewVideoPlayer">
            <CustomVideoPlayer ref={videoPlayerRef} start={startClipTimeStamp} end={endClipTimeStamp}></CustomVideoPlayer>
        </div>
        <div id="clipInfo">
            Clip Info {startClipTimeStamp} , {endClipTimeStamp}
        </div>
    </div>
    <button id="projectViewFooter" onClick={()=>setClipTimeStamps(0, 13.346667, null)} onKeyDown={(e)=>{if(e.key === 'Enter'){setClipTimeStamps(0, 13.346667, null);}}}>
        {clipTimings.map(function(tuple,idx) {
            return (
                <Clip start={tuple[0]} end={tuple[1]} onClick={(a,b, divToHighlight)=>{setClipTimeStamps(a,b, divToHighlight)}} key={idx}></Clip>
            );
        })}
    </button>
</div>
)

};

export default ProjectView;
