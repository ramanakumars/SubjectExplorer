import React from "react";
import MainNav from "../util/Nav.js";
import PlotContainer, { blue } from './PlotContainer.js'
import { CreatePlotForm, ChoosePlotType, Subset, Selector, PlotConfigureHist, var_names } from './PlotControl'
import { getWorkflowData, getSubjects, getSubjectsFromProject } from "../util/zoo_utils.js";
import LoadingPage from "../util/LoadingPage.js";


export default class Explorer extends React.Component {
	/*
	 * Main explorer app. Creates the forms for choosing plot type and variables
	 * and also the subsequent display for the plot and the subject images
	 */
	constructor(props) {
		super(props);

		this.state = {
			id: props.id,
			type: props.type,
			variables: [],
			plot_type: "hist",
			plot_variables: [],
			plot_ready: false,
		};

		// create references for the child components
		this.subject_plotter = React.createRef();
		this.loadingDiv = React.createRef();
		
		// plot controllers
		this.choose_plot_form = React.createRef();
		this.variable_form = React.createRef();
		this.metadata_upload = React.createRef();
		this.plot_configurator = React.createRef();

		// filter will handle the slider for perijove filtering and
		// "vortex only" selection
		this.filter = this.filter.bind(this);
	}
	
	get_int_bool_vars = () => {
		/*
		 * get the integer (slider filter) and boolean (checkbox filter)
		 * variables and their corresponding filter data. This will be passed
		 * to the PlotContainer class to filter the plotly data
		 */
		var int_vars = {};
		var bool_vars = {};
		for (let key in this.state.variables) {
			var variable = this.state.variables[key];
			if (variable.dtype.includes('int')) {
				int_vars[key] = variable;
			}
			if (variable.dtype.includes('bool')) {
				bool_vars[key] = variable;
			}
		}

		return [int_vars, bool_vars];
	}

	filter = (update) => {
		/*
		 * driver function to get the updated data and modify the state
		 * this will then call the super filter method to update the plot
		 */
		let state = { ...this.state };
		let update_variable = update.variable;

		if (state.variables[update_variable].dtype.includes('int')) {
			state.variables[update_variable].currentMin = update.currentMin;
			state.variables[update_variable].currentMax = update.currentMax;
		} else if (state.variables[update_variable].dtype.includes('bool')) {
			state.variables[update_variable].checked = update.checked;
		}

		this.setState(state, function() {
			let vars = this.get_int_bool_vars();
			// this is handled mainly by the plotter component since that is where
			// the data is stored
			this.subject_plotter.current.filter(vars[0], vars[1]);
		});
	}

	componentDidMount = () => {
		this.loadingDiv.current.enable();
		this.loadingDiv.current.setState({ text: 'Getting subjects...' });
		if (this.state.type === "workflow") {
			getWorkflowData(this.state.id).then((data) => {
				getSubjects(this.state.id).then((subjects_data) => {
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
		} else if (this.state.type === "project") {
			getSubjectsFromProject(this.state.id).then((subjects_data) => {
				let subjects = subjects_data.subjects;
				let variables = subjects_data.variables;
				let dtypes = subjects_data.dtypes;

				this.setState({
					subjects: subjects,
					subject_count: subjects.length
				}, () => {
					this.refreshData({
						'subject_data': subjects,
						'variables': variables,
						'dtypes': dtypes
					});
					this.loadingDiv.current.disable();
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

		var variable_data = {};

		variable_data = Object.fromEntries(data.variables.map((variable) => {
			console.log('Getting info for ' + variable);
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

		// set the update variable data
		this.setState({variables: variable_data});
		this.choose_plot_form.current.setState({
			'variables': variable_data,
		});
		this.variable_form.current.setState({
			'variables': variable_data,
		});
	}

	handleSubmit = (event) => {
		/*
		 * handles the "Plot!" click by fetching the relevant
		 * data from the child component forms
		 * and sending to the backend API to retrieve the subject metadata
		 * (i.e. lat, lon, PJ, ID, url, etc.)
		 */
		event.preventDefault();

		// start building the data structure to send to the backend
		var plot_type = this.state.plot_type;

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
			layout["xaxis"] = { "title": plot_variables['x'] }
		} else if (plot_type === "scatter") {
			layout["xaxis"] = { "title": plot_variables['x'] }
			layout["yaxis"] = { "title": plot_variables['y'] }
		}

		// send to the backend
		let vars = this.get_int_bool_vars();
		this.subject_plotter.current.set_data(
			plot_variables,
			layout,
			plot_type,
			vars[0],
			vars[1]
		);
		
		this.setState({plot_variables: plot_variables, plot_ready: true});
	}
	
	handleChange = (data) => {
		this.setState({ plot_type: data.chosen, plot_ready: false});
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

	handleHistConfigure = (data) => {
		var binstart = data.binstart;
		var binend = data.binend;
		var nbins = data.nbins;
		var binwidth = (binend - binstart) / nbins;

		var new_data = {
			'xbins': { 'start': binstart, 'end': binend, 'size': binwidth },
			'nbinsx': nbins,
			'ybins': { type: data.axis_scale },
		};

		var new_layout = {
			'yaxis': {type: data.axis_scale}
		}

		this.subject_plotter.current.updatePlot(new_data, new_layout);
	}

	render() {
		document.title = "JuDE explorer";
		

		var [int_vars, bool_vars] = this.get_int_bool_vars();
		int_vars = Object.keys(int_vars);
		bool_vars = Object.keys(bool_vars);

		return (
			<article id="main">
				<MainNav target="explore" />
				<LoadingPage ref={this.loadingDiv} enable={false} />
				<section id="app">
					<section id="plot-info">
						<section id="choose-plot-container">
							<ChoosePlotType
								ref={this.choose_plot_form}
								variables={this.state.variables}
								handleChange={this.handleChange}
							/>
							<CreatePlotForm
								variables={this.state.variables}
								key={this.state.plot_type + this.state.variables}
								plot_name={this.state.plot_type}
								var_names={var_names[this.state.plot_type]}
								ref={this.variable_form}
								onSubmit={this.handleSubmit}
							/>
						</section>
						{int_vars.map((v) => (
							<Subset
								key={v + "_range"}
								variable={v}
								minValue={this.state.variables[v].minValue}
								maxValue={this.state.variables[v].maxValue}
								onChange={this.filter}
							/>
						))
						}
						{bool_vars.map((v) => (
							<Selector
								key={v + "_selector"}
								variable={v}
								checked={this.state.variables[v].checked}
								onChange={this.filter}
							/>
						))
						}
						{this.state.plot_type === "hist" && this.state.plot_ready &&
							<PlotConfigureHist
								type={this.state.plot_type}
								key={this.state.plot_type + "_" + this.state.plot_variables.x}
								onChange={this.handleHistConfigure}
								variable={this.state.plot_variables.x}
								variable_data={this.state.variables[this.state.plot_variables.x]}
								nbins={50}
							/>
						}
					</section>
					<PlotContainer ref={this.subject_plotter} />
				</section>
			</article>
		);
	}
}
