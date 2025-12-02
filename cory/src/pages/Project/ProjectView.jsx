import "./ProjectView.css";
import CustomVideoPlayer from "../../components/CustomVideoPlayer";
import AnnotationPanel from "../../components/AnnotationPanel/AnnotationPanel";
import LearningMode from "../../components/LearningMode";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useParams, useNavigate } from "react-router-dom";
import { FiArrowLeft, FiScissors, FiTrash2 } from "react-icons/fi";
import { GoMirror } from "react-icons/go";

let nextClipId = 3;

const ProjectView = () => {
  const { projectId } = useParams(); //get the project id from the url
  // console.log("Project ID from URL:", projectId);
  const MAX_ROW = 4;
  const MIN_CLIP_SIZE = 2;
  const [newClipStatus, setNewClipStatus] = useState(0);
  const newClipRef = useRef(null);
  const [newClipObj, setNewClipObj] = useState({'start': 0, 'end': 100});
  const [videoUrl, setVideoUrl] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [annotationText, setAnnotationText] = useState("");

  const dragInitStart = useRef(0);
  const dragInitEnd = useRef(0);
  const dragInitX = useRef(0);
  const dragInitWidth = useRef(0);
  const dragInitPercent = useRef(0);
  const [isDragging, setIsDragging] = useState(null); // { clipId, type: 'left'|'right'|'move' }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const isInRow = (row) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    return ([_index, clip]) => clip.row == row;
  };
  const videoPlayerRef = useRef(null); //this allows us to see the current time of the player

  const [isMirrored, setIsMirrored] = useState(false);

  //note that clipTimings is 1-index because the currentClipId = 0 pertains to the whole video
  //time stamps are of the form [a,b)

  const [clips, setClips] = useState(
    new Map([
      [0, { row: 0, start: 0, end: 100 }]
    ])
  );

  const [resizing, setResizing] = useState(false);
  const [currentClipId, setCurrentClipId] = useState();
  const [currentClipBeingDraggedId, setCurrentClipBeingDraggedId] =
    useState("xx"); //be of the form "1l" or "2r" which is id and then l or r

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [videoLength, setVideoLength] = useState(13.333);
  const [isLearningMode, setIsLearningMode] = useState(false);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { user } = useAuth(); //this user object tells us what is going on

  /**
   * This handles when a user changes an annotation
   * @param {float} timestamp - the is the 1-indexed variable for the clip
   * @param {string} newMessage - this is what to change the annotation to
   * @returns {void}
   */
  async function handleAnnotationChange(timestamp, newMessage) {
    try {
      const form = new FormData();
      form.append("text", newMessage);
      form.append("timestamp", timestamp);

      const response = await fetch(`/api/projects/${projectId}/annotations`, {
        method: "POST",
        credentials: "include",
        body: form,
      });
      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }
      console.log("Annotation created/updated:", timestamp, newMessage);
    } catch (error) {
      console.error("Error creating/updating annotation:", timestamp, error);
    }
  }

  async function getAnnotation(timestamp) {
    try {
      const url =
        "/api/projects/" + projectId + "/annotations?timestamp=" + timestamp;
      const response = await fetch(url, {
        method: "GET",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }

      const data = await response.json();
      return data.text || "";
    } catch (error) {
      console.error("Error fetching annotation:", timestamp, error);
      return "";
    }
  }

  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      const url = await getAnnotatedVideoUrl(projectId);
      if (cancelled) return;
      setVideoUrl(url);
      setIsLoading(false);
    };

    init();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);
  // Get video duration once video is loaded
  useEffect(() => {
    const video = videoPlayerRef.current;
    if (!video) return;

    const handleLoadedMetadata = () => {
      if (video.duration && isFinite(video.duration)) {
        setVideoLength(video.duration);
      }
    };

    video.addEventListener("loadedmetadata", handleLoadedMetadata);

    // Also check if metadata is already loaded
    if (video.readyState >= 1 && video.duration && isFinite(video.duration)) {
      setVideoLength(video.duration);
    }

    return () => {
      video.removeEventListener("loadedmetadata", handleLoadedMetadata);
    };
  }, [videoUrl]);

  const getCurrentStartClipTimeStamp = () => {
    if(newClipStatus === 1){
        return calculateTimeStamp(newClipObj.start || 0);
    } else if(newClipStatus === 2){
        return calculateTimeStamp(newClipObj.end || videoLength);
    }
    if (currentClipId === undefined) {
      return 0;
    }
    const clip = clips.get(currentClipId);
    if (!clip) {
      return 0;
    }
    return calculateTimeStamp(clip.start);
  };

  const getCurrentEndClipTimeStamp = () => {
    if(newClipStatus !== 0){
        return videoLength;
    }
    if (currentClipId === undefined) {
      return videoLength;
    }
    const clip = clips.get(currentClipId);
    if (!clip) {
      return videoLength;
    }
    return calculateTimeStamp(clip.end);
  };

  function mirror() {
    const isCurrentlyMirrored = isMirrored;
    setIsMirrored(!isCurrentlyMirrored);
    const videoRef = videoPlayerRef.current;
    if (isCurrentlyMirrored) {
      videoRef.classList.remove("mirrored");
    } else {
      videoRef.classList.add("mirrored");
    }
  }

  const renderClip = (clip, id) => {
    const height = clip.row == 0 ? 40 : 10;
    const top = clip.row == 0 ? 2.5 : 44 + (clip.row - 1) * 11;
    const width = (clip.end - clip.start) * (19 / 20);
    const left = clip.start * (19 / 20) + 2.5;
    // eslint-disable-next-line jsx-a11y/no-static-element-interactions
    if(id == currentClipBeingDraggedId.charAt(0)){
      return (
        <>
          <div
            style={{
              position: "absolute",
              bottom: `${top * 2}px`,
              height: `${height * 2}px`,
              left: `${left}%`,
              width: `${width}%`,
            }}
            key={id}
            role="button"
            onClick={handleClick}
            data-clip-id={id}
            tabIndex={id + 1}
            onKeyDown={(e) => handleKeyDown(e, id)}
            onDoubleClick={() => {
              handleResize(id);
            }}
            onMouseDown={mouseDownOnClip(id)}
            className="clip"
          ></div>
          {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions */}
          <div
            className="handle handle-left"
            style={{
              bottom: `${top * 2 - 3}px`,
              left: `${left}%`,
            }}
            onMouseDown={mouseDownOnHandle("left")}
          />
          {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions */}
          <div
            className="handle handle-right"
            style={{
              bottom: `${top * 2 - 3}px`,
              left: `${left + width - 0.4}%`,
            }}
            onMouseDown={mouseDownOnHandle("right")}
          />
        </>
      );
    }
    return (
      <>
        <div
          style={{
            position: "absolute",
            bottom: `${top * 2}px`,
            height: `${height * 2}px`,
            left: `${left}%`,
            width: `${width}%`,
          }}
          key={id}
          role="button"
          onClick={handleClick}
          data-clip-id={id}
          tabIndex={id + 1}
          onKeyDown={(e) => handleKeyDown(e, id)}
          onDoubleClick={() => handleResize(id)}
          className="clip"
        >
        </div>
      </>
    );
  };

  const handleClick = (e) => {
    // const clipClicked = e.currentTarget.getBoundingClientRect();
    // const mouseX = e.clientX;
    // const clipX = clipClicked.x;
    // const clipWidth = clipClicked.width;
    const clipId = parseInt(e.currentTarget.dataset.clipId, 10);
    // const clip = clips.get(clipId);
    setCurrentClipId(clipId);
    // const clipStart = clip.start;
    // const clipEnd = clip.end;
    // // calculatePercent(clipStart, clipEnd, clipX, clipWidth, mouseX);
    // const width = clipClicked.width;
    // const relativeX = e.clientX - clipClicked.left; // Position within the element
  };

  const handleKeyDown = (e, clipId) => {
    const buttonPressed = e.key;
    if (buttonPressed == "Enter") {
      setCurrentClipBeingDraggedId("xx");
      setCurrentClipId();
      document.activeElement.blur();
      return;
    }
    if (buttonPressed !== "ArrowRight" && buttonPressed !== "ArrowLeft") {
      return;
    }
    if (clipId != currentClipBeingDraggedId.charAt(0)) {
      return;
    }
    if (buttonPressed == "ArrowRight") {
      moveRight();
    } else {
      moveLeft();
    }
  };

  const handleResize = (clipId, isLeft = true) => {
    if (clipId === 0) {
      console.warn("cannot resize main clip");
      return;
    }
    setResizing(true);
    if (isLeft) {
      setCurrentClipBeingDraggedId(clipId + "l");
    } else {
      setCurrentClipBeingDraggedId(clipId + "r");
    }
  };

  function addClip(start, end, map, clipId) {
    console.log(start, end)
    const targetMap = map || clips; //this just allows us to pass an arbitrary map if desired
    let clipEntries = [...targetMap.entries()];
    outerLoop: for (let i = 1; i < MAX_ROW; i++) {
      let clipsInIthRow = clipEntries.filter(isInRow(i));
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      for (let [_, clip] of clipsInIthRow) {
        if (clip.start < end + 1 && start < clip.end + 1) {
          continue outerLoop;
        }
      }
      let newClips = new Map(targetMap);
      if (map === undefined) {
        newClips.set(nextClipId, { row: i, start: start, end: end });
        nextClipId++;
      } else {
        newClips.set(clipId, { row: i, start: start, end: end });
        //console.log(newClips)
      }
      setClips(newClips);
      return;
    }
    return null;
  }

  useEffect(() => {
    if(!isDragging) return
    const handleMouseMoving = (e) => {
      console.table({
        dragInitStart: dragInitStart.current,
        dragInitEnd: dragInitEnd.current,
        dragInitX: dragInitX.current,
        dragInitWidth: dragInitWidth.current,
        clientX: e.clientX
      });
      const newPercent = calculatePercent(dragInitStart.current, dragInitEnd.current, dragInitX.current, dragInitWidth.current, e.clientX)
      const clipId = parseInt(currentClipBeingDraggedId.charAt(0), 10);
      const oldClip = clips.get(clipId);
      let newClips = new Map(clips);
      newClips.delete(clipId);
      let start = oldClip.start;
      let end = oldClip.end;
      let resizedClip;
      if (isDragging.type === "left") {
        let deltaPercent = newPercent - start;
        resizedClip = handleMoveLeft(deltaPercent);
      } else if (isDragging.type === "right") {
        let deltaPercent = newPercent - end;
        resizedClip = handleMoveRight(deltaPercent);
      } else if (isDragging.type === "move") {
        let deltaPercent = newPercent - dragInitPercent.current;
        resizedClip = handleDrag(deltaPercent)
      } else {
        return
      }
      addClip(resizedClip.start, resizedClip.end, newClips, clipId);
    }
  
    const handleMouseUp = () => {
      setIsDragging(null)
    }

    window.addEventListener('mousemove', handleMouseMoving)
    window.addEventListener('mouseup', handleMouseUp)

    return () => {
      window.removeEventListener('mousemove', handleMouseMoving)
      window.removeEventListener('mouseup', handleMouseUp)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDragging])

  const mouseDownOnHandle = (side) => (e) => {
    initializeDrag(side, e)
  }

  const mouseDownOnClip = (clipId) => (e) => {
    const activeClipId = parseInt(currentClipBeingDraggedId.charAt(0), 10);
    if (activeClipId === clipId && !e.target.closest('.handle')) {
      initializeDrag('move', e)
    }
  }

  const initializeDrag = (type, e) => {
    e.preventDefault();
    const clipId = parseInt(currentClipBeingDraggedId.charAt(0), 10);
    const clip = clips.get(clipId)
    if (!clip) return
    setIsDragging({ clipId, type })
    dragInitX.current = e.clientX
    dragInitStart.current = clip.start
    dragInitEnd.current = clip.end
    let target = e.currentTarget
    if(type === 'left'){
      target = target.previousElementSibling
    }
    else if(type === 'right'){
      target = target.previousElementSibling.previousElementSibling
    }
    console.log(target)
    dragInitWidth.current = target.getBoundingClientRect().width;
    dragInitX.current = target.getBoundingClientRect().left;
    dragInitPercent.current = calculatePercent(clip.start, clip.end, dragInitX.current, dragInitWidth.current, e.clientX)
  };

  const handleMoveLeft = (deltaPercent) => {
    const clipId = parseInt(currentClipBeingDraggedId.charAt(0), 10);
    const clip = clips.get(clipId)
    if (!clip){
      console.warn("moveLeft failed")
      return
    }
    let desiredNewStart = clip.start + deltaPercent
    const actualNewStart = Math.min(Math.max(0, desiredNewStart), clip.end - MIN_CLIP_SIZE)
    return {'start': actualNewStart, 'end': clip.end}
  }

  const handleMoveRight = (deltaPercent) => {
    const clipId = parseInt(currentClipBeingDraggedId.charAt(0), 10);
    const clip = clips.get(clipId)
    if (!clip){
      console.warn("moveRight failed")
      return
    } 
    let desiredNewEnd = clip.end + deltaPercent
    const actualNewEnd = Math.max(Math.min(100, desiredNewEnd), clip.start + MIN_CLIP_SIZE)
    return {'start': clip.start, 'end': actualNewEnd}
  }

  const handleDrag = (deltaPercent) => {
    const clipId = parseInt(currentClipBeingDraggedId.charAt(0), 10);
    const clip = clips.get(clipId);
    if (!clip) {
      console.warn("drag failed");
      return;
    }
    if(clip.start + deltaPercent < 0){
      console.log("pushing to the left")
      return { start: 0, end: clip.end - clip.start}
    } else if(clip.end + deltaPercent > 100){
      actualDelta = 100 - clip.end;
      return {start: clip.start + actualDelta, end: 100}
    }
    return {start: clip.start + deltaPercent, end: clip.end + deltaPercent}
  }

  const moveLeft = () => {
    // console.log(clips)
    if (!resizing) {
      return;
    }
    const clipId = parseInt(currentClipBeingDraggedId.charAt(0), 10);
    const side = currentClipBeingDraggedId.charAt(1);
    const oldClip = clips.get(clipId);
    let newClips = new Map(clips);
    newClips.delete(clipId);
    if (side == "l") {
      let newStart = oldClip.start - 1;
      if (newStart < 0) {
        newStart = 0;
      }
      addClip(newStart, oldClip.end, newClips, clipId);
    } else {
      const newEnd = oldClip.end - 1;
      if (newEnd <= oldClip.start) {
        return;
      }
      addClip(oldClip.start, newEnd, newClips, clipId);
    }
  };

  const moveRight = () => {
    if (!resizing) {
      return;
    }
    const clipId = parseInt(currentClipBeingDraggedId.charAt(0), 10);
    const side = currentClipBeingDraggedId.charAt(1);
    const oldClip = clips.get(clipId);
    let newClips = new Map(clips);
    newClips.delete(clipId);
    if (side == "l") {
      const newStart = oldClip.start + 1;
      if (newStart >= oldClip.end) {
        return;
      }
      addClip(newStart, oldClip.end, newClips, clipId);
    } else {
      const newEnd = oldClip.end + 1;
      if (newEnd > 100) {
        return;
      }
      addClip(oldClip.start, newEnd, newClips, clipId);
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleDelete = () => {
    if (currentClipId === undefined) {
      return;
    }
    if (currentClipId == 0) {
      console.warn("cannot delete main clip");
      return;
    }
    let newClips = new Map(clips);
    newClips.delete(currentClipId);
    setClips(newClips);
  };

  const calculatePercent = (clipStart, clipEnd, clipX, clipWidth, newX) => {
    const pixelPerPerecent = clipWidth / (clipEnd - clipStart);
    const pixelZero = clipX - clipStart * pixelPerPerecent;
    const desiredPercent = (newX - pixelZero) / pixelPerPerecent;
    return desiredPercent;
  };

  const calculateTimeStamp = (percentOfVideo) => {
    return (percentOfVideo * videoLength) / 100;
  };

  function handleEnterLearningMode() {
    setIsLearningMode(true);
  }

  function exitLearningMode() {
    setIsLearningMode(false);
    // Reset video to start of clip
    if (videoPlayerRef.current) {
      videoPlayerRef.current.currentTime = getCurrentStartClipTimeStamp();
    }
  }

  async function getAnnotatedVideoUrl(currentProjectId) {
    if (user == null) {
      return null;
    }
    try {
      const response = await fetch(
        `/api/projects/${currentProjectId}/video-with-landmarks`,
        {
          method: "GET",
          credentials: "include", //JP: This is the change needed to make auth stuff work for fetching the project by projectid and using auth for current user, just gotta pass credentials along workflow
        }
      );
      console.log("fetching annotated video for project id ", currentProjectId);
      if (response.status === 403) {
        console.warn(
          "Access forbidden: project does not belong to current user. Redirecting to library."
        );
        navigate("/");
        return null;
      }
      if (!response.ok) {
        console.error(
          "Failed to fetch annotated video URL, status:",
          response.status
        );
        return null;
      }
      const contentType = response.headers.get("content-type") || "";
      if (!contentType.startsWith("video/")) {
        console.error("server returned non-video content-type:", contentType);
        return null;
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      console.log("Fetched annotated video URL:", url);
      return url;
    } catch (error) {
      console.error("Error fetching annotated video URL:", error);
      return null;
    }
  }

  useEffect(() => {
    const onFsChange = () => {
      const fsEl =
        document.fullscreenElement || document.webkitFullscreenElement;
      const playerContainer = document.getElementById("projectViewVideoPlayer");
      const isPlayerFullscreen = !!(
        fsEl &&
        playerContainer &&
        playerContainer.contains(fsEl)
      );

      if (isPlayerFullscreen && !isLearningMode) {
        setIsLearningMode(true);
      }
    };

    document.addEventListener("fullscreenchange", onFsChange);
    document.addEventListener("webkitfullscreenchange", onFsChange);
    return () => {
      document.removeEventListener("fullscreenchange", onFsChange);
      document.removeEventListener("webkitfullscreenchange", onFsChange);
    };
  }, [isLearningMode]);

  useEffect(() => {
    if (currentClipId === 0 || currentClipId === undefined) {
      setAnnotationText("");
      return;
    }
    const fetchAnnotation = async () => {
      const text = await getAnnotation(getCurrentStartClipTimeStamp());
      setAnnotationText(text);
    };
    fetchAnnotation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentClipId]);

  const clip = () =>{
    setNewClipStatus(1);
    setNewClipObj({'start': 0, 'end': 100});
  }

  const handleKeyDownNewClip = (e) =>{
    const buttonPressed = e.key
    if(buttonPressed == 'Enter'){
        console.log("entering!!!");
        let newNewClipStatus = (newClipStatus + 1) % 3;
        setNewClipStatus(newNewClipStatus);
        if(newNewClipStatus == 0){
            addNewClip();
        }
    }
    else if(buttonPressed == 'ArrowRight'){
      if(newClipStatus === 1){ //setting the left side
        const newStart = Math.min(newClipObj.end-1, newClipObj.start+1);
        let newNewClipObj = structuredClone(newClipObj);
        newNewClipObj.start = newStart;
        setNewClipObj(newNewClipObj);
      } else{ //setting the right side
        const newEnd = Math.min(newClipObj.end+1, 100);
        let newNewClipObj = structuredClone(newClipObj);
        newNewClipObj.end = newEnd;
        setNewClipObj(newNewClipObj);
      }
    } else if(buttonPressed == 'ArrowLeft'){
      if(newClipStatus === 1){ //setting the left side
        const newStart = Math.max(newClipObj.start-1, 0);
        let newNewClipObj = structuredClone(newClipObj);
        newNewClipObj.start = newStart;
        setNewClipObj(newNewClipObj);
      } else{ //setting the right side
        const newEnd = Math.max(newClipObj.end-1, newClipObj.start+1);
        let newNewClipObj = structuredClone(newClipObj);
        newNewClipObj.end = newEnd;
        setNewClipObj(newNewClipObj);
      }
    } else{
      //do nothing
    }
  }

  const addNewClip = () =>{
    setNewClipStatus(0);
    addClip(newClipObj.start, newClipObj.end);
  }

  const handleBlurNewClip = () =>{
    if(newClipStatus !== 2){
      setNewClipStatus(0);
      return;
    }
    addNewClip();
  }

  useEffect(() =>{
    if(newClipStatus !== 0){
      newClipRef.current?.focus();
    }
  }, [newClipStatus])

  const renderNewClip = () =>{
    if(newClipStatus === 0){
      return;
    }
    const height = 45;
    const top = 0;
    const width = ((newClipObj.end - newClipObj.start) * (19/20))
    const left = (newClipObj.start * (19/20))+2.5
    //eslint-disable-next-line jsx-a11y/no-static-element-interactions
    return <div style={{
      "position": 'absolute',
      "bottom": `${top*2}px`,
      "height": `${height*2}px`,
      "left": `${left}%`,
      "width": `${width}%`
      //eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex, jsx-a11y/tabindex-no-positive
    }} ref={newClipRef} id={"newClip"} tabIndex={32767} onKeyDown={(e) => handleKeyDownNewClip(e)} className='clip newClip' onBlur={handleBlurNewClip}></div>
  }


  return (
    <div
      id="projectView"
      className={isLearningMode ? "learning-mode-active" : ""}
    >
      {!isLearningMode && (
        <>
          <div id="projectViewEditor">
            <div id="projectViewToolbar">
              <button
                id="backToLibraryBtn"
                onClick={() => navigate("/")}
                onKeyDown={(e) => {
                  if (e.key == "Enter" || e.key == " ") {
                    e.preventDefault();
                    navigate("/");
                  }
                }}
              >
                <FiArrowLeft />
              </button>
              <button
                id="scissorsHolder"
                onClick={clip}
                onKeyDown={(e) => {
                  if (e.key == "Enter" || e.key == " ") {
                    e.preventDefault();
                    clip(e);
                  }
                }}
              >
                <FiScissors />
              </button>
              <button
                id="mirrorHolder"
                onClick={mirror}
                onKeyDown={(e) => {
                  if (e.key == "Enter" || e.key == " ") {
                    e.preventDefault();
                    mirror(e);
                  }
                }}
              >
                <GoMirror />
              </button>
              <button
                id="deleteHolder"
                onClick={handleDelete}
                disabled={currentClipId === undefined || currentClipId === 0}
                onKeyDown={(e) => {
                  if (e.key == "Enter" || e.key == " ") {
                    e.preventDefault();
                    handleDelete();
                  }
                }}
                title={
                  currentClipId === undefined || currentClipId === 0
                    ? "Select a clip to delete"
                    : "Delete selected clip"
                }
              >
                <FiTrash2 />
              </button>{" "}
              <button
                id="learningModeBtn"
                onClick={handleEnterLearningMode}
                disabled={currentClipId === 0}
                title={
                  currentClipId === 0
                    ? "Select a clip first"
                    : "Enter Learning Mode"
                }
              >
                Learning Mode
              </button>
            </div>

            <div id="projectViewVideoPlayer">
              {isLoading ? (
                <p>Loading video...</p>
              ) : (
                <CustomVideoPlayer
                  ref={videoPlayerRef}
                  url={videoUrl}
                  start={getCurrentStartClipTimeStamp()}
                  end={getCurrentEndClipTimeStamp()}
                ></CustomVideoPlayer>
              )}
            </div>
          </div>
          <div id="projectViewFooter">
            {Array.from(clips).map(([id, clip]) => renderClip(clip, id))}
            {renderNewClip()}
            <AnnotationPanel headerText="Notes">
              <div className="annotation-content">
                <h2>Annotations</h2>
                {currentClipId === 0 ? (
                  <p>Select a clip to add annotations</p>
                ) : (
                  <textarea
                    value={annotationText}
                    onChange={(e) => setAnnotationText(e.target.value)}
                    onBlur={() =>
                      handleAnnotationChange(
                        getCurrentStartClipTimeStamp(),
                        annotationText
                      )
                    }
                    placeholder="Add notes about this clip..."
                    onClick={(e) => e.stopPropagation()}
                  />
                )}
              </div>
            </AnnotationPanel>
          </div>
        </>
      )}

      {/* Learning Mode Component - Full-screen practice with webcam */}
      {isLearningMode && (
        <LearningMode
          videoUrl={videoUrl}
          startTime={getCurrentStartClipTimeStamp()}
          endTime={getCurrentEndClipTimeStamp()}
          onExit={exitLearningMode}
        />
      )}
    </div>
  );
};

export default ProjectView;
