import './ProjectView.css'
import CustomVideoPlayer from "../../components/CustomVideoPlayer";
import Clip from '../../components/Clip';
import { useRef, useState } from 'react';
import {useAuth} from "../../contexts/AuthContext"
 /*TODO:
    When Click clip show info
    update to abby's file structure
*/
const ProjectView = () => {
const videoPlayerRef = useRef(null);
//note that clipTimings is 1-index because the currentClipId = 0 pertains to the whole video
//time stamps are of the form [a,b)
const [clipTimings, setClipTimings] = useState([[0, 5],[5,13.346667]]); 
const [selectedClipDiv, setSelectedClipDiv] = useState(null);
const [currentClipId, setCurrentClipId] = useState(0);
//clipAnnotations are 0-index
const [clipAnnotations, setClipAnnotations] = useState(["", "note 1", "note 2"]);
const {user, logout} = useAuth();
{console.log(user.display_name)}

function getCurrentStartClipTimeStamp(clipId=currentClipId){
    if(clipId == 0){
        return 0;
    }
    return clipTimings[clipId-1][0]
}

function getCurrentEndClipTimeStamp(clipId=currentClipId){
    if(clipId == 0){
        return 13.346667;
    }
    return clipTimings[clipId-1][1]
}

function setClipTimeStamps(a,b, idx, divToHighlight){
    setCurrentClipId(idx+1);
    const startClipTimeStamp = getCurrentStartClipTimeStamp(currentClipId)
    const endClipTimeStamp = getCurrentEndClipTimeStamp(currentClipId)
    console.log(startClipTimeStamp + ", " + endClipTimeStamp)
    console.log(a + ", " + b)
    const clipPTag = document.querySelector("#clipInfoGoesHere")
    if(selectedClipDiv != null){
        selectedClipDiv.classList.remove("selected")
    }
    if((a == startClipTimeStamp && b == endClipTimeStamp) || divToHighlight == null){
        console.log("same clip selected going back to whole vid")
        setCurrentClipId(0)
        clipPTag.classList.add("hidden");
        return;
    }
    //this means a new clip has been selected
    clipPTag.classList.remove("hidden");
    setSelectedClipDiv(divToHighlight);
    divToHighlight.classList.add("selected")
}

function handleAnnotationChange(clipIdToChange, newMessage){
    let newClipAnnotations = [...clipAnnotations]
    newClipAnnotations[clipIdToChange] = newMessage
    setClipAnnotations(newClipAnnotations)
}

function clip(){
    setClipTimeStamps(0, 13.346667, -1, null); //TODO: discuss what to do with this
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
            <CustomVideoPlayer ref={videoPlayerRef} start={getCurrentStartClipTimeStamp()} end={getCurrentEndClipTimeStamp()}></CustomVideoPlayer>
        </div>
        <div id="clipInfo">
            <p>Clip Info {getCurrentStartClipTimeStamp()} , {getCurrentEndClipTimeStamp()}</p>
            <textarea id="clipInfoGoesHere" className='hidden' value={clipAnnotations[currentClipId]} onChange={(e) => handleAnnotationChange(currentClipId, e.target.value)}></textarea>
        </div>
    </div>
    <button id="projectViewFooter" onClick={()=>setClipTimeStamps(0, 13.346667, -1, null)} onKeyDown={(e)=>{if(e.key === 'Enter'){setClipTimeStamps(0, 13.346667, -1, null);}}}>
        {clipTimings.map(function(tuple,idx) {
            return (
                <Clip start={tuple[0]} end={tuple[1]} clipId={idx} onClick={(a,b,idx,divToHighlight)=>{setClipTimeStamps(a,b,idx,divToHighlight)}} key={idx}></Clip>
            );
        })}
    </button>
</div>
)

};

export default ProjectView;
