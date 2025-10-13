import React, { useState } from 'react';
import ProjectThumbnail from '../../components/ProjectThumbnail/ProjectThumbnail';
import "./Library.css";
import snoopy from "../../snoopy-dancing.jpg";
import ProjectView from '../Project/ProjectView'
import CreateNewModal from '../../components/CreateNewModal/CreateNewModal';

export default function Library() {
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const projects = [ //fetch from backend later
        { id: 0, title: "Create New", isCreate: true },
        { id: 1, title: "Project One", imageUrl: snoopy, route: "/project1" },
        { id: 2, title: "Project Two", imageUrl: snoopy },
        { id: 3, title: "Project Three", imageUrl: snoopy },
    ];
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
                        route={project.route}
                        onCreateClick={() => setIsCreateModalOpen(true)}
                    />
                ))}
            </div>

            {isCreateModalOpen && (
                <CreateNewModal 
                    isOpen={isCreateModalOpen} 
                    onClose={() => setIsCreateModalOpen(false)} 
                    onCreate={(data) => {

                    }}
                />
            )}
            
        </div>
    );
}
<ProjectView/>