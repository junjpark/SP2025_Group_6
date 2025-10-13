import React, {useState} from 'react';
import { useNavigate } from 'react-router-dom';
import "./ProjectThumbnail.css";

export default function ProjectThumbnail({ id, title, imageUrl, isCreate, route, onCreateClick}) {
    const navigate = useNavigate();
    const handleClick = () => {
        if (isCreate) {
            onCreateClick();
        } else if (id) {
            navigate(`/projects/${id}`);
        }
    }
    const thumbnail = (
        <button 
            className="project-thumbnail"
            key={id} onClick={handleClick}
            aria-label={isCreate ? "Create new project" : `Open ${title}`} 
            onKeyDown={(e) => {
                if (e.key === "o") {
                    handleClick();
                }
            }}>
            {isCreate ? (
                <div className="create-thumbnail">
                    <span className="plus-icon">+</span>
                    
                </div>
                ) : (
                <>
                    <img src={imageUrl} alt={title} className="thumbnail-image" />
                </>
                )}
            <h3 className="project-title">{title}</h3>
        </button>
    );
    return thumbnail;
}