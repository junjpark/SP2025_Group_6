import { useRef } from 'react';

function Clip({clipId, onClick}){ //lowkey this component does not need to exist its a f------ button who wrote this
    const clipDiv = useRef(null);
    
    function handleClick(e){
        e.stopPropagation();
        onClick(clipId, clipDiv.current);
    }

    return (<>
        <button 
            ref={clipDiv} 
            className="clip" 
            onClick={(e) => {handleClick(e)}}
        >
            {clipId}
        </button>
    </>)
};

export default Clip;