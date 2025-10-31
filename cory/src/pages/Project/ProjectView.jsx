import "./ProjectView.css";
import CustomVideoPlayer from "../../components/CustomVideoPlayer";
import LearningMode from "../../components/LearningMode";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useParams, useNavigate } from "react-router-dom";
import { FiScissors, FiTrash2 } from "react-icons/fi";

let nextClipId = 3;

const ProjectView = () => {
    const { projectId } = useParams(); //get the project id from the url
    console.log("Project ID from URL:", projectId);
    const MAX_ROW = 4;
    const [videoUrl, setVideoUrl] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const isInRow = (row) => { return ([_index, clip]) => clip.row == row };
    const videoPlayerRef = useRef(null); //this allows us to see the current time of the player

    const [isMirrored, setIsMirrored] = useState(false);

    //note that clipTimings is 1-index because the currentClipId = 0 pertains to the whole video
    //time stamps are of the form [a,b)

    const [clips, setClips] = useState(new Map([
        [0, { 'row': 0, 'start': 0, 'end': 100 }],
        [1, { 'row': 1, 'start': 30, 'end': 70 }],
        [2, { 'row': 1, 'start': 0, 'end': 20 }]
    ]))

    const [selectResizing, setSelectResizing] = useState(false)
    const [resizing, setResizing] = useState(false)
    const [currentClipId, setCurrentClipId] = useState();
    const [currentClipBeingDraggedId, setCurrentClipBeingDraggedId] = useState("xx"); //be of the form "1l" or "2r" which is id and then l or r

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [videoLength, setVideoLength] = useState(13.333)
    const [isLearningMode, setIsLearningMode] = useState(false);

    const [clipAnnotations, setClipAnnotations] = useState([
        "",
        "note 1",
        "note 2",
    ]); //this is not how clipAnnotations should work TODO: FIX

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { user } = useAuth(); //this user object tells us what is going on

    /**
     * This handles when a user changes an annotation
     * @param {int} clipIdToChange - the is the 1-indexed variable for the clip
     * @param {string} newMessage - this is what to change the annotation to
     * @returns {void}
     */
    function handleAnnotationChange(clipIdToChange, newMessage) {
        let newClipAnnotations = [...clipAnnotations]; //simply copies the array
        newClipAnnotations[clipIdToChange] = newMessage; //and changes the one value we need
        setClipAnnotations(newClipAnnotations);
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

        video.addEventListener('loadedmetadata', handleLoadedMetadata);

        // Also check if metadata is already loaded
        if (video.readyState >= 1 && video.duration && isFinite(video.duration)) {
            setVideoLength(video.duration);
        }

        return () => {
            video.removeEventListener('loadedmetadata', handleLoadedMetadata);
        };
    }, [videoUrl]);

    const getCurrentStartClipTimeStamp = () => {
        if (currentClipId === undefined) {
            return 0;
        }
        const clip = clips.get(currentClipId);
        if (!clip) {
            return 0;
        }
        return calculateTimeStamp(clip.start)
    }

    const getCurrentEndClipTimeStamp = () => {
        if (currentClipId === undefined) {
            return videoLength;
        }
        const clip = clips.get(currentClipId);
        if (!clip) {
            return videoLength;
        }
        return calculateTimeStamp(clip.end)
    }

    function clip() {
        //TODO: update clip
    }

    function mirror() {
        const isCurrentlyMirrored = isMirrored;
        setIsMirrored(!isCurrentlyMirrored)
        const videoRef = videoPlayerRef.current
        if (isCurrentlyMirrored) {
            videoRef.classList.remove("mirrored")
        } else {
            videoRef.classList.add("mirrored")
        }
    }

    const renderClip = (clip, id) => {
        const height = clip.row == 0 ? 40 : 10
        const top = clip.row == 0 ? 2.5 : 44 + (clip.row - 1) * 11
        const width = ((clip.end - clip.start) * (19 / 20))
        const left = (clip.start * (19 / 20)) + 2.5
        // eslint-disable-next-line jsx-a11y/no-static-element-interactions
        return <div style={{
            "position": 'absolute',
            "bottom": `${top * 2}px`,
            "height": `${height * 2}px`,
            "left": `${left}%`,
            "width": `${width}%`
        }} key={id} onClick={handleClick} data-clip-id={id} tabIndex={id + 1} onKeyDown={(e) => handleKeyDown(e, id)} className='clip'></div>
    }

    const handleClick = (e) => {
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
        if (selectResizing) {
            if (relativeX < width / 10) {
                handleResize(clipId, true)
            } else if (relativeX > 9 * width / 10) {
                handleResize(clipId, false)
            }
        }
    }

    const handleKeyDown = (e, clipId) => {
        const buttonPressed = e.key
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
            return
        }
        if (buttonPressed == "ArrowRight") {
            moveRight();
        } else {
            moveLeft();
        }
    }

    const handleResize = (clipId, isLeft) => {
        if (clipId === 0) {
            console.warn("cannot resize main clip")
            return
        }
        setSelectResizing(false)
        setResizing(true)
        if (isLeft) {
            setCurrentClipBeingDraggedId(clipId + "l")
        } else {
            setCurrentClipBeingDraggedId(clipId + "r")
        }
    }

    function addClip(start, end, map, clipId) {
        const targetMap = map || clips; //this just allows us to pass an arbitrary map if desired
        let clipEntries = [...targetMap.entries()]
        outerLoop:
        for (let i = 1; i < MAX_ROW; i++) {
            let clipsInIthRow = clipEntries.filter(isInRow(i))
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            for (let [_, clip] of clipsInIthRow) {
                if (clip.start < end + 1 && start < clip.end + 1) {
                    continue outerLoop
                }
            }
            let newClips = new Map(targetMap)
            if (map === undefined) {
                newClips.set(nextClipId, { 'row': i, 'start': start, 'end': end })
                nextClipId++;
            } else {
                newClips.set(clipId, { 'row': i, 'start': start, 'end': end })
                //console.log(newClips)
            }
            setClips(newClips);
            return;
        }
        return null
    }

    const moveLeft = () => {
        // console.log(clips)
        if (!resizing) {
            return
        }
        const clipId = parseInt(currentClipBeingDraggedId.charAt(0), 10);
        const side = currentClipBeingDraggedId.charAt(1);
        const oldClip = clips.get(clipId);
        let newClips = new Map(clips)
        newClips.delete(clipId)
        if (side == 'l') {
            const newStart = oldClip.start - 1;
            if (newStart < 0) {
                return;
            }
            addClip(newStart, oldClip.end, newClips, clipId)
        } else {
            const newEnd = oldClip.end - 1;
            if (newEnd <= oldClip.start) {
                return;
            }
            addClip(oldClip.start, newEnd, newClips, clipId)
        }
    }

    const moveRight = () => {
        if (!resizing) {
            return
        }
        const clipId = parseInt(currentClipBeingDraggedId.charAt(0), 10);
        const side = currentClipBeingDraggedId.charAt(1);
        const oldClip = clips.get(clipId);
        let newClips = new Map(clips)
        newClips.delete(clipId)
        if (side == 'l') {
            const newStart = oldClip.start + 1;
            if (newStart >= oldClip.end) {
                return;
            }
            addClip(newStart, oldClip.end, newClips, clipId)
        } else {
            const newEnd = oldClip.end + 1;
            if (newEnd > 100) {
                return;
            }
            addClip(oldClip.start, newEnd, newClips, clipId)
        }
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const handleDelete = () => {
        if (currentClipId === undefined) {
            return;
        }
        if (currentClipId == 0) {
            console.warn("cannot delete main clip")
            return;
        }
        let newClips = new Map(clips);
        newClips.delete(currentClipId);
        setClips(newClips);
        setCurrentClipId(undefined);
    }

    const calculatePercent = (clipStart, clipEnd, clipX, clipWidth, newX) => {
        const pixelPerPerecent = clipWidth / (clipEnd - clipStart)
        const pixelZero = clipX - (clipStart * pixelPerPerecent)
        const desiredPercent = (newX - pixelZero) / pixelPerPerecent
        return desiredPercent
    }

    const calculateTimeStamp = (percentOfVideo) => {
        return percentOfVideo * videoLength / 100
    }

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
            const response = await fetch(`/api/projects/${currentProjectId}/video-with-landmarks`, {
                method: "GET",
                credentials: "include", //JP: This is the change needed to make auth stuff work for fetching the project by projectid and using auth for current user, just gotta pass credentials along workflow
            });
            console.log("fetching annotated video for project id ", currentProjectId);
            if (response.status === 403) {
                console.warn(
                    "Access forbidden: project does not belong to current user. Redirecting to library."
                );
                navigate("/");
                return null;
            }
            if (!response.ok) {
                console.error("Failed to fetch annotated video URL, status:", response.status);
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
            const fsEl = document.fullscreenElement || document.webkitFullscreenElement;
            const playerContainer = document.getElementById("projectViewVideoPlayer");
            const isPlayerFullscreen = !!(fsEl && playerContainer && playerContainer.contains(fsEl));

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

    return (
        <div id="projectView" className={isLearningMode ? "learning-mode-active" : ""}>
            {!isLearningMode && (
                <>
                    <div id="projectViewEditor">
                        <div id="projectViewToolbar">
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
                            <button id="mirrorHolder" onClick={mirror} onKeyDown={(e) => {
                                if (e.key == 'Enter' || e.key == ' ') {
                                    e.preventDefault();
                                    mirror(e);
                                }
                            }}></button>
                            <button
                                id="deleteHolder"
                                onClick={handleDelete}
                                disabled={currentClipId === undefined || currentClipId === 0}
                                onKeyDown={(e) => {
                                    if (e.key == 'Enter' || e.key == ' ') {
                                        e.preventDefault();
                                        handleDelete();
                                    }
                                }}
                                title={currentClipId === undefined || currentClipId === 0 ? "Select a clip to delete" : "Delete selected clip"}
                            >
                                <FiTrash2 />
                            </button>
                            <button
                                id="learningModeBtn"
                                onClick={handleEnterLearningMode}
                                disabled={currentClipId === 0}
                                title={currentClipId === 0 ? "Select a clip first" : "Enter Learning Mode"}
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

                        <div id="clipInfo">
                            <p>
                                Clip Info {getCurrentStartClipTimeStamp()} ,{" "}
                                {getCurrentEndClipTimeStamp()}
                            </p>
                            <textarea
                                id="clipInfoGoesHere"
                                className="hidden"
                                value={clipAnnotations[currentClipId]}
                                onChange={(e) =>
                                    handleAnnotationChange(currentClipId, e.target.value)
                                }
                            ></textarea>
                        </div>
                    </div>
                    {/* In order to get the click off the clip to work this needs to be clickable and per the linter must be a button */}
                    <div id="projectViewFooter">
                        {Array.from(clips).map(([id, clip]) => renderClip(clip, id))}
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