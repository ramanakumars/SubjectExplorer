import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, useParams } from "react-router-dom";
import "./css/main.css";
import "./css/explorer.css";
import "./css/subject.css";
import "./css/project.css";
import "./css/nav.css";
import "./css/index.css";
import MainNav from "./util/Nav.js";
import { LoadingPage } from "./util/LoadingPage.js"
import Explorer from "./explorer/Explorer";
import { getProjects, getAvatarSrc } from "./util/zoo_utils"

const root = ReactDOM.createRoot(document.getElementById("root"));

function ExploreApp() {
    const params = useParams();
    return <Explorer id={params.id} type={params.type} />
}

function ProjectButton({ id, name }) {
    const [logo, setLogo] = useState('');

    useEffect(() => {
        getAvatarSrc(id).then((url) => {
            setLogo(url);
        });
    }, [id]);

    return (
        <a href={"/explore/project/" + id}>
            <div className='project-button'>
                <span>{name}</span>
                <img src={logo} className="project-button-img" alt={name + " logo"} />
            </div>
        </a>
    )
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
                <LoadingPage 
                    ref={this.loadingDiv}
                    enable_default={false}
                    text={"Loading projects..."}
                />
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
                    <Route exact path="/explore/:type/:id" element={<ExploreApp />} />
                </Routes>
            </BrowserRouter>
        </React.StrictMode>
    );
};

root.render(<App />);
