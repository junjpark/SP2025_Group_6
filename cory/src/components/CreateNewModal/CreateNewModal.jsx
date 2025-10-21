import React, { useState } from "react";
import "./CreateNewModal.css";

export default function CreateNewModal({ isOpen, onClose, onCreate }) {
  const [projectName, setProjectName] = useState("");
  const [videoFile, setVideoFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);

  const handleVideoChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith("video/")) {
      setVideoFile(file);
    } else {
      alert("Please upload a valid video file.");
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("video/")) {
      setVideoFile(file);
    } else {
      alert("Please upload a valid video file.");
    }
  };

  const handleSubmit = async () => {
    if (!projectName) {
      alert("Project name is required.");
      return;
    }
    if (!videoFile) {
      alert("Please upload a video file.");
      return;
    }

    //const token = localStorage.getItem('token');

    const data = new FormData();
    data.append("title", projectName);
    data.append("video", videoFile);
    try {
      const response = await fetch(`/api/projects`, {
        method: "POST",
        credentials: "include", // include session cookie so backend can set user_id
        body: data,
      });
      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }
      const result = await response.json();
      console.log("Project created:", result);
      onCreate(result.id);
    } catch (error) {
      console.error("Error creating project:", error);
    } finally {
      setProjectName("");
      setVideoFile(null);
    }
  };

  const removeVideo = () => {
    setVideoFile(null);
  };

  const handleOverlayKeydown = (e) => {
    if (e.key === "Escape") {
      onClose();
    }
  };

  return isOpen ? (
    <div
      className="modal-overlay"
      onClick={onClose}
      onKeyDown={handleOverlayKeydown}
      tabIndex={0}
      role="button"
    >
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleOverlayKeydown}
        tabIndex={0}
        role="button"
      >
        <h2 className="modal-header">New Project</h2>
        <div className="project-name-section">
          <label htmlFor="project-name-input">Project Name</label>
          <input
            type="text"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            placeholder="Enter project name"
            className="name-input"
          />
        </div>
        <div className="video-upload-section">
          <label htmlFor="video-upload">Upload Video</label>
          {!videoFile ? (
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              className={`upload-area ${dragActive ? "drag-active" : ""}`}
            >
              <input
                type="file"
                accept="video/*"
                onChange={handleVideoChange}
                className="video-input"
                id="video-upload"
                aria-label="Upload video file"
              />
              <label htmlFor="video-upload" className="upload-label">
                <p className="drag-drop">Drag & Drop your video here</p>
                <p className="or">or</p>
                <span className="browse-button">Browse Files</span>
              </label>
            </div>
          ) : (
            <div className="video-info">
              <p>{videoFile.name}</p>
              <p>{(videoFile.size / (1024 * 1024)).toFixed(2)} MB</p>
              <button onClick={removeVideo} className="remove-video-button">
                Remove
              </button>
            </div>
          )}

          <div className="modal-actions">
            <button onClick={onClose} className="cancel-button">
              Cancel
            </button>
            <button onClick={handleSubmit} className="create-button">
              Create
            </button>
          </div>
        </div>
      </div>
    </div>
  ) : null;
}
