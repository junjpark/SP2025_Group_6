import { useState } from "react";
import { FiChevronLeft } from "react-icons/fi";
import "./AnnotationPanel.css";

const AnnotationPanel = ({ children, headerText = "Panel" }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const handleToggle = (e) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.stopPropagation()}
      className={`annotation-panel ${isExpanded ? "expanded" : "collapsed"}`}
      onClick={(e) => e.stopPropagation()}
    >
      <div
        className="panel-header"
        onClick={handleToggle}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleToggle(e);
          }
        }}
      >
        <FiChevronLeft className="panel-toggle-icon" />
        {!isExpanded && <span className="panel-header-text">{headerText}</span>}
      </div>
      {isExpanded && <div className="panel-content">{children}</div>}
    </div>
  );
};

export default AnnotationPanel;
