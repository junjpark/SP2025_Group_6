import React, { useState, useEffect } from "react";
import ProjectThumbnail from "../../components/ProjectThumbnail/ProjectThumbnail";
import "./Library.css";
import ProjectView from "../Project/ProjectView";
import CreateNewModal from "../../components/CreateNewModal/CreateNewModal";
import { useNavigate } from "react-router-dom";
import Navbar from "../../components/Navbar/Navbar";
import { useAuth } from "../../contexts/AuthContext";
import Joyride from "react-joyride";

export default function Library() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterType, setFilterType] = useState("all"); // all, mine, shared
  const [sortBy, setSortBy] = useState("lastEdited"); // lastEdited, title, lastCreated
  const [runTutorial, setRunTutorial] = useState(false);

  const [projects, setProjects] = useState([
    { id: 0, title: "Create New", isCreate: true },
  ]);

  const [filteredProjects, setFilteredProjects] = useState(projects);

  const getTutorialSteps = () => {
    const steps = [
      {
        target: "body",
        content:
          "Welcome to your Library! Let's take a quick tour of the features.",
        placement: "center",
      },
      {
        target: ".create-thumbnail",
        content: "Click here to create a new project.",
      },
    ];

    const hasProjects = filteredProjects.length > 1;

    if (hasProjects) {
      steps.push({
        target: ".project-thumbnail:not(:first-child)",
        content: "Click on any project thumbnail to open and edit it.",
      });

      steps.push({
        target: ".three-dots",
        content: "Click the three dots to rename, share, or delete a project.",
      });
    }

    steps.push(
      {
        target: ".filter-bar select:first-of-type",
        content:
          "Use this dropdown to filter between all projects, your projects, or projects shared with you.",
      },
      {
        target: ".filter-bar select:last-of-type",
        content:
          "Sort your projects by last edited, date created, or alphabetically.",
      }
    );

    return steps;
  };

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
          owner: project.user_id,
          created: project.created_at,
          lastOpened: project.last_opened,
          isCreate: false,
        }));
        // Prepend the create tile
        setProjects([
          { id: 0, title: "Create New", isCreate: true },
          ...formattedProjects,
        ]);
        setFilteredProjects([
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

  useEffect(() => {
    const filterAndSortProjects = () => {
      let updatedProjects = projects.slice(1);
      if (filterType === "mine") {
        if (user) {
          updatedProjects = updatedProjects.filter(
            (project) => project.owner === user.user_id
          );
        }
      } else if (filterType === "shared") {
        if (user) {
          updatedProjects = updatedProjects.filter(
            (project) => project.owner !== user.user_id
          );
        }
      } else {
        updatedProjects = projects.slice(1);
      }
      if (sortBy === "lastCreated") {
        updatedProjects.sort(
          (a, b) => new Date(b.created) - new Date(a.created)
        );
      } else if (sortBy === "title") {
        updatedProjects.sort((a, b) => a.title.localeCompare(b.title));
      } else {
        updatedProjects.sort(
          (a, b) => new Date(b.lastOpened) - new Date(a.lastOpened)
        );
      }
      setFilteredProjects([
        { id: 0, title: "Create New", isCreate: true },
        ...updatedProjects,
      ]);
    };
    filterAndSortProjects();
  }, [filterType, sortBy, projects, user]);

  const handleDeleteProject = (id) => {
    setProjects((prev) => prev.filter((project) => project.id !== id));
  };

  const handleRenameProject = (id, newTitle) => {
    setProjects((prev) =>
      prev.map((project) =>
        project.id === id ? { ...project, title: newTitle } : project
      )
    );
  };

  const handleHelpClick = () => {
    setRunTutorial(true);
  };

  return (
    <div>
      
      <Joyride
        steps={getTutorialSteps()}
        run={runTutorial}
        continuous
        showProgress
        showSkipButton
        locale={{
          back: "Back",
          close: "Close",
          last: "Finish",
          next: "Next",
          skip: "Skip Tutorial",
        }}
        styles={{
          options: {
            primaryColor: "#7d3bf6ff",
            zIndex: 10000,
            backgroundColor: "#fff",
            overlayColor: "rgba(0, 0, 0, 0.5)",
            arrowColor: "#fff",
            textColor: "#333",
          },
          tooltip: {
            borderRadius: 12,
          },
          buttonNext: {
            borderRadius: 8,
          },
          buttonBack: {
            borderRadius: 8,
            color: "#666",
          },
        }}
        callback={(data) => {
          const { status } = data;
          if (status === "finished" || status === "skipped") {
            setRunTutorial(false);
          }
        }}
      />
      <div className="library-container">
        <h1>Library</h1>
        <div className="filter-bar">
          <p>View: </p>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="all">All Projects</option>
            <option value="mine">My Projects</option>
            <option value="shared">Shared with Me</option>
          </select>
          <p>Sort by: </p>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="lastEdited">Last Edited</option>
            <option value="lastCreated">Date Created</option>
            <option value="title">A - Z</option>
          </select>
        </div>
        <div className="projects-grid">
          {loading ? (
            <p>Loading projects...</p>
          ) : error ? (
            <p>Error loading projects: {error}</p>
          ) : (
            filteredProjects.map((project) => (
              <ProjectThumbnail
                key={project.id}
                id={project.id}
                title={project.title}
                owner={project.owner} // "me" if owned by user, email of other user if not
                created={project.created}
                thumbnailEndpoint={project.thumbnailEndpoint}
                isCreate={project.isCreate}
                onCreateClick={() => setIsCreateModalOpen(true)}
                onDelete={() => handleDeleteProject(project.id)}
                onRename={(newTitle) =>
                  handleRenameProject(project.id, newTitle)
                }
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
    </div>
  );
}
<ProjectView />;
