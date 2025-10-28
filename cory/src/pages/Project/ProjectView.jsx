import './ProjectView.css'
import CustomVideoPlayer from "../../components/CustomVideoPlayer";
import Clip from '../../components/Clip';
import { useRef, useState } from 'react';
import {useAuth} from "../../contexts/AuthContext"


const ProjectView = () => {

    const videoPlayerRef = useRef(null); //this allows us to see the current time of the player

    const [isMirrored, setIsMirrored] = useState(false);

    //note that clipTimings is 1-index because the currentClipId = 0 pertains to the whole video
    //time stamps are of the form [a,b)
    const [clipTimings, setClipTimings] = useState([[0, 5],[5,13.346667]]); 

    const [clips, setClips] = useState(new Map([
        [0, {'row': 0, 'start': 0, 'end':100}],
        [1, {'row': 1, 'start': 30, 'end':70}],
        [2, {'row': 1, 'start': 0, 'end':20}]
    ]))

    const [selectResizing, setSelectResizing] = useState(false)
    const [resizing, setResizing] = useState(false)
    const [currentClipId, setCurrentClipId] = useState();
    const [currentClipBeingDraggedId, setCurrentClipBeingDraggedId] = useState("xx"); //be of the form "1l" or "2r" which is id and then l or r

    const [videoLength, setVideoLength] = useState(13.333)

    //clipAnnotations are 0-index
    const [clipAnnotations, setClipAnnotations] = useState(["", "note 1", "note 2"]); //this is not how clipAnnotations should work TODO: FIX

    const {user} = useAuth(); //this user object tells us what is going on

    /**
     * This handles when a user changes an annotation
     * @param {int} clipIdToChange - the is the 1-indexed variable for the clip
     * @param {string} newMessage - this is what to change the annotation to
     * @returns {void}
     */
    function handleAnnotationChange(clipIdToChange, newMessage){
        let newClipAnnotations = [...clipAnnotations] //simply copies the array
        newClipAnnotations[clipIdToChange] = newMessage //and changes the one value we need
        setClipAnnotations(newClipAnnotations)
    }

    const getCurrentStartClipTimeStamp = () =>{
        if(currentClipId === undefined){
            return 0;
        }
       return calculateTimeStamp(clips.get(currentClipId).start)
    }

    const getCurrentEndClipTimeStamp = () =>{
        if(currentClipId === undefined){
            return videoLength;
        }
        return calculateTimeStamp(clips.get(currentClipId).end)
    }

    function clip(){
        //TODO: update clip
    }

    function mirror(){
        const isCurrentlyMirrored = isMirrored;
        setIsMirrored(!isCurrentlyMirrored)
        const videoRef = videoPlayerRef.current
        if(isCurrentlyMirrored){
            videoRef.classList.remove("mirrored")
        } else{
            videoRef.classList.add("mirrored")
        }
    }

    const renderClip = (clip, id) =>{
        const height = clip.row == 0 ? 40 : 10
        const top = clip.row == 0 ? 2.5 : 44 + (clip.row-1)*11
        const width = ((clip.end - clip.start) * (19/20))
        const left = (clip.start * (19/20))+2.5
        // console.log(id)
        return <div style={{
          "position": 'absolute',
          "bottom": `${top*2}px`,
          "height": `${height*2}px`,
          "left": `${left}%`,
          "width": `${width}%`
        }} key={id} onClick={handleClick} data-clip-id={id} tabIndex={id+1} onKeyDown={(e) => handleKeyDown(e, id)} className='clip'></div>
    }

    const handleClick = (e) =>{
        const clipClicked = e.currentTarget.getBoundingClientRect();
        const mouseX = e.clientX
        const clipX = clipClicked.x;
        const clipWidth = clipClicked.width;
        const clipId = parseInt(e.currentTarget.dataset.clipId, 10);
        const clip = clips.get(clipId)
        setCurrentClipId(clipId)
        const clipStart = clip.start
        const clipEnd = clip.end
        calculatePercent(clipStart, clipEnd, clipX, clipWidth, mouseX)
        const width = clipClicked.width;
        const relativeX = e.clientX - clipClicked.left; // Position within the element
        if(selectResizing){
          if (relativeX < width / 10) {
            handleResize(clipId, true)
          } else if(relativeX > 9 * width / 10){
            handleResize(clipId, false)
          }
        }
      }

      const handleKeyDown = (e, clipId) => {
        const buttonPressed = e.key
        if(buttonPressed == "Enter"){
          setCurrentClipBeingDraggedId("xx");
          setCurrentClipId();
          document.activeElement.blur();
          return;
        }
        if(buttonPressed !== "ArrowRight" && buttonPressed !== "ArrowLeft"){
          return;
        }
        if(clipId != currentClipBeingDraggedId.charAt(0)){
          return
        }
        if(buttonPressed == "ArrowRight"){
          moveRight();
        } else{
          moveLeft();
        }
      }
    
      const toggleSelectResizing = () =>{
        setSelectResizing(!selectResizing);
        if(resizing){
          setResizing(false)
        }
      }
    
      const handleResize = (clipId, isLeft) => {
        if(clipId === 0){
          console.warn("cannot resize main clip")
          return
        }
        setSelectResizing(false)
        setResizing(true)
        if(isLeft){
          setCurrentClipBeingDraggedId(clipId+"l")
        } else{
          setCurrentClipBeingDraggedId(clipId+"r")
        }
      }
    
      const moveLeft = () =>{
        // console.log(clips)
        if(!resizing){
          return
        }
        const clipId = parseInt(currentClipBeingDraggedId.charAt(0), 10);
        const side = currentClipBeingDraggedId.charAt(1);
        const oldClip = clips.get(clipId);
        let newClips = new Map(clips)
        newClips.delete(clipId)
        if(side == 'l'){
          const newStart = oldClip.start-1;
          if(newStart < 0){
            return;
          }
          addClip(newStart, oldClip.end, newClips, clipId)
        } else{
          const newEnd = oldClip.end-1;
          if(newEnd <= oldClip.start){
            return;
          }
          addClip(oldClip.start, newEnd, newClips, clipId)
        }
      }
    
      const moveRight = () =>{
        if(!resizing){
          return
        }
        const clipId = parseInt(currentClipBeingDraggedId.charAt(0), 10);
        const side = currentClipBeingDraggedId.charAt(1);
        const oldClip = clips.get(clipId);
        let newClips = new Map(clips)
        newClips.delete(clipId)
        if(side == 'l'){
          const newStart = oldClip.start+1;
          if(newStart >= oldClip.end){
            return;
          }
          addClip(newStart, oldClip.end, newClips, clipId)
        } else{
          const newEnd = oldClip.end+1;
          if(newEnd > 100){
            return;
          }
          addClip(oldClip.start, newEnd, newClips, clipId)
        }
      }
    
      const handleDelete = () =>{
        if(currentClipId === undefined){
            return;
        }
        if(currentClipId == 0){
          console.warn("cannot delete main clip")
          return;
        }
        let newClips = new Map(clips);
        newClips.delete(currentClipId);
        setClips(newClips)
      }

      const calculatePercent = (clipStart, clipEnd, clipX, clipWidth, newX) => {
        const pixelPerPerecent = clipWidth/(clipEnd-clipStart)
        const pixelZero = clipX - (clipStart*pixelPerPerecent)
        const desiredPercent = (newX - pixelZero)/pixelPerPerecent
        return desiredPercent
      }

      const calculateTimeStamp = (percentOfVideo) => {
        return percentOfVideo * videoLength / 100
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
                    <img src="./images/scissors.jpg" alt="cut icon" width="50" height="60"></img>
                </button>
                <button id="mirrorHolder" onClick={mirror} onKeyDown={(e) => {
                    if (e.key == 'Enter' || e.key == ' ') {
                        e.preventDefault();
                        mirror(e);
                    }
                }}>
                    <img src="./images/mirror.png" alt="mirror icon" width="50" height="60"></img>
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
        {/* In order to get the click off the clip to work this needs to be clickable and per the linter must be a button */}
        <div id="projectViewFooter">
            {Array.from(clips).map(([id, clip]) => renderClip(clip, id))}
        </div>
    </div>
    )

};

export default ProjectView;
