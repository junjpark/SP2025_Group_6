function Clip({start, end, onClick}){
    return (<>
        <div className="clip" onClick={() => onClick(end)}></div>
    </>)
};

export default Clip;