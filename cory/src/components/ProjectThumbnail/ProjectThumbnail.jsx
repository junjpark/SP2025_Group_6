import React, {useState} from 'react';
import "./ProjectThumbnail.css";

export default function ProjectThumbnail({ id, title, imageUrl, isCreate}) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const handleClick = () => {
        if (isCreate) {
            setIsModalOpen(true);
        } else {
            // navigate to project view
        }
        if (isModalOpen) {
            // ppen modal here
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