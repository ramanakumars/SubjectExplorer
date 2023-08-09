import React, { useState, useEffect } from "react";
import '../css/utils.css';
import MultiRangeSlider from "multi-range-slider-react";


const parseValue = (value, type) => {
	if (type.includes('float')) {
		value = Number.parseFloat(value).toFixed(2);
	} else if (type.includes('int')) {
		value = parseInt(value);
	} else {
		value = '';
	}

	if (isNaN(value)) {
		value = '';
	}

	return value;
}

export function InputNumber({minValue, maxValue, value, text, name, type, onChange}) {
	const [_value, setValue] = useState(value);
	
	var step = 1;
	if (type.includes('float')) {
		step = 0.01;
	}

	useEffect(() => {
		onChange(_value);
	}, [_value]);

	const _parseChange = () => {
		var value = parseValue(_value, type);
		setValue(value);
	}

	return (
		<span>
			<label htmlFor={name}>{text}: </label>
			<input type='number'
				name={name}
				onChange={(e) => setValue(e.target.value)}
				onBlur={_parseChange}
				onMouseOut={_parseChange}
				value={_value}
				min={minValue}
				max={maxValue}
				step={step}
			/>
		</span>
	)

}

export class InputNumberOld extends React.Component {
	constructor(props) {
		super(props);

		var step = 1;
		if (props.type.includes('float')) {
			step = 0.01;
		}

		this.state = {
			minValue: parseValue(props.minValue, props.type),
			maxValue: parseValue(props.maxValue, props.type),
			value: parseValue(props.value, props.type),
			text: props.text,
			name: props.name,
			type: props.type,
			step: step
		}
	}

	onChange = (e) => {
		var value = parseValue(e.target.value, this.state.type);
		this.setState({ value: value });
		this.props.onChange(value);
	}

	render() {
		return (
			<span>
				<label htmlFor={this.state.name}>{this.state.text}: </label>
				<input type='text'
					name={this.state.name}
					onMouseOut={this.onChange}
					value={this.state.value}
					min={this.state.minValue}
					max={this.state.maxValue}
					step={this.state.step}
				/>
			</span>
		)
	}
}

export function Radio({ id, name, checked }) {
	return (
		<span>
			<input
				type="radio"
				name="plot-type"
				className="plot-type"
				id={id}
				value={id}
				defaultChecked={checked}
			/>
			<label htmlFor={id} className="radio plot-type">
				{name}
			</label>
		</span>
	)
}

export function Select({ id, var_name, variables, onChange, value }) {
	const [_value, setValue] = useState(value);

	useEffect(() => {
		setValue(value);
	}, [value]);

	useEffect(() => {
		onChange(_value)
	}, [_value]);

	return (
		<span>
			<label htmlFor={id} key={id + "_label"}>
				{var_name + ": "}
			</label>
			<select
				name={var_name}
				id={id}
				defaultValue={_value}
				className="variable-select"
				key={var_name + "_select"}
				onChange={(event) => setValue(event.target.value)}
			>
				<option value="" disabled key={var_name + "_default"}>
					Choose a variable
				</option>
				{variables.map((vi) => (
					<option
						value={vi.name}
						key={var_name + "_" + vi.name + "_label"}
					>
						{vi.name}
					</option>
				))}
			</select>
		</span>
	);
}


export function InputMultiRange({ minValue, maxValue, step, type, text, onChange, currentMin, currentMax }) {
	const [_minValue, setMinValue] = useState(parseValue(currentMin, type));
	const [_maxValue, setMaxValue] = useState(parseValue(currentMax, type));
	const absMin = parseValue(minValue, type);
	const absMax = parseValue(maxValue, type);

	const validateMin = (value) => {
		if (!isNaN(value)) {
			return Math.max(value, absMin);
		} else {
			return NaN;
		}
	};
	const validateMax = (value) => {
		if (!isNaN(value)) {
			return Math.min(value, absMax);
		} else {
			return NaN;
		}
	};

	useEffect(() => {
		setMaxValue(validateMax(_maxValue));
		setMinValue(validateMin(_minValue));
	}, [minValue, maxValue, _minValue, _maxValue]);

	useEffect(() => {
		onChange(_minValue, _maxValue);
	}, [_minValue, _maxValue]);

	return (
		<div className='slider'>
			<label>{text}: </label>
			<MultiRangeSlider
				min={absMin}
				max={absMax}
				step={step}
				ruler={false}
				label={false}
				preventWheel={false}
				minValue={_minValue}
				maxValue={_maxValue}
				onInput={(e) => {
					setMinValue(validateMin(e.minValue));
					setMaxValue(validateMax(e.maxValue));
				}}
			/>

			<div className='slider-input'>
				<span className='slider-min'>
					<EditableText
						value={_minValue}
						type={type}
						onChange={(value) => setMinValue(validateMin(value))}
					/>
				</span>
				<span className='slider-min'>
					<EditableText
						value={_maxValue}
						type={type}
						onChange={(value) => setMaxValue(validateMax(value))}
					/>
				</span>
			</div>
		</div>
	)
}


function EditableText({ value, type, onChange }) {
	const [isEditing, setEditing] = useState(false);
	const [val, setValue] = useState(value);

	useEffect(() => {
		setValue(value);
	}, [value]);

	const handleChange = () => {
		setEditing(false);
		var _value = parseValue(val, type);
		setValue(_value);
		onChange(_value);
	};

	const handleKeyPress = (e) => {
		if (e.key === "Enter") {
			handleChange();
		}
	};

	return (
		<div className='editable-text'>
			{isEditing ? (
				<input
					autoFocus
					type='text'
					value={val}
					onKeyPress={handleKeyPress}
					onChange={(e) => setValue(e.target.value)}
					onBlur={handleChange}
				/>
			) : (
				<span className='editable-text' onClick={() => setEditing(true)}>
					{parseValue(val, type)}
				</span>
			)}
		</div>
	)
}
