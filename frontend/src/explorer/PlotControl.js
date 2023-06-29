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
		var plot_type = event.target.id;
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
			<div id="plot-type">
				<Radio
					id='hist'
					name='Histogram'
					handleClick={handleChoosePlotType}
					checked={true}
				/>
				<Radio
					id='scatter'
					name='Scatter plot'
					handleClick={handleChoosePlotType}
					checked={false}
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
	const [_plot_variables, setPlotVariables] = useState({ x: null, y: null });

	useEffect(() => (
		setVariables(variables)
	), [variables]);

	useEffect(() => (
		handleChange(_plot_variables)
	), [_plot_variables, handleChange]);

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
			/>
			{plot_type === 'scatter' &&
				<Select
					id='y'
					var_name='y'
					variables={_variables}
					onChange={choosePlotY}
				/>
			}
		</div>
	);
}
