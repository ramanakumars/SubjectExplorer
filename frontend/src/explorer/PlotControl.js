import React, { useState, useEffect } from "react";
import { Radio, Select } from "../tools/Inputs"

export const var_names = {
	hist: ["x"],
	scatter: ["x", "y"],
};

export function ChoosePlotType({ variables, handleSubmit }) {
	const [_chosen, setPlotType] = useState("hist");
	const [_variables, setVariables] = useState(variables);
	const [_plot_variables, setPlotVariables] = useState({ x: null, y: null });

	useEffect(() => (
		setVariables(variables)
	), [variables]);

	const handleChoosePlotType = (event) => {
		event.preventDefault();
		var plot_type = event.target.value;
		setPlotType(plot_type);
	}

	const handleClick = () => {
		if (_plot_variables.x === null) {
			return null;
		}
		if (_chosen === 'scatter') {
			if (_plot_variables.y === null) {
				return null;
			}
		}
		handleSubmit(_chosen, _plot_variables);
	}

	return (
		<>
			<h1>Choose the plot type</h1>
			<div id="plot-type" onChange={handleChoosePlotType}>
				<Radio
					id='hist'
					name='Histogram'
					checked={_chosen==="hist"}
				/>
				<Radio
					id='scatter'
					name='Scatter plot'
					checked={_chosen==="scatter"}
				/>
			</div>
			<VariablePicker
				plot_type={_chosen}
				variables={_variables}
				handleChange={setPlotVariables}
			/>
			<input
				type="submit"
				value="Plot!"
				onClick={handleClick}
			/>
		</>
	);
}

function VariablePicker({ plot_type, variables, handleChange }) {
	const [_variables, setVariables] = useState(variables);
	const [_plot_variables, setPlotVariables] = useState({ x: "", y: "" });

	useEffect(() => (
		setVariables(variables)
	), [variables]);

	useEffect(() => (
		handleChange(_plot_variables)
	), [_plot_variables]);

	const choosePlotX = (value) => {
		let plot_vars = { ..._plot_variables }
		plot_vars.x = value;
		setPlotVariables(plot_vars);
	}

	const choosePlotY = (value) => {
		let plot_vars = { ..._plot_variables }
		plot_vars.y = value;
		setPlotVariables(plot_vars);
	}

	return (
		<div className='variable-picker'>
			<Select
				id='x'
				var_name='x'
				variables={_variables}
				onChange={choosePlotX}
				value={_plot_variables.x}
			/>
			{plot_type === 'scatter' &&
				<Select
					id='y'
					var_name='y'
					variables={_variables}
					onChange={choosePlotY}
					value={_plot_variables.y}
				/>
			}
		</div>
	);
}
