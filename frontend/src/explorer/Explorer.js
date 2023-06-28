import React from "react";
import MainNav from "../util/Nav.js";
// import PlotContainer, { blue } from './PlotContainer.js'
import SubjectPlotter from './SubjectPlotter'
import SubjectImages from './SubjectImages'
import { CreatePlotForm, ChoosePlotType, Subset, Selector, PlotConfigureHist, var_names } from './PlotControl'
import VariableFilter from './VariableFilter'
import { getWorkflowData, getSubjects, getSubjectsFromProject } from "../util/zoo_utils.js";
import LoadingPage from "../util/LoadingPage.js";

export const blue = "#2e86c1";
export const red = "#922b21";
const plotly_type = { 'hist': 'histogram', 'scatter': 'scattergl' };


const get_variable_index = (variable, name) => (
	variable.map((v) => ( v.name )).indexOf(name)
)

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
			subjects: [],
			subject_count: 0
		};

		// create references for the child components
		this.subject_plotter = React.createRef();
		this.subject_images = React.createRef();
		this.hover_images = React.createRef();
		this.loadingDiv = React.createRef();
		
		// plot controllers
		this.choose_plot_form = React.createRef();
		this.variable_form = React.createRef();
		this.metadata_upload = React.createRef();
		this.plot_configurator = React.createRef();
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
	
	get_int_bool_vars = () => {
		/*
		 * get the integer (slider filter) and boolean (checkbox filter)
		 * variables and their corresponding filter data. This will be passed
		 * to the PlotContainer class to filter the plotly data
		 */
		var vars = [];
		for (let key in this.state.variables) {
			let variable_data = this.state.variables[key];
			var variable = {name: key};
			if (variable_data.dtype.includes('int')) {
				variable.dtype = 'int';
			}
			if (variable_data.dtype.includes('float')) {
				variable.dtype = 'float';
			}
			if (variable_data.dtype.includes('bool')) {
				variable.dtype = 'bool';
			}
			vars.push(variable);
		}

		return vars;
	}

	filter = (update) => {
		/*
		 * driver function to get the updated data and modify the state
		 * this will then call the super filter method to update the plot
		 */
		let state = { ...this.state };
		let update_variable = get_variable_index(state.variables, update.variable);

		if (state.variables[update_variable].dtype.includes('int')) {
			state.variables[update_variable].currentMin = update.currentMin;
			state.variables[update_variable].currentMax = update.currentMax;
		} else if (state.variables[update_variable].dtype.includes('float')) {
			state.variables[update_variable].currentMin = update.currentMin;
			state.variables[update_variable].currentMax = update.currentMax;
		} else if (state.variables[update_variable].dtype.includes('bool')) {
			state.variables[update_variable].checked = update.checked;
		}

		this.setState(state, this.filter_plot);
	}

	filter_plot = () => {
        /*
         * filters the range of perijoves displayed
         * called after plotting and also when the PJ slider is changed
         */

		if (!this.state.plot_ready) {
			return;
		}

        var data = {};
        var subject_data = [];

        if (!this.state.data) {
            return null;
        }

        // duplicate the plotly structure
        for (var key in this.state.data) {
            if (key !== "x" || key !== "y") {
                data[key] = this.state.data[key];
            }
        }

        data.marker.color = new Array(data.marker.color.length).fill(blue);

        // create the same set of variables as the original plot
        data.x = [];
        if ("y" in this.state.data) {
            data.y = [];
        }

        // copy over the data for the given data range
        for (var i = 0; i < this.state.subjects.length; i++) {
            let metadata = this.state.subjects[i];
            let skip_row = false;
            for (var variable of this.state.variables) {
                if ((variable.dtype.includes('int')) || (variable.dtype.includes('float'))) {
                    if (
                        (metadata[variable.name] < variable.currentMin) || (metadata[variable.name] > variable.currentMax)
                    ) {
                        skip_row = true;
                        break;
                    }
                }
                
                if (variable.dtype.includes('bool')) {
                    if ((variable.checked) & (!metadata[variable.name])) {
                        skip_row = true;
                        break;
                    }
                }
            }

            if (skip_row) {
                continue;
            }

            data.x.push(this.state.data.x[i]);
			let subject = this.state.subjects[i];
			subject_data.push({ subject_ID: subject.subject_ID, url: subject.url });

            if ("y" in this.state.data) {
                data.y.push(this.state.data.y[i]);
            }
        }

        // refresh the plot
        this.set_plot_data(data, subject_data);	
	}
    
	set_plot_data = (data, subject_data) => {
        /*
         * sets the relevant data to the plotly component and subject image
         * display for plotting purposes
         * by default is called when the backend receives data from clicking
         * "Plot!"
         */

        // set the data for the main set of subject images at the bottom
        this.subject_images.current.setState({ subject_data: subject_data });

        // set the data for the images on hover on the right
        // by default only sets the first element of the subject list
        this.hover_images.current.setState({ subject_data: [subject_data[0]] });

        // set the data for the plotly component
        this.subject_plotter.current.setState({
            data: [data],
            layout: this.state.layout,
            subject_data: subject_data,
            plot_name: this.state.plot_name,
        });
    }

	refreshData = (data) => {
		var variable_data = {};

		variable_data = data.variables.map((variable) => {
			console.log('Getting info for ' + variable);
			let var_data = {};
			var_data.name = variable;
			var_data.dtype = data.dtypes[variable];

			let variable_sub = data.subject_data.map((dati) => (dati[variable]));

			var_data.minValue = var_data.currentMin = Math.min(...variable_sub);
			var_data.maxValue = var_data.currentMax = Math.max(...variable_sub);

			if (var_data.dtype.includes('bool')) {
				var_data.checked = true;
			}
			return var_data;
		});

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
        
		var data = {};
        if (plot_type === "hist") {
            var metadata_key = plot_variables['x']

            var values = this.state.subjects.map((data) => (
                data[metadata_key]
            ));

            var binstart = Math.floor(Math.min(...values));
            var binend = Math.ceil(Math.max(...values));
            var nbins = 50;
            var binwidth = (binend - binstart) / nbins;

            data = {
                'x': values, 'type': plotly_type[plot_type],
                'xbins': { 'start': binstart, 'end': binend, 'size': binwidth },
                'nbinsx': nbins,
                'marker': { 'color': Array(nbins).fill(blue) }
            };
        } else if (plot_type === "scatter") {
            var data_x = this.state.subjects.map((data) => (
                data[plot_variables['x']]));
            var data_y = this.state.subjects.map((data) => (
                data[plot_variables['y']]));

            data = {
                'x': data_x, 'y': data_y, 'mode': 'markers',
                'type': plotly_type[plot_type],
                'marker': { 'color': Array(data_x.length).fill("dodgerblue") }
            };
        }

        this.setState(
            {
				data: data,
                layout: layout,
                plot_name: plot_type,
				plot_variables: plot_variables,
				plot_ready: true
            },
            function() {
                this.filter_plot();
            }
        );
	}
	
	handleVariableSelect = (data) => {
		this.setState({ plot_type: data.chosen, plot_ready: false});
	}

	handleHover = (data) => {
        /*
         * function that handles the change of the hover image panel when
         * hovering over the plotly component
         */
        this.hover_images.current.setState({ subject_data: data, page: 0 });
    }

	handleSelect = (data) => {
        /*
         * function that handles the change of the selection image panel when
         * lasso or box selecting data in the plotly component
         */
        this.subject_images.current.setState({ subject_data: data, page: 0 });
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
								handleChange={this.handleVariableSelect}
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
						{this.state.variables.map((v) => (
							<VariableFilter
								key={v.name + "_filter"}
								variable={v.name}
								dtype={v.dtype}
								minValue={v.minValue}
								maxValue={v.maxValue}
								onChange={this.filter}
							/>
						))
						}
						{this.state.plot_type === "hist" && this.state.plot_ready &&
							<PlotConfigureHist
								type={this.state.plot_type}
								onChange={this.handleHistConfigure}
								variable={this.state.plot_variables.x}
								variable_data={this.state.variables[get_variable_index(this.state.variables, this.state.plot_variables.x)]}
								nbins={50}
							/>
						}
					</section>
					<section id="plotter">
						<section id="plot-container">
							<SubjectPlotter
								ref={this.subject_plotter}
								variables={[]}
								data={null}
								layout={null}
								subject_data={[]}
								handleHover={this.handleHover}
								handleSelect={this.handleSelect}
							/>
						</section>
						<section id="images-container">
							<SubjectImages
								variables={[]}
								render_type={"selection"}
								subject_data={[]}
								ref={this.subject_images}
							/>
							<SubjectImages
								variables={[]}
								render_type={"hover"}
								subject_data={[]}
								ref={this.hover_images}
							/>
						</section>
					</section>
				</section>
			</article>
		);
	}
}
