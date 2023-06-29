import React, { useState, useRef, useEffect } from "react";
import MainNav from "../util/Nav.js";
import SubjectPlotter from './SubjectPlotter'
import SubjectImages from './SubjectImages'
import { CreatePlotForm, ChoosePlotType, PlotConfigureHist, var_names } from './PlotControl'
import VariableFilter from './VariableFilter'
import { getWorkflowData, getSubjects, getSubjectsFromProject } from "../util/zoo_utils.js";
import LoadingPage from "../util/LoadingPage.js";

export const blue = "#2e86c1";
export const red = "#922b21";
const plotly_type = { 'hist': 'histogram', 'scatter': 'scattergl' };


const get_variable_index = (variable, name) => (
	variable.map((v) => ( v.name )).indexOf(name)
)

const filterNumericVars = (variables) => {
	var vars = [];
	for (let variable of variables) {
		if ((variable.dtype.includes('int')) | (variable.dtype.includes('float')) | (variable.dtype.includes('bool'))) {
			vars.push(variable);
		}
	}

	return vars;
}

export default function Explorer({id, type}) {
	const [_variables, setVariables] = useState([]);
	const [_plot_type, setPlotType] = useState("hist");
	const [_plot_variables, setPlotVariables] = useState([]);
	const [_is_plot_ready, setPlotReady] = useState(false);
	const [_subjects, setSubjects] = useState([]);
	const [_subject_count, setSubjectCount] = useState(0);
	const [_data, setData] = useState([]);
	const [_layout, setLayout] = useState({});

	const loadingDiv = useRef(null);
	const subject_images = useRef(null);
	const hover_images = useRef(null);

	useEffect(() => {
		loadingDiv.current.enable();
		loadingDiv.current.setState({ text: 'Getting subjects...' });
		getSubjectsFromProject(id).then((subjects_data) => {
			let subjects = subjects_data.subjects;
			let variables = subjects_data.variables;
			let dtypes = subjects_data.dtypes;

			setSubjects(subjects);
			setSubjectCount(subjects.length);
			setVariables(variables);
			refreshData({
				'subject_data': subjects,
				'variables': variables,
				'dtypes': dtypes
			});
			loadingDiv.current.disable();
		});
	}, [id, type]);

	const refreshData = (data) => {
		let variable_data = data.variables.map((variable) => {
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
		setVariables(variable_data);
	}

	const createPlot = (plot_type, plot_variables) => {
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

            var values = _subjects.map((data) => (
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
            var data_x = _subjects.map((data) => (
                data[plot_variables['x']]));
            var data_y = _subjects.map((data) => (
                data[plot_variables['y']]));

            data = {
                'x': data_x, 'y': data_y, 'mode': 'markers',
                'type': plotly_type[plot_type],
                'marker': { 'color': Array(data_x.length).fill("dodgerblue") }
            };
        }

		setData(data);
        setLayout(layout);
        setPlotType(plot_type);
		setPlotVariables(plot_variables);
		setPlotReady(true);
	}

	useEffect(() => {
        var data = {};
        var subject_data = [];

        if (_data.length==0) {
            return undefined;
        }

        // duplicate the plotly structure
        for (var key in _data) {
            if (key !== "x" || key !== "y") {
                data[key] = _data[key];
            }
        }

        data.marker.color = new Array(data.marker.color.length).fill(blue);

        // create the same set of variables as the original plot
        data.x = [];
        if ("y" in _data) {
            data.y = [];
        }

        // copy over the data for the given data range
        for (var i = 0; i < _subject_count; i++) {
            let metadata = _subjects[i];
            let skip_row = false;

            if (skip_row) {
                continue;
            }

            data.x.push(_data.x[i]);
			let subject = _subjects[i];
			subject_data.push({ subject_ID: subject.subject_ID, url: subject.url });

            if ("y" in _data) {
                data.y.push(_data.y[i]);
            }
        }

		console.log(data);

		/*
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
		*/
	}, [_data, _layout, _plot_type, _plot_variables]);
	
	const handleHover = (data) => {
        /*
         * function that handles the change of the hover image panel when
         * hovering over the plotly component
         */
        hover_images.current.setState({ subject_data: data, page: 0 });
    }

	const handleSelect = (data) => {
        /*
         * function that handles the change of the selection image panel when
         * lasso or box selecting data in the plotly component
         */
        subject_images.current.setState({ subject_data: data, page: 0 });
    }

	return (
			<article id="main">
				<MainNav target="explore" />
				<LoadingPage ref={loadingDiv} enable={false} />
				<section id='app'>
					<section id='plot-info'>
						<ChoosePlotType
							variables={filterNumericVars(_variables)}
							handleSubmit={createPlot}
						/>
					</section>
					<section id='plot-container'>
						{_is_plot_ready && 
							<>
								<SubjectPlotter 
									data={[_data]}
									layout={_layout}
									variables={_variables}
									plot_name={_plot_type}
									subject_data={_subjects}
									handleHover={handleHover}
									handleSelect={handleSelect}
								/>
								<section id="images-container">
									<SubjectImages
										variables={_variables}
										render_type={"selection"}
										subject_data={_subjects}
										ref={subject_images}
									/>
									<SubjectImages
										variables={_variables}
										render_type={"hover"}
										subject_data={_subjects}
										ref={hover_images}
									/>
								</section>
							</>
						}
					</section>
				</section>
			</article>
		);
}
