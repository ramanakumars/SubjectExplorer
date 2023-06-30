import React, { useState, forwardRef, useEffect, createRef, createElement, useRef, useImperativeHandle } from "react";
import { InputMultiRange, InputNumber, Select } from '../tools/Inputs'

export function VariableFilter({ variable, type, checked, onChange }) {
	const [_minValue, setMinValue] = useState(variable.minValue);
	const [_maxValue, setMaxValue] = useState(variable.maxValue);
	const [_checked, setChecked] = useState(checked);

	useEffect(() => {
		setMinValue(variable.minValue);
		setMaxValue(variable.maxValue);
	}, [variable]);

	useEffect(() => {
		setChecked(checked);
	}, [checked]);

	return (
		<>
			{variable != undefined && (
				<div className='variable-control'>
					{(type === 'range') && (
						(
							((variable.dtype.includes('float')) || (variable.dtype.includes('int'))) &&
							<Subset
								key={variable.name + "_range"}
								variable={variable.name}
								dtype={variable.dtype}
								minValue={_minValue}
								maxValue={_maxValue}
								onChange={onChange}
							/>
						)
					)}
					{type === 'value' && (
						((variable.dtype.includes('float')) || (variable.dtype.includes('int'))) && (
							<InputNumber
								key={variable.name + "_number"}
								name={variable.name}
								text={"Value"}
								value={0}
								type={variable.dtype}
								minValue={_minValue}
								maxValue={_maxValue}
								onChange={onChange}
							/>
						) || (
							variable.dtype.includes('bool') &&
							<Selector
								key={variable.name + "_selector"}
								variable={variable.name}
								checked={_checked}
								onChange={onChange}
							/>
						)
					)}

				</div>
			)
			}
		</>
	)

}

export function Subset({ minValue, maxValue, variable, dtype, onChange }) {
	const [currentMin, setMin] = useState(minValue);
	const [currentMax, setMax] = useState(maxValue);

	const changeMinMax = (minValue, maxValue) => {
		setMin(minValue);
		setMax(maxValue);

		onChange([currentMin, currentMax]);
	}

	return (
		<div className="filter">
			<InputMultiRange
				minValue={minValue}
				maxValue={maxValue}
				step={1}
				type={dtype.includes('float') ? ('float') : ('int')}
				text={'Filter by ' + variable}
				onChange={changeMinMax}
			/>
		</div>
	);

}

export function Selector({ checked, variable, onChange }) {
	const [_checked, setChecked] = useState(checked);

	useEffect(() => (
		setChecked(checked)
	), [checked])

	const handleInput = () => {
		setChecked(!_checked);
		onChange(_checked);
	}

	return (
		<div id="selector_checkbox">
			<input
				type="checkbox"
				name={variable + "_only"}
				id={variable + "_only"}
				onChange={handleInput}
				checked={_checked}
			/>
			<label htmlFor={variable + "_only"}>Show only {variable} </label>
		</div>
	);

}


export const FilterGroup = forwardRef(function FilterGroup({ variables, onChange }, ref) {
	const [_filters, setFilters] = useState([]);
	const [_filt_counter, setFilterCounter] = useState(0);
	const filters = useRef(_filters);

	const createFilter = () => {
		filters.current = [...filters.current, createElement(Filter,
			{
				id: _filt_counter,
				key: _filt_counter + "_filter",
				variables: variables,
				removeFilter: removeFilter,
				onChange: onChange,
				ref: createRef()
			})
		]
		setFilters(filters.current);
		setFilterCounter(_filt_counter + 1);
	}

	const removeFilter = (id) => {
		var new_filters = [];
		for (var filter of filters.current) {
			if (filter.props.id != id) {
				new_filters.push(filter);
			}
		}
		filters.current = new_filters;
		setFilters(new_filters);
		onChange();
	}

	const checkMetadata = (metadata) => {
		if (filters.current.length === 0) {
			return true;
		}
		const filter_checks = filters.current.map((filter) => (filter.ref.current.checkMetadata(metadata)));
		return filter_checks.some((value) => (value));
	}

	useImperativeHandle(ref, (metadata) => ({
		checkMetadata
	}));

	return (
		<>
			<section id='create-filter'>
				<input type='button' onClick={createFilter} value="Add filter" />
			</section>
			{[filters.current]}
		</>
	)
});

const Filter = forwardRef(function Filter({ id, variables, removeFilter, onChange }, ref) {
	const [_selected_variable, selectVariable] = useState(null);
	const [_filter_mode, setFilterMode] = useState(null);
	const [_possible_filter_modes, setPossibleFilterMode] = useState(null);
	const [_filter_value, setFilterValue] = useState(null);
	const [_is_locked, setLock] = useState(false);
	const [_is_filled, setFilled] = useState(false);

	useEffect(() => {
		if (_selected_variable) {
			if (_selected_variable.dtype.includes('bool')) {
				setPossibleFilterMode([{ name: "range" }]);
			} else {
				setPossibleFilterMode([{ name: "range" }, { name: "value" }]);
			}
		}
	}, [_selected_variable]);

	const clickVariable = (vari) => {
		var var_index;
		var_index = variables.map((v) => (v.name)).indexOf(vari);
		selectVariable(variables[var_index]);
	}

	const getFilter = (data) => {
		if (_filter_mode == 'range') {
			setFilterValue([...data]);
		} else {
			setFilterValue(data);
		}
		setFilled(true);
	}

	const checkMetadata = (metadata) => {
		if ((!_is_filled) & (!_is_locked)) {
			return false;
		}

		var value = metadata[_selected_variable.name];

		if (_filter_mode === 'range') {
			if ((value >= _filter_value[0]) && (value <= _filter_value[1])) {
				return true;
			} else {
				return false;
			}
		}

		if (_filter_mode === 'value') {
			if (value == _filter_value) {
				return true;
			} else {
				return false;
			}
		}
	}

	const checkAndLock = () => {
		if (_is_filled) {
			setLock(true);
			onChange();
		}
	}

	useImperativeHandle(ref, (metadata) => ({
		checkMetadata
	}));

	return (
		<div className='filter'>
			<input type='button' value='Delete filter!' onClick={() => removeFilter(id)} />
			{(!_is_locked || !_is_filled) &&
				<>
					<form action='#' method='POST'>
						<Select
							id='filter_variables'
							var_name='Filter variable'
							variables={variables}
							onChange={clickVariable}
						/>
						{(_selected_variable && _possible_filter_modes) &&
							<Select
								key={_selected_variable.name + "_select_filter_mode"}
								id='filter_mode'
								var_name='Filter type'
								variables={_possible_filter_modes}
								onChange={setFilterMode}
							/>
						}
						{(_selected_variable && _filter_mode) &&
							<VariableFilter
								key={_selected_variable.name}
								variable={_selected_variable}
								type={_filter_mode}
								checked={false}
								onChange={getFilter}
							/>
						}
						<input type='button' value='Submit' onClick={checkAndLock} />
					</form>
				</>
			}
			{(_is_locked && _is_filled) &&
				<span>
					<input type='button' value='Edit' onClick={() => setLock(false)} />
					<h2>
						Filter for {_selected_variable.name}
					</h2>
					{(_filter_mode === "range") && (
						<>
							Minimum value: {_filter_value[0]} <br />
							Maximum value: {_filter_value[1]}
						</>
					)}
					{(_filter_mode === "value") && (
						<>
							Value: {_filter_value} <br />
						</>
					)}
				</span>
			}
		</div>
	)
});
