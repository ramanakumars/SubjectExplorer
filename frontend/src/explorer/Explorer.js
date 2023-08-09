import React, { useState, useRef, useEffect } from "react";
import MainNav from "../util/Nav.js";
import SubjectPlotter, { blue } from './SubjectPlotter'
import SubjectImages from './SubjectImages'
import { ChoosePlotType } from './PlotControl'
import { PlotConfigureHist } from './Configure'
import { FilterGroup } from './VariableFilter'
import { getSubjectsFromProject } from "../util/zoo_utils.js";
import { LoadingPage } from "../util/LoadingPage.js";

const plotly_type = { 'hist': 'histogram', 'scatter': 'scattergl' };

const filterNumericVars = (variables) => {
	var vars = [];
	for (let variable of variables) {
		if ((variable.dtype.includes('int')) | (variable.dtype.includes('float')) | (variable.dtype.includes('bool'))) {
			vars.push(variable);
		}
	}

	return vars;
}

export default function Explorer({id}) {
	const [_variables, setVariables] = useState([]);
	const [_plot_type, setPlotType] = useState("hist");
	const [_plot_variables, setPlotVariables] = useState([]);
	const [_is_plot_ready, setPlotReady] = useState(false);
	const [_subjects, setSubjects] = useState([]);
	const [_subject_count, setSubjectCount] = useState(0);
	const [_data, setData] = useState([]);
	const [_filtered_data, setFilteredData] = useState([undefined, undefined]);
	const [_layout, setLayout] = useState({});
	const [_selected_data, setSelectedData] = useState([]);
	const [_hover_data, setHoverData] = useState([]);
	const [_filters, updateFilters] = useState([]);
	const [_plot_config, setPlotConfig] = useState({});

	const loadingDiv = useRef(null);
	const filter_group = useRef(null);

	useEffect(() => {
		loadingDiv.current.enable();
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
	}, [id]);
	
	useEffect(() => {
		refreshPlot();
	}, [_data, _plot_type, _plot_variables, _subject_count, _subjects, _filters, _plot_config]);

	useEffect(() => {
		if(_filtered_data[0]) {
			if(_filtered_data[0].x.length === _filtered_data[1].length) {
				setPlotReady(true);
			}
		}
		setHoverData([]);
		setSelectedData(_filtered_data[1]);
	}, [_filtered_data])

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
		if(plot_variables.x === "") {
			return null;
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
		setPlotVariables(
			Object.fromEntries(
				Object.entries(plot_variables).map(([key, val]) => (
					[key, _variables.filter(({name }) => val.includes(name))[0]]
				))
			)
		);
	}

	const refreshPlot = () => {
        var data = {};
        var subject_data = [];

        if (_data.length===0) {
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
            let skip_row = !filter_group.current.checkMetadata(metadata);

            if (skip_row) {
                continue;
            }

            data.x.push(_data.x[i]);
			let subject = _subjects[i];
			subject_data.push({...subject});

            if ("y" in _data) {
                data.y.push(_data.y[i]);
            }
        }

        if (_plot_type === "hist") {
            var binstart = Math.floor(Math.min(...data.x));
            var binend = Math.ceil(Math.max(...data.x));
            var nbins = _plot_config.nbins;

			if(!nbins) {
				nbins = 50;
			}

            var binwidth = (binend - binstart) / nbins;

            data = { ... data,
                'xbins': { 'start': binstart, 'end': binend, 'size': binwidth },
                'nbinsx': nbins,
                'marker': { 'color': Array(nbins).fill(blue) }
            };
        } else if (_plot_type === "scatter") {
            data = { ... data,
                'marker': { 'color': Array(data.x.length).fill(blue) }
            };
        }
		
		setLayout({..._layout, 
			yaxis: {
				type: _plot_config.scale
			}
		});
		setFilteredData([data, subject_data]);
	}


	const handleHover = (data) => {
        /*
         * function that handles the change of the hover image panel when
         * hovering over the plotly component
         */
		setHoverData(data);
    }

	const handleSelect = (data) => {
        /*
         * function that handles the change of the selection image panel when
         * lasso or box selecting data in the plotly component
         */
		setSelectedData(data);
    }

	return (
			<article id="main">
				<MainNav target="explore" />
				<LoadingPage 
					ref={loadingDiv}
					enable_default={false}
					text={"Getting subject data..."}
				/>
				<section id='app'>
					<section id='plot-info'>
						<ChoosePlotType
							variables={filterNumericVars(_variables)}
							handleSubmit={createPlot}
						/>
						<FilterGroup
							ref={filter_group}
							variables={filterNumericVars(_variables)}
							onChange={() => updateFilters(Math.random())}
						/>
						{ _is_plot_ready && _plot_type === "hist" &&
							<PlotConfigureHist
								variable={_plot_variables.x}
								onChange={setPlotConfig}
							/>
						}

					</section>
					<section id='plot-container'>
						{_is_plot_ready && 
							<>
								<SubjectPlotter 
									data={[_filtered_data[0]]}
									layout={_layout}
									variables={_variables}
									plot_type={_plot_type}
									subject_data={_filtered_data[1]}
									handleHover={handleHover}
									handleSelect={handleSelect}
								/>
								<section id="images-container">
									<SubjectImages
										subject_data={_selected_data}
										render_type={"selection"}
									/>
									<SubjectImages
										subject_data={_hover_data}
										render_type={"hover"}
									/>
								</section>
							</>
						}
					</section>
				</section>
			</article>
		);
}
