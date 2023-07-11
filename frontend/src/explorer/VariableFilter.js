import React, { useState, forwardRef, useEffect, createRef, createElement, useRef, useImperativeHandle } from "react";
import { InputMultiRange, InputNumber, Select } from '../tools/Inputs'

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
		return filter_checks.every((value) => (value));
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
	const [_selected_variable, selectVariable] = useState("");
	const [_filter_mode, setFilterMode] = useState("");
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

	const checkMetadata = (metadata) => {
		if ((!_is_filled) | (!_is_locked)) {
			return true;
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
			if (value === _filter_value) {
				return true;
			} else {
				return false;
			}
		}
	}
	
	useImperativeHandle(ref, (metadata) => ({
		checkMetadata
	}));
	
	useEffect(() => {
		if(_filter_value) {
			setFilled(true);
		}
	}, [_filter_value]);
	
	useEffect(() => {
		if(_filter_mode !== "") {
			if (!_filter_value) {
				if(_filter_mode === 'range') {
					setFilterValue([_selected_variable.minValue, _selected_variable.maxValue]);
				} else if (_filter_mode === 'value') {
					setFilterValue(0);
				}
			} 
			setFilled(true);
		} else {
			setFilterValue(null);
			setFilled(false);
		}
	}, [_filter_mode]);

	useEffect(() => {
		if (_is_locked) {
			onChange();
		}
	}, [_is_locked]);

	const checkAndLock = () => {
		if (_is_filled) {
			setLock(true);
		}
	}

	const clickVariable = (vari) => {
		var var_index;
		var_index = variables.map((v) => (v.name)).indexOf(vari);
		setFilterMode("");
		selectVariable(variables[var_index]);
	}

	
	const changeRange = (minValue, maxValue) => {
		setFilterValue([minValue, maxValue]);
	}

	const changeValue = (value) => {
		setFilterValue(value);
	}

	return (
		<div className='filter'>
			<input type='button' value='Delete filter!' onClick={() => removeFilter(id)} />
			{(!_is_locked || !_is_filled) &&
				<div className='filter-form'>
					<Select
						id='filter_variables'
						var_name='Filter variable'
						variables={variables}
						onChange={clickVariable}
						value={_selected_variable ? _selected_variable.name : ""}
					/>
					{(_selected_variable && _possible_filter_modes) &&
						<Select
							key={_selected_variable.name + "_select_filter_mode"}
							id='filter_mode'
							var_name='Filter type'
							variables={_possible_filter_modes}
							onChange={setFilterMode}
							value={_filter_mode}
						/>
					}
					{(_selected_variable && _filter_mode) &&
						<div className='variable-control'>
							{(_filter_mode === 'range') && (_filter_value) && (
								(
									((_selected_variable.dtype.includes('float')) || (_selected_variable.dtype.includes('int'))) &&
									<div className="filter">
										<InputMultiRange
											key={_selected_variable.name + "_range"}
											minValue={_selected_variable.minValue}
											maxValue={_selected_variable.maxValue}
											step={1}
											type={_selected_variable.dtype.includes('float') ? ('float') : ('int')}
											text={'Filter by ' + _selected_variable.name}
											currentMin={_filter_value[0]}
											currentMax={_filter_value[1]}
											onChange={changeRange}
										/>
									</div>
								)
							)}
							{_filter_mode === 'value' && (_filter_value != null) && (
								((_selected_variable.dtype.includes('float')) || (_selected_variable.dtype.includes('int'))) && (
									<InputNumber
										key={_selected_variable.name + "_number"}
										name={_selected_variable.name}
										text={"Value"}
										value={_filter_value}
										type={_selected_variable.dtype}
										minValue={_selected_variable.minValue}
										maxValue={_selected_variable.maxValue}
										onChange={changeValue}
									/>
								) || (
									_selected_variable.dtype.includes('bool') &&
									<Selector
										key={_selected_variable.name + "_selector"}
										_selected_variable={_selected_variable.name}
										onChange={onChange}
									/>
								)
							)}

						</div>
					}
					<input type='button' value='Submit' onClick={checkAndLock} />
				</div>
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
