import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, useParams } from "react-router-dom";
import "./css/main.css";
import "./css/explorer.css";
import "./css/subject.css";
import "./css/project.css";
import "./css/nav.css";
import "./css/index.css";
import MainNav from "./util/Nav.js";
import Project from "./project/Project.js"
import LoadingPage from "./util/LoadingPage.js"
import Explorer from "./explorer/Explorer";
import { getProjects, getAvatarSrc } from "./util/zoo_utils"

const root = ReactDOM.createRoot(document.getElementById("root"));

function ProjectApp() {
    const params = useParams();
    return <Project project_id={params.id} />
}

function ExploreApp() {
    const params = useParams();
    return <Explorer id={params.id} type={params.type} />
}

class ProjectButton extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            id: props.id,
            name: props.name
        };
    }

    componentDidMount = () => {
        getAvatarSrc(this.state.id).then((url) => {
            this.setState({logo: url})
        });
    }

    render() {
        return (
            <a href={"/explore/project/" + this.state.id}>
                <div className='project-button'>
                    <span>{this.state.name}</span>
                    <img src={this.state.logo} className="project-button-img" alt={this.state.name + " logo"} />
                </div>
            </a>
        )
    }
}

class Home extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            project_data: []
        };

        this.loadingDiv = React.createRef();
    }

    componentDidMount = () => {
        this.loadingDiv.current.enable();
        getProjects()
            .then((data) => {
                console.log(data);
                this.setState({
                    project_data: data
                }, this.loadingDiv.current.disable());
            });
    }

    render() {
        return (
            <article id="main">
                <MainNav />
                <LoadingPage ref={this.loadingDiv} />
                <section id="index">
                    <section id="projects">
                        {this.state.project_data.map((project) => (
                            <ProjectButton
                                key={project.id}
                                id={project.id}
                                name={project.name}
                                logo={project.logo}
                            />
                        ))}
                    </section>
                    <section id="desc">
                    </section>
                </section>
            </article>
        );
    }
}

const App = () => {
    return (
        <React.StrictMode>
            <BrowserRouter>
                <Routes>
                    <Route exact path="/" element={<Home />} />
                    <Route exact path="/project/:id" element={<ProjectApp />} />
                    <Route exact path="/explore/:type/:id" element={<ExploreApp />} />
                </Routes>
            </BrowserRouter>
        </React.StrictMode>
    );
};

root.render(<App />);
