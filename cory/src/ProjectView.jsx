import './ProjectView.css'
import CustomVideoPlayer from "./CustomVideoPlayer";
import Clip from './Clip';
import { useRef, useState } from 'react';
/*TODO:
    When Click clip show info
    When click clip start looping
    when click off clip/same clip goes back to global loop
    manual clipping
    update to abby's file structure
    look into better controls
*/
const ProjectView = () => {
const videoPlayerRef = useRef(null);
const [startClipTimeStamp, setStartClipTimeStamp] = useState(0);
const [endClipTimeStamp, setEndClipTimeStamp] = useState(13.346667);
const [clipTimings, setClipTimings] = useState([[0, 5],[5,13.346667]]); //time stamps are of the form [a,b)
const [selectedClip, setSelectedClip] = useState(null)

function setClipTimeStamps(a,b, divToHighlight){
    if(selectedClip != null){
        selectedClip.classList.remove("selected")
    }
    if((a == startClipTimeStamp && b == endClipTimeStamp) || divToHighlight == null){
        setStartClipTimeStamp(0);
        setEndClipTimeStamp(13.346667);
        return;
    }
    setSelectedClip(divToHighlight);
    divToHighlight.classList.add("selected")
    setStartClipTimeStamp(a);
    setEndClipTimeStamp(b);
}

function clip(){
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
            <div id="scissorsHolder" onClick={clip}>
                <img src="./images/scissors.jpg" alt="Girl in a jacket" width="50" height="60"></img>
            </div>
            
        </div>
        <div id="projectViewVideoPlayer">
            <CustomVideoPlayer ref={videoPlayerRef}></CustomVideoPlayer>
        </div>
        <div id="clipInfo">
            Clip Info {startClipTimeStamp} , {endClipTimeStamp}
        </div>
    </div>
    <footer id="projectViewFooter" onClick={()=>setClipTimeStamps(0, 13.346667, )}>
        {clipTimings.map(function(tuple,idx) {
            return (
                <Clip start={tuple[0]} end={tuple[1]} onClick={(a,b, divToHighlight)=>{setClipTimeStamps(a,b, divToHighlight)}} key={idx}></Clip>
            );
        })}
    </footer>
</div>
)

};

export default ProjectView;
