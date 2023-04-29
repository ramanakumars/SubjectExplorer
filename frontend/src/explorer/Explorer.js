import React from "react";
import MainNav from "../util/Nav.js";
import PlotContainer from './PlotContainer.js'
import PlotControl, { var_names } from './PlotControl.js'
import { getWorkflowData, getSubjects } from "../util/zoo_utils.js";
import LoadingPage from "../util/LoadingPage.js";


class Explorer extends React.Component {
    /*
     * Main explorer app. Creates the forms for choosing plot type and variables
     * and also the subsequent display for the plot and the subject images
     */
    constructor(props) {
        super(props);

		this.state = {
			id: props.id,
			type: props.type,
			variables: []
		};

        // create references for the child components
        this.subject_plotter = React.createRef();
		this.plot_control = React.createRef();
		this.loadingDiv = React.createRef();

        // handleSubmit will handle the "Plot!" click button
        this.handleSubmit = this.handleSubmit.bind(this);

        // filter will handle the slider for perijove filtering and
        // "vortex only" selection
        this.filter = this.filter.bind(this);
    }

	componentDidMount() {
		this.loadingDiv.current.enable();
		this.loadingDiv.current.setState({text: 'Getting subjects...'});
		if (this.state.type === "workflow") {
			getWorkflowData(this.state.id).then((data) => {
				getSubjects(this.state.id).then((subjects_data) => {

					console.log(subjects_data);

					let subjects = subjects_data.subjects;
					let variables = subjects_data.variables;
					let dtypes = subjects_data.dtypes;

					this.setState({
						subjects: subjects,
						workflow_name: data.name,
						subject_sets: data.subject_sets,
						subject_count: data.subject_count
					}, () => {
						this.refreshData({
							'subject_data': subjects,
							'variables': variables,
							'dtypes': dtypes
						});
						this.loadingDiv.current.disable();
					});	
				});
			});
		}
	}

	refreshData = (data) => {
		this.subject_plotter.current.setState({
			'subject_data': data.subject_data,
			'variables': data.variables,
			'dtypes': data.dtypes
		});

		console.log(data);

		var variable_data = {};

		variable_data = Object.fromEntries(data.variables.map((variable) => {
			let var_data = {};
			var_data['dtype'] = data.dtypes[variable];

			let variable_sub = data.subject_data.map((dati) => (dati[variable]));

			var_data['minValue'] = Math.min(...variable_sub);
			var_data['maxValue'] = Math.max(...variable_sub);

			if (var_data['dtype'].includes('bool')) {
				var_data['checked'] = true;
			}
			return [variable, var_data];
		}));

		this.plot_control.current.setState({
			'variables': variable_data
		});
	}

    handleSubmit(event) {
        /*
         * handles the "Plot!" click by fetching the relevant
         * data from the child component forms
         * and sending to the backend API to retrieve the subject metadata
         * (i.e. lat, lon, PJ, ID, url, etc.)
         */
        event.preventDefault();

        // start building the data structure to send to the backend
        var plot_type = this.plot_control.current.state.chosen;

        const chosen_vars = var_names[plot_type];

        // get a list of chosen variables from the form elements
		var plot_variables = {};
        for (var i = 0; i < chosen_vars.length; i++) {
            if (event.target.elements[chosen_vars[i]].value === "") {
                return;
            }
            plot_variables[chosen_vars[i]] = event.target.elements[chosen_vars[i]].value;
        }

		var layout = {};
		layout["hovermode"] = "closest";
		layout["width"] = 1200;
		layout["height"] = 600;

		if (plot_type === "hist") {
			layout["xaxis"] = {"title": plot_variables['x']}
		} else if (plot_type === "scatter") {
			layout["xaxis"] = {"title": plot_variables['x']}
			layout["yaxis"] = {"title": plot_variables['y']}
		}

        // send to the backend
		let vars = this.plot_control.current.get_int_bool_vars();
		this.subject_plotter.current.set_data(
			plot_variables,
			layout,
			plot_type,
			vars[0],
			vars[1]
		);
    }

	handleFileUpload = (e) => {
		var data = new FormData();
		data.append('umap', e.target[0].files[0]);

        fetch("/backend/upload-umap/", {
            method: "POST",
			body: data
        }).then((result) => result.json()).then((data) => {
			// get the subject metadata and the list of variables
			// from the backend API
			this.refreshData(data);
		});
		
	}

    filter(int_vars, bool_vars) {
        /*
         * handles the perijove slider for filtering the displayed data
         */

        // this is handled mainly by the plotter component since that is where
        // the data is stored
        this.subject_plotter.current.filter(int_vars, bool_vars);
    }

    render() {
        document.title = "JuDE explorer";
        return (
            <article id="main">
                <MainNav target="explore" />
				<LoadingPage ref={this.loadingDiv} enable={false} />
                <section id="app">
					<PlotControl 
						ref={ this.plot_control }
						filter={ this.filter }
						variables={{}}
						handleFileUpload={ this.handleFileUpload }
						handleSubmit={ this.handleSubmit } 
					/>
                    <PlotContainer ref={ this.subject_plotter } />
                </section>
            </article>
        );
    }
}

export default Explorer;
