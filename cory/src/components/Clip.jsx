import { useRef } from 'react';

function Clip({start, end, clipId, onClick}){
    const clipDiv = useRef(null);
    
    function handleClick(e){
        e.stopPropagation();
        onClick(start,end, clipId, clipDiv.current);
    }

    return (<>
        <button 
            ref={clipDiv} 
            className="clip" 
            onClick={(e) => {handleClick(e)}}
        >
            {start}
        </button>
    </>)
};

export default Clip;