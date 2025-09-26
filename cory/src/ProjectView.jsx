import './ProjectView.css'
import CustomVideoPlayer from "./CustomVideoPlayer";
import Clip from './Clip';

const ProjectView = () => {

return (
<div id="projectView">
    <nav id="projectViewNav">
        <p>
            Logo Here
        </p>
    </nav>
    <div id="projectViewEditor">
        <div id="projectViewToolbar">
            Tool One
        </div>
        <div id="projectViewVideoPlayer">
            <CustomVideoPlayer></CustomVideoPlayer>
        </div>
        <div id="clipInfo">
            Clip Info
        </div>
    </div>
    <footer id="projectViewFooter">
        <Clip start={0} end={2} onClick={(e)=>{console.log(e)}}></Clip>
    </footer>
</div>
)

};

export default ProjectView;
