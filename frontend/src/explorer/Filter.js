import React from "react"
import { InputNumber, InputMultiRange } from '../tools/Inputs'

export class Subset extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			minValue: props.minValue,
			maxValue: props.maxValue,
			currentMin: props.minValue,
			currentMax: props.maxValue,
			variable: props.variable,
			dtype: props.dtype
		};
	}

	changeMinMax = (minValue, maxValue) => {
		this.setState(
			{ 
				currentMin: minValue,
				currentMax: maxValue 
			},
			() => {
				return this.props.onChange(this.state);
			}
		);
	}

	render() {
		return (
			<div className="filter">
				<InputMultiRange
					minValue={this.state.minValue}
					maxValue={this.state.maxValue}
					step={1}
					type={this.state.dtype.includes('float') ? ('float') : ('int')}
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
					<h3>Configure histogram</h3>
					<form action="#" className="histConfigure" onSubmit={this.onSubmit}>
						<InputMultiRange
							minValue={this.state.variable_data.currentMin}
							maxValue={this.state.variable_data.currentMax}
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

