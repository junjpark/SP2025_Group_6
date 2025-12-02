import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./ProjectThumbnail.css";
import snoopy from "../../snoopy-dancing.jpg";
import { useAuth } from "../../contexts/AuthContext";
import { FiEdit2 } from "react-icons/fi";

export default function ProjectThumbnail({
  id,
  title,
  thumbnailEndpoint,
  owner,
  created,
  isCreate,
  onCreateClick,
  onDelete,
  onRename,
}) {
  const navigate = useNavigate();
  const [imgSrc, setImgSrc] = useState(null);
  const [showMenu, setShowMenu] = useState(false);
  const [titleValue, setTitle] = useState(title);
  const [emailAddress, setEmailAddress] = useState("");
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const { user } = useAuth();
  const isOwner = user && owner === user.user_id ? true : false;
  const [ownerValue, setOwnerValue] = useState("");
  const createdValue = created ? new Date(created).toLocaleString() : "Unknown";

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

  useEffect(() => {
    async function fetchOwnerEmail() {
      if (!isCreate && !isOwner) {
        try {
          const res = await fetch(`/api/users/${owner}/email`);
          if (!res.ok) {
            throw new Error(`Failed to fetch owner email: ${res.status}`);
          }
          const data = await res.json();
          setOwnerValue(data.email);
        } catch (err) {
          console.error("Error fetching owner email:", err);
        }
      }
    }
    if (isOwner) {
      setOwnerValue("You");
      return;
    }
    fetchOwnerEmail();
  }, [owner, isOwner]);

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
        console.error("Error deleting project:", id, error);
      } finally {
        setShowMenu(false);
      }
    }
  };

  const handleRenameProject = async () => {
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
      console.error("Error renaming project:", id, error);
    } finally {
      setShowMenu(false);
    }
  };

  const handleShare = async () => {
    try {
      const response = await fetch(`/api/projects/${id}/share`, {
        method: "POST",
        body: new URLSearchParams({ email: emailAddress }),
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }
      console.log("Project shared:", id);
      alert("Project shared successfully!");
    } catch (error) {
      alert("Email address not found or error sharing project.");
      console.error("Error sharing project:", id, error);
    } finally {
      setShowMenu(false);
    }
  };

  const handleSave = async () => {
    if (emailAddress !== "") {
      await handleShare();
    }
    if (titleValue !== title) {
      await handleRenameProject();
    }
    setShowMenu(false);
  };

  const thumbnail = (
    <>
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
              role="button"
              onClick={handleDotsClick}
              tabIndex={0}
              aria-label="Project options"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleDotsClick(e);
                }
              }}
            >
              &#8230;
            </span>
          )}
        </div>
      </button>

      {showMenu && (
        <div
          className="project-menu"
          onClick={handleCloseMenu}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              handleCloseMenu();
            }
          }}
        >
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "o") {
                e.stopPropagation();
              }
            }}
          >
            <div className="title-row">
              {isEditingTitle ? (
                <input
                  type="text"
                  className="title-input"
                  value={titleValue}
                  onChange={(e) => setTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleRenameProject();
                    } else if (e.key === "Escape") {
                      setIsEditingTitle(false);
                      setTitle(title); // Reset to original title
                    }
                  }}
                  onBlur={() => {
                    if (titleValue !== title) {
                      handleRenameProject();
                    } else {
                      setIsEditingTitle(false);
                    }
                  }}
                  autoFocus
                />
              ) : (
                <>
                  <h2>{titleValue}</h2>
                  {isOwner && (
                    <button
                      className="edit-title-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsEditingTitle(true);
                      }}
                      aria-label="Edit title"
                    >
                      <FiEdit2 />
                    </button>
                  )}
                </>
              )}
            </div>
            <p>Created: {createdValue}</p>
            <p>Owner: {ownerValue}</p>
            <p>Share Project:</p>
            <input
              type="text"
              placeholder="e.g. alice@example.com, bob@example.com"
              onChange={(e) => {
                setEmailAddress(e.target.value);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleShare();
                }
              }}
            />
            <div className="menu-buttons">
              {isOwner && (
                <button
                  onClick={handleDeleteProject}
                  onKeyDown={(e) => {
                    if (e.key === "d") {
                      handleDeleteProject(e);
                    }
                  }}
                  id="delete-button"
                >
                  Delete Project
                </button>
              )}
              <button
                onClick={handleSave}
                onKeyDown={(e) => {
                  if (e.key === "s") {
                    handleSave;
                  }
                }}
                id="save-button"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
  return thumbnail;
}
