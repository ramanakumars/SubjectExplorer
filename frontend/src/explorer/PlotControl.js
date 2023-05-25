import React from "react";
import MultiRangeSlider from "multi-range-slider-react";
import MetadataUpload from "./MetadataUpload";

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

	handleInput(e) {
		this.setState({ currentMax: e.maxValue, currentMin: e.minValue });

		this.props.onChange(this.state);
	}

	render() {
		return (
			<div id="filter">
				<label>Filter by {this.state.variable}</label>
				<MultiRangeSlider
					min={this.state.minValue}
					max={this.state.maxValue}
					step={1}
					ruler={false}
					label={true}
					preventWheel={false}
					minValue={this.state.currentMin}
					maxValue={this.state.currentMax}
					onInput={(e) => {
						this.handleInput(e);
					}}
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


export class PlotConfigure extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			type: props.type
		}
	}

	render() {
		return (
			<div id='configure-plot'>
				{this.state.type === 'hist' &&
					<input type='numeric' name='histmin' defaultValue={this.state.variable.min}/>
				}
			</div>
		)
	}
}
