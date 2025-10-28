import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./ProjectThumbnail.css";
import snoopy from "../../snoopy-dancing.jpg";

export default function ProjectThumbnail({
  id,
  title,
  thumbnailEndpoint,
  isCreate,
  onCreateClick,
  onDelete,
  onRename,
}) {
  const navigate = useNavigate();
  const [imgSrc, setImgSrc] = useState(null);
  const [showMenu, setShowMenu] = useState(false);
  const [titleValue, setTitle] = useState(title);
  useEffect(() => {
    let isMounted = true;
    let objectUrl = null;
    if (!thumbnailEndpoint) {
      setImgSrc(snoopy);
      return;
    }

    async function fetchThumbnail() {
      try {
        const res = await fetch(thumbnailEndpoint, {
          credentials: "include",
        });
        if (!res.ok) {
          throw new Error(`Failed to fetch thumbnail: ${res.status}`);
        }
        const blob = await res.blob();
        objectUrl = URL.createObjectURL(blob);
        if (isMounted) {
          setImgSrc(objectUrl);
          console.log("Thumbnail fetched:", objectUrl);
        }
      } catch (err) {
        console.error("Error fetching thumbnail:", err);
        setImgSrc(null);
      }
    }

    fetchThumbnail();

    return () => {
      isMounted = false;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [thumbnailEndpoint]);

  const handleClick = () => {
    if (isCreate) {
      onCreateClick();
    } else if (id) {
      navigate(`/projects/${id}`);
    }
  };

  const handleDotsClick = (e) => {
    e.stopPropagation();
    setShowMenu(!showMenu);
  };

  const handleCloseMenu = () => {
    setShowMenu(false);
  };

  const handleDeleteProject = async (e) => {
    e.stopPropagation();
    if (window.confirm("Are you sure you want to delete this project?")) {
      console.log(`Delete project with ID: ${id}`);
      try {
        const response = await fetch(`/api/projects/${id}`, {
          method: "DELETE",
          credentials: "include",
        });
        if (!response.ok) {
          throw new Error(`Server returned ${response.status}`);
        }
        onDelete(id);
        console.log("Project deleted:", id);
      } catch (error) {
        console.error("Error deleting project:", id);
      } finally {
        setShowMenu(false);
      }
    }
  };

  const handleRenameProject = async (e) => {
    try {
      const response = await fetch(`/api/projects/${id}/rename`, {
        method: "POST",
        body: new URLSearchParams({ new_name: titleValue }),
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }
      onRename(titleValue);
      console.log("Project renamed:", id);
    } catch (error) {
      console.error("Error renaming project:", id);
    } finally {
      setShowMenu(false);
    }
  };

  const thumbnail = (
    <button
      className="project-thumbnail"
      key={id}
      onClick={handleClick}
      aria-label={isCreate ? "Create new project" : `Open ${titleValue}`}
      onKeyDown={(e) => {
        if (e.key === "o") {
          handleClick();
        }
      }}
    >
      {isCreate ? (
        <div className="create-thumbnail">
          <span className="plus-icon">+</span>
        </div>
      ) : (
        <>
          <img src={imgSrc} alt={titleValue} className="thumbnail-image" />
        </>
      )}
      <div className="project-title-row">
        <h3 className="project-title">{titleValue}</h3>
        {!isCreate && (
          <span
            className="three-dots"
            onClick={handleDotsClick}
            tabIndex={0}
            aria-label="Project options"
          >
            &#8230;
          </span>
        )}
      </div>
      {showMenu && (
        <div className="project-menu" onClick={handleCloseMenu}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button onClick={handleDeleteProject}>Delete Project </button>
            <p>Rename Project:</p>
            <input
              type="text"
              value={titleValue}
              onChange={(e) => {
                setTitle(e.target.value);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleRenameProject();
                }
              }}
            />
          </div>
        </div>
      )}
    </button>
  );
  return thumbnail;
}
