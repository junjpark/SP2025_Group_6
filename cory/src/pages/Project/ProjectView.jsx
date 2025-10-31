import "./ProjectView.css";
import CustomVideoPlayer from "../../components/CustomVideoPlayer";
import AnnotationPanel from "../../components/AnnotationPanel/AnnotationPanel";
import Clip from "../../components/Clip";
import LearningMode from "../../components/LearningMode";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useParams, useNavigate } from "react-router-dom";
import { FiScissors } from "react-icons/fi";

const ProjectView = () => {
  const { projectId } = useParams(); //get the project id from the url
  console.log("Project ID from URL:", projectId);
  //   const API = import.meta.env.VITE_API_URL || "";

  const [videoUrl, setVideoUrl] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  //   const [videoPaused, setVideoPaused] = useState(true);

  const videoPlayerRef = useRef(null); //this allows us to see the current time of the player

  //note that clipTimings is 1-index because the currentClipId = 0 pertains to the whole video
  //time stamps are of the form [a,b)
  const [clipTimings, setClipTimings] = useState([
    [0, 5],
    [5, 13.346667],
  ]);

  const [selectedClipDiv, setSelectedClipDiv] = useState(null); //this propably can be reworked to not exist

  const [currentClipId, setCurrentClipId] = useState(0); //this is the current clip selected

  // Learning mode state - Controls full-screen learning experience
  const [isLearningMode, setIsLearningMode] = useState(false);

  //clipAnnotations are 0-index
  const [clipAnnotations, setClipAnnotations] = useState([
    "",
    "note 1",
    "note 2",
  ]); //this is not how clipAnnotations should work TODO: FIX

  const { user } = useAuth(); //this user object tells us what is going on
  {
    console.log(user.user_id);
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

  /**
   * This is a getter for the start of the selected time stamp
   * @param {int} clipId - Default is the state variable currentClip
   * @returns {int} The start time stamp of the clip
   */
  function getCurrentStartClipTimeStamp(clipId = currentClipId) {
    if (clipId == 0) {
      return 0;
    }
    return clipTimings[clipId - 1][0];
  }

  /**
   * This is a getter for the end of the selected time stamp
   * @param {int} clipId - Default is the state variable currentClip
   * @returns {int} The end time stamp of the clip
   */
  function getCurrentEndClipTimeStamp(clipId = currentClipId) {
    if (clipId == 0) {
      return 13.346667;
    }
    return clipTimings[clipId - 1][1];
  }

  /**
   * This allows the user to select a clip
   * @param {int} clipIdx - the is the 0-indexed variable for the clip
   * @param {HTML Div} divToHighlight - this is the div to highlight (TODO: maybe we can remove this)
   * @returns {void}
   */
  function selectClip(idx, divToHighlight) {
    const clipPTag = document.querySelector("#clipInfoGoesHere"); //this is the annotation
    if (selectedClipDiv != null) {
      selectedClipDiv.classList.remove("selected");
    }
    if (currentClipId == idx + 1 || divToHighlight == null) {
      //if we click on the same clip already selected or if we click off
      setCurrentClipId(0); //set the current clip to the whole video
      clipPTag.classList.add("hidden"); //there should be no annotation
      return;
    }
    //this means a new clip has been selected
    setCurrentClipId(idx + 1); //set the currentClipId to the new value
    clipPTag.classList.remove("hidden"); //show the annotation
    setSelectedClipDiv(divToHighlight); //update the state
    divToHighlight.classList.add("selected"); //add some highlighting to that clip
  }

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

  /**
   * This allows the user to cut the current clip in half here
   */
  function clip() {
    selectClip(-1, null); //TODO: discuss what to do with this currently unselects both clips
    const videoCurrentTime = videoPlayerRef.current.currentTime;
    let newClipTimings = [];
    for (const interval of clipTimings) {
      //we need to rebuild the clipTimings array
      if (videoCurrentTime >= interval[0] && videoCurrentTime < interval[1]) {
        //if the intervals intersect split it
        newClipTimings.push([interval[0], videoCurrentTime]);
        newClipTimings.push([videoCurrentTime, interval[1]]);
      } else {
        //else just push it
        newClipTimings.push([interval[0], interval[1]]);
      }
    }
    // console.log(newClipTimings)
    setClipTimings(newClipTimings);
  }

  /**
   * Enter learning mode for the currently selected clip
   */
  function handleEnterLearningMode() {
    if (currentClipId === 0) {
      alert("Please select a clip first to enter learning mode");
      return;
    }
    setIsLearningMode(true);
  }

  /**
   * Exit learning mode
   */
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

  // Enter Learning Mode when the user makes the player fullscreen
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
          {/* In order to get the click off the clip to work this needs to be clickable and per the linter must be a button */}
          <div
            id="projectViewFooter"
            role="button"
            onClick={(e) => {
              // Only deselect if clicking directly on the clips container
              if (e.target.id === "clipsContainer") {
                selectClip(-1, null);
              }
            }}
          >
            <div
              role="button"
              id="clipsContainer"
              onClick={(e) => {
                // If clicking the container background (not a clip), deselect
                if (e.target.id === "clipsContainer") {
                  selectClip(-1, null);
                }
              }}
            >
              {clipTimings.map(function (tuple, idx) {
                return (
                  <Clip
                    clipId={idx}
                    onClick={(idx, divToHighlight) => {
                      selectClip(idx, divToHighlight);
                    }}
                    key={idx}
                  ></Clip>
                );
              })}
            </div>
            <AnnotationPanel headerText="Notes">
              <div className="annotation-content">
                <h2>Annotations</h2>
                {currentClipId === 0 ? (
                  <p>Select a clip to add annotations</p>
                ) : (
                  <textarea
                    value={clipAnnotations[currentClipId]}
                    onChange={(e) =>
                      handleAnnotationChange(currentClipId, e.target.value)
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
