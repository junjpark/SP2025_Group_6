import { useRef } from 'react';

function Clip({start, end, onClick}){
    const clipDiv = useRef(null);
    
    function handleClick(e){
        e.stopPropagation();
        onClick(start,end, clipDiv.current);
    }

    return (<>
        <div ref={clipDiv} className="clip" onClick={(e) => {handleClick(e)}}>{start}</div>
    </>)
};

export default Clip;