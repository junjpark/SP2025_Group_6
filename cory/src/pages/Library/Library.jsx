import React, { useState, useEffect } from "react";
import ProjectThumbnail from "../../components/ProjectThumbnail/ProjectThumbnail";
import "./Library.css";
import ProjectView from "../Project/ProjectView";
import CreateNewModal from "../../components/CreateNewModal/CreateNewModal";
import { useNavigate } from "react-router-dom";

export default function Library() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [projects, setProjects] = useState([
    { id: 0, title: "Create New", isCreate: true },
  ]);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/project-list", {
          credentials: "include",
        });
        if (!res.ok) throw new Error(`Failed to fetch projects: ${res.status}`);
        const data = await res.json();
        // Map backend fields to frontend-friendly structure
        const formattedProjects = data.map((project) => ({
          id: project.id,
          title: project.title,
          thumbnailEndpoint: project.thumbnail_endpoint,
          isCreate: false,
        }));
        // Prepend the create tile
        setProjects([
          { id: 0, title: "Create New", isCreate: true },
          ...formattedProjects,
        ]);
      } catch (err) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchProjects();
  }, []);

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
              thumbnailEndpoint={project.thumbnailEndpoint}
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
<ProjectView />;
