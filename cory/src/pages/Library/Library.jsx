import React, { useState, useEffect } from "react";
import ProjectThumbnail from "../../components/ProjectThumbnail/ProjectThumbnail";
import "./Library.css";
import snoopy from "../../snoopy-dancing.jpg";
import ProjectView from "../Project/ProjectView";
import CreateNewModal from "../../components/CreateNewModal/CreateNewModal";
import { useNavigate } from "react-router-dom";

export default function Library() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [projects, setProjects] = useState([
    { id: 0, title: "Create New", isCreate: true },
  ]);
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  async function getProjects() {
    try {
      const response = await fetch("http://localhost:8000/project-list", {
        method: "GET",
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }
      const result = await response.json();
      const formattedProjects = result.map((project) => ({
        id: project.id,
        title: project.title,
        imageUrl: project.imageUrl || snoopy, //snoopy as fallback image
        isCreate: false,
      }));
      formattedProjects.unshift({ id: 0, title: "Create New", isCreate: true });
      setProjects(formattedProjects);
    } catch (error) {
      console.error("Error fetching projects:", error);
      setProjects([]);
    }
  }

  // const navigateToProject = (id) => {
  //     if (!id || id === "undefined") {
  //         alert("Project ID is missing or invalid.");
  //         return;
  //     }
  //     navigate(`/projects/${id}`);
  // }

  useEffect(() => {
    getProjects();
  }, []);

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
<ProjectView />;
