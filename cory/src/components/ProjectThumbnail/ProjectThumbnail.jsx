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
}) {
  const navigate = useNavigate();
  const [imgSrc, setImgSrc] = useState(null);
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
  const thumbnail = (
    <button
      className="project-thumbnail"
      key={id}
      onClick={handleClick}
      aria-label={isCreate ? "Create new project" : `Open ${title}`}
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
          <img src={imgSrc} alt={title} className="thumbnail-image" />
        </>
      )}
      <h3 className="project-title">{title}</h3>
    </button>
  );
  return thumbnail;
}
