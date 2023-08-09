import React, { useState, useEffect } from "react"
import { InputNumber, InputMultiRange } from '../tools/Inputs'

export function PlotConfigureHist({ variable, onChange }) {
	const [binminmax, setBinRange] = useState([]);
	const [nbins, setNBins] = useState(50);
	const [scale, setScale] = useState('linear');

	const onSubmit = (e) => {
		e.preventDefault();
		onChange({binstart: binminmax[0], binend: binminmax[1], nbins: nbins, scale: scale});
	}

	useEffect(() => {
		if(variable != undefined) {
			setBinRange([variable.currentMin, variable.currentMax]);
		}
	}, [variable]);

	if (variable != undefined) {
		return (
			<div id='configure-hist'>
				<h3>Configure histogram</h3>
				<form action="#" className="histConfigure" onSubmit={onSubmit}>
					<InputNumber
						name='histnbins'
						text='Number of bins'
						value={nbins}
						minValue={1}
						maxValue={500}
						type='int'
						onChange={setNBins}
					/>
					<span>
						<label htmlFor="histwidth">Axis scale:</label>
						<select name="axis_scale" onChange={(e) => setScale(e.target.value)}>
							{Object(['linear', 'log']).map((v) => {
								if (scale === v) {
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
	}

}

export class PlotConfigureHistOld extends React.Component {
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

