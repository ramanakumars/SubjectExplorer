import React from "react";
import LoadingPage from "../util/LoadingPage";
import MainNav from "../util/Nav";
import { getAvatarSrc, getWorkflowData, getJSONData } from "../util/zoo_utils"


export default class Project extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			project_id: props.project_id,
			workflow_data: [],
			name: "",
			logo: ""
		};

		this.loadingDiv = React.createRef();

	}

	componentDidMount = () => {
		this.getProjectData();
	}


	getProjectData = () => {
		this.loadingDiv.current.enable();

		let avatar_src = getAvatarSrc(this.state.project_id);

		getJSONData("https://www.zooniverse.org/api/projects/" + this.state.project_id)
		.then((data) => {
			let project_data = data.projects[0];
			Promise.all(project_data.links.active_workflows.map(
				async (workflow_id) => getWorkflowData(workflow_id)
					.then((w_data) => {
						return w_data;
					})
			)).then((workflow_data) => {
				Promise.resolve(avatar_src).then((avatar_src) => {
					this.setState({
						name: project_data.display_name,
						logo: avatar_src,
						workflow_data: workflow_data
					}, this.loadingDiv.current.disable());
				});
			})
		});
	}

	render() {
		return (
			<article id="main">
				<MainNav />
				<LoadingPage
					ref={this.loadingDiv}
					enable={false}
				/>

				<section id='workflow-data'>
					{this.state.workflow_data.map((data) => (
						<Workflow
							key={data.id}
							id={data.id}
							name={data.name}
							subject_sets={data.subject_sets}
							subject_count={data.subject_count}
						/>
					))}
				</section>
			</article>

		);
	}
}


class Workflow extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			id: props.id,
			name: props.name,
			subject_sets: props.subject_sets,
			subject_count: props.subject_count
		}
	}

	render() {
		return (
			<section className='workflow'>
				<h1>{this.state.name}</h1>
				<span>
					This workflow contains {this.state.subject_sets.length} subject sets
					with {this.state.subject_count} subjects
				</span>

				<span>
					<a href={"/explore/workflow/" + this.state.id + "/"} className='get-subjects'>
						Explore subjects!
					</a>

				</span>
			</section>
		)
	}
}

