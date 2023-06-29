import React, { useState, useEffect } from "react";
import { Subset, Selector } from './Filter'


export default function VariableFilter({variable, dtype, minValue, maxValue, checked, onChange}) {
	const [_minValue, setMinValue] = useState(minValue);
	const [_maxValue, setMaxValue] = useState(maxValue);
	const [_variable, setVariable] = useState(variable);
	const [_dtype, setDtype] = useState(dtype);
	const [_checked, setChecked] = useState(checked);
	
	const _slider = false;

	useEffect(() => {
		setVariable(variable);
	}, [variable]);
	
	useEffect(() => {
		setMinValue(minValue);
	}, [minValue]);
	
	useEffect(() => {
		setMaxValue(maxValue);
	}, [maxValue]);
	
	useEffect(() => {
		setChecked(checked);
	}, [checked]);
	
	useEffect(() => {
		setDtype(dtype);
	}, [dtype]);

	return (
		<div className='variable-control'>
			{_slider ? (
				(
					((_dtype.includes('float'))||(dtype.includes('int'))) && 
					<Subset
						key={_variable + "_range"}
						variable={_variable}
						dtype={_dtype}
						minValue={_minValue}
						maxValue={_maxValue}
						onChange={onChange}
					/> 
				) || (
					_dtype.includes('bool') && 
					<Selector
						key={_variable + "_selector"}
						variable={_variable}
						checked={_checked}
						onChange={this.filter}
					/>
				)
			) : (
				<div>
					Empty for now
				</div>
			)
		}
		</div>
	)

}
