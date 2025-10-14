import React, { useState, useEffect } from 'react';
import ProjectThumbnail from '../../components/ProjectThumbnail/ProjectThumbnail';
import "./Library.css";
import snoopy from "../../snoopy-dancing.jpg";
import ProjectView from '../Project/ProjectView'
import CreateNewModal from '../../components/CreateNewModal/CreateNewModal';
import { useNavigate } from 'react-router-dom';

export default function Library() {
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const navigate = useNavigate();
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchProjects = async () => {
            try {
                setLoading(true);
                const res = await fetch('/api/project-list', { credentials: 'include' });
                if (!res.ok) throw new Error(`Failed to fetch projects: ${res.status}`);
                const data = await res.json();
                // Map backend fields to frontend-friendly structure
                const mapped = data.map(p => ({ id: p.id, title: p.title, imageUrl: p.thumbnail_url }));
                // Prepend the create tile
                setProjects([{ id: 0, title: 'Create New', isCreate: true }, ...mapped]);
            } catch (err) {
                console.error(err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchProjects();
    }, []);

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
                {loading ? (
                    <p>Loading projects...</p>
                ) : error ? (
                    <p>Error loading projects: {error}</p>
                ) : (
                    projects.map((project) => (
                        <ProjectThumbnail
                            key={project.id}
                            id={project.id}
                            title={project.title}
                            imageUrl={project.imageUrl || snoopy}
                            isCreate={project.isCreate}
                            onCreateClick={() => setIsCreateModalOpen(true)}
                        />
                    ))
                )}
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