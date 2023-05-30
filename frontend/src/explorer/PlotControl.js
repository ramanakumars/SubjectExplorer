import React from "react";
import MultiRangeSlider from "multi-range-slider-react";
import MetadataUpload from "./MetadataUpload";
import { InputMultiRange, InputNumber } from "../tools/Inputs"

export const var_names = {
	hist: ["x"],
	scatter: ["x", "y"],
};

export class ChoosePlotType extends React.Component {
	/*
	 * Form for choosing the type of plot (currently Histogram and Scatter)
	 * will automatically create the subsequent form to choose the required variables
	 */
	constructor(props) {
		super(props);
		this.state = {
			variables: props.variables,
			chosen: "hist",
		};


		this.handleChange = this.handleChange.bind(this);
	}

	handleChange(event) {
		var plot_type = event.target.id;
		this.setState({ chosen: plot_type });
		this.props.handleChange({ 'chosen': plot_type });
	}

	render() {
		return (
			<section id="plot-header">
				<h1>Choose the plot type</h1>
				<nav id="plot-type">
					<span>
						<input
							type="radio"
							name="plot-type"
							className="plot-type"
							id="hist"
							onChange={this.handleChange}
							defaultChecked
						/>
						<label htmlFor="hist" className="radio plot-type">
							Histogram
						</label>
					</span>
					<span>
						<input
							type="radio"
							name="plot-type"
							className="plot-type"
							id="scatter"
							onChange={this.handleChange}
						/>
						<label htmlFor="scatter" className="radio plot-type">
							Scatter plot
						</label>
					</span>
				</nav>
			</section>
		);
	}
}

export class CreatePlotForm extends React.Component {
	constructor(props) {
		super(props);
		// this.state = {};
		this.state = {
			variables: props.variables,
			dtypes: props.dtypes,
			n_vars: props.var_names.length,
			var_names: props.var_names,
			plot_name: props.plot_name,
		};

		this.handleSubmit = this.handleSubmit.bind(this);
	}

	handleSubmit(event) {
		event.preventDefault();

		this.props.onSubmit(event);
	}
	render() {
		var var_selects = [];
		var variables = [];

		for (var i = 0; i < this.state.n_vars; i++) {
			var_selects.push({ name: this.state.var_names[i] });
		}

		for (let key in this.state.variables) {
			var variable = this.state.variables[key];
			if ((variable.dtype.includes('float')) || (variable.dtype.includes('int'))) {
				variables.push({ name: key, variable: key });
			}
		}

		return (
			<section id="variable-picker">
				<div
					id="hist-variable"
					className="variable-picker-container"
					key={"var_container"}
				>
					<form
						id="hist-variables"
						className="plot-variable"
						onSubmit={this.handleSubmit}
						key={"var_form"}
					>
						{var_selects.map((vx) => (
							<span key={vx.name + "_span"}>
								<label htmlFor={vx.name} key={vx.name + "_label"}>
									{vx.name}:{" "}
								</label>
								<select
									name={vx.name}
									id={vx.name}
									defaultValue=""
									className="variable-select"
									key={vx.name + "_select"}
								>
									<option value="" disabled key={vx.name + "_default"}>
										Choose a variable
									</option>
									{variables.map((vi) => (
										<option
											value={vi.variable}
											key={vx.name + vi.name + "_label"}
										>
											{vi.variable}
										</option>
									))}
								</select>
							</span>
						))}
						<input
							type="submit"
							value="Plot!"
							key={this.state.subject_set_id + "_var_submit"}
						/>
					</form>
				</div>
			</section>
		);
	}
}

export class Subset extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			minValue: props.minValue,
			maxValue: props.maxValue,
			currentMin: props.minValue,
			currentMax: props.maxValue,
			variable: props.variable
		};
	}

	changeMinMax = (minValue, maxValue) => {
		this.setState({ currentMin: minValue, currentMax: maxValue });
		this.props.onChange(this.state);
	}

	render() {
		return (
			<div id="filter">
				<InputMultiRange
					minValue={this.state.minValue}
					maxValue={this.state.maxValue}
					step={1}
					type='int'
					text={'Filter by ' + this.state.variable}
					onChange={this.changeMinMax}
				/>
			</div>
		);
	}
}

export class Selector extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			checked: props.checked,
			variable: props.variable
		};

		this.handleInput = this.handleInput.bind(this);
	}

	handleInput() {
		this.setState({ checked: !this.state.checked }, function() {
			this.props.onChange(this.state);
		});
	}

	render() {
		return (
			<div id="selector_checkbox">
				<input
					type="checkbox"
					name={this.state.variable + "_only"}
					id={this.state.variable + "_only"}
					onChange={this.handleInput}
					checked={this.state.checked}
				/>
				<label htmlFor={this.state.variable + "_only"}>Show only {this.state.variable} </label>
			</div>
		);
	}
}




export class PlotConfigureHist extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			variable: props.variable,
			variable_data: props.variable_data,
			binstart: props.variable_data.minValue,
			binend: props.variable_data.maxValue,
			nbins: props.nbins
		}
	}

	changeMinMax = (start, end) => {
		this.setState({ binstart: start, binend: end });
	}

	changeNBins = (value) => {
		this.setState({ nbins: value });
	}

	changeScale = (e) => {
		this.setState({ axis_scale: e.target.value });
	}

	onSubmit = (e) => {
		e.preventDefault();
		this.props.onChange(this.state);
	}

	render() {
		if (this.state.variable !== undefined) {
			return (
				<div id='configure-hist'>
					<h2>Configure histogram</h2>
					<form action="#" className="histConfigure" onSubmit={this.onSubmit}>
						<InputMultiRange
							minValue={this.state.variable_data.minValue}
							maxValue={this.state.variable_data.maxValue}
							step={0.01}
							type='float'
							text='Histogram range'
							onChange={this.changeMinMax}
						/>
						<InputNumber
							name='histnbins'
							text='Number of bins'
							value={this.state.nbins}
							minValue={1}
							maxValue={500}
							type='int'
							onChange={this.changeNBins}
						/>
						<span>
							<label htmlFor="histwidth">Axis scale:</label>
							<select name="axis_scale" onChange={this.changeScale}>
								{Object(['linear', 'log']).map((v) => {
									if (this.state.axis_scale === v) {
										return (
											<option key={v + "_option"} value={v} selected>
												{v}
											</option>
										)
									} else {
										return (
											<option key={v + "_option"} value={v}>
												{v}
											</option>)
									}
								})
								}
							</select>
						</span>
						<input type="submit" value="Submit!" />
					</form>
				</div>
			)
		} else {
			return;
		}
	}
}
