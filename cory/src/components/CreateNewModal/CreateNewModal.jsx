import React, { useState } from 'react';
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

    const handleSubmit = () => {
        if (!projectName) {
            alert("Project name is required.");
            return;
        }
        if (!videoFile) {
            alert("Please upload a video file.");
            return;
        }
        //handle create logic here
        //onCreate({ projectName, videoFile });
        setProjectName("");
        setVideoFile(null);
        //onClose();
    };

    const removeVideo = () => {
        setVideoFile(null);
    };

    return (
        isOpen ? (
            <div className="modal-overlay" onClick={onClose}>
                <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                    <h2 className="modal-header">New Project</h2>
                    <div className="project-name-section">
                      <label>Project Name</label>
                        <div className="project-name-input">
                            <input 
                                type="text"
                                value={projectName}
                                onChange={(e) => setProjectName(e.target.value)}
                                placeholder='Enter project name'
                                className="name-input"
                            />
                        </div>
                    </div>
                    <div className="video-upload-section">
                        <label>Upload Video</label>
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
                                <p>{(videoFile.size / (1024*1024)).toFixed(2)} MB</p>
                                <button onClick={removeVideo} className="remove-video-button">Remove</button>
                            </div>
                        )}

                        <div className="modal-actions">
                            <button onClick={onClose} className="cancel-button">Cancel</button>
                            <button onClick={handleSubmit} className="create-button">Create</button>
                        </div>
                    </div>
                </div>
            </div>
        ) : null
    )

}
