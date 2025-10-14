import React, { useState } from 'react';
import ProjectThumbnail from '../../components/ProjectThumbnail/ProjectThumbnail';
import "./Library.css";
import snoopy from "../../snoopy-dancing.jpg";
import ProjectView from '../Project/ProjectView'
import CreateNewModal from '../../components/CreateNewModal/CreateNewModal';
import { useNavigate } from 'react-router-dom';

export default function Library() {
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const navigate = useNavigate();
    const projects = [ //fetch from backend later
        { id: 0, title: "Create New", isCreate: true },
        { id: 1, title: "Project One", imageUrl: snoopy },
        { id: 2, title: "Project Two", imageUrl: snoopy },
        { id: 3, title: "Project Three", imageUrl: snoopy },
    ];

    // const navigateToProject = (id) => {
    //     if (!id || id === "undefined") {
    //         alert("Project ID is missing or invalid.");
    //         return;
    //     }
    //     navigate(`/projects/${id}`);
    // }

    return (
        <div className="library-container">
            <h1>Library</h1>
            <div className="projects-grid">
                {projects.map((project) => (
                    <ProjectThumbnail 
                        key={project.id} 
                        id={project.id} 
                        title={project.title} 
                        imageUrl={project.imageUrl}
                        isCreate={project.isCreate} 
                        onCreateClick={() => setIsCreateModalOpen(true)}
                    />
                ))}
            </div>

            {isCreateModalOpen && (
                <CreateNewModal 
                    isOpen={isCreateModalOpen} 
                    onClose={() => setIsCreateModalOpen(false)}
                    onCreate={(id) => {
                        console.log("Navigating to project:", id);
                        navigate(`/projects/${id}`);
                        setIsCreateModalOpen(false);
                    }}
                />
            )}
            
        </div>
    );
}
<ProjectView/>