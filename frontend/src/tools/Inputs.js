import React, { useState, useEffect } from "react";
import '../css/utils.css';
import MultiRangeSlider from "multi-range-slider-react";


const parseValue = (value, type) => {
	if (type === 'float') {
		value = Number.parseFloat(value).toFixed(2);
	} else if (type === 'int') {
		value = parseInt(value);
	} else {
		value = '';
	}

	if (isNaN(value)) {
		value = '';
	}

	return value;
}

export class InputNumber extends React.Component {
	constructor(props) {
		super(props);

		var step = 1;
		if (props.type === 'float') {
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
				<label htmlFor={this.state.name}>{this.state.text}:</label>
				<input type='number'
					name={this.state.name}
					onChange={this.onChange}
					value={this.state.value}
					min={this.state.minValue}
					max={this.state.maxValue}
					step={this.state.step}
				/>
			</span>
		)
	}
}

export function Radio({ id, name, handleClick, checked }) {
	return (
		<span>
			<input
				type="radio"
				name="plot-type"
				className="plot-type"
				id={id}
				onChange={handleClick}
				defaultChecked={checked}
			/>
			<label htmlFor={id} className="radio plot-type">
				{name}
			</label>
		</span>
	)
}

export function Select({ id, var_name, variables, onChange }) {
	const [_value, setValue] = useState("");

	useEffect(() => (
		onChange(_value)
	), [_value, onChange]);

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


export function InputMultiRange({ minValue, maxValue, step, type, text, onChange }) {
	const [_minValue, setMinValue] = useState(parseValue(minValue, type));
	const [_maxValue, setMaxValue] = useState(parseValue(maxValue, type));
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
	}, [_minValue, _maxValue, onChange]);

	return (
		<div className='slider'>
			<label>{text}</label>
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
