import React from 'react';
import "./ProjectThumbnail.css";

export default function ProjectThumbnail({ id, title, imageUrl}) {
    const thumbnail = (
        <div className="project-thumbnail" key={id}>
            <img src={imageUrl} alt={title} className="thumbnail-image" />
            <h3 className="project-title">{title}</h3>
        </div>
    );
    return thumbnail;
}