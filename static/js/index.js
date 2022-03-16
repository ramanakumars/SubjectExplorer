import React from 'react';
import reactDom from 'react-dom';
import ReactDOM from 'react-dom';
import Plot from 'react-plotly.js';

'use strict';

const var_names = {
    hist: ['x'],
    scatter: ['x','y'],
    bar: ['x']
}

function ProjectName(props) {
    if(props.error) {
        return <strong>Project {props.id} not found! </strong>
    } else {
        return <span>Found project: {props.name} </span>
    }
}

class ProjectForm extends React.Component {
    constructor(props) {
        super(props);
        this.state = {project_id: 0};

        this.handleSubmit = this.handleSubmit.bind(this);
        this.handleChange = this.handleChange.bind(this);
    }

    handleSubmit(event) {
        event.preventDefault();

        const project_id   = this.state['project_id'];
        const redirect_url = '/get-project-info/' + project_id;

        document.getElementById('loading-container').style.display='block';
        document.getElementById('project-name').style.visibility = 'hidden';
        document.getElementById('project-name').style.opacity = 0;
        document.getElementById('subject-set-loader').style.visibility = 'hidden';
        document.getElementById('subject-set-loader').style.opacity = 0;

        fetch(redirect_url, {
            method: 'POST',
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json'
            },
            body: ''
        }).then( result => result.json()).then( data => {
            if(!data.error) {
                document.getElementById('loading-container').style.display='none';
                ReactDOM.render(<ProjectName id={project_id} name={data.name} error={false} />, document.getElementById('project-name'));

                // document.getElementById('subject-set-picker-container').innerHTML = '';
                ReactDOM.render(<SubjectSetForm key={project_id} subject_set_ids={data['subject-set-ids']} subject_set_names={data['subject-set-names']} />, document.getElementById('subject-set-picker-container'));

                document.getElementById('project-name').style.visibility = 'visible';
                document.getElementById('project-name').style.opacity = 1;
                document.getElementById('subject-set-loader').style.visibility = 'visible';
                document.getElementById('subject-set-loader').style.opacity = 1;

            } else {
                ReactDOM.render(<ProjectName id={project_id} name=' ' error={true} />, document.getElementById('project-name'));    
            }
        })
        .catch((error) => {
            ReactDOM.render(<ProjectName id={project_id} name=' ' error={true} />, document.getElementById('project-name'));
        });
    }

    handleChange(event) {
        this.state[event.target.name] = event.target.value;
    }

    render() {
        return (
            <form id='project-picker' onSubmit={this.handleSubmit}>
                <label htmlFor='project_id'>Project ID:</label>
                <input type='text' id='project_id' name='project_id' onChange={this.handleChange}/>

                <input type='submit' value='Submit!' />
            </form>
        )
    }
}

class SubjectSetForm extends React.Component {
    constructor(props) {
        super(props);
        // this.state = {};
        this.state = {subject_set_ids: props.subject_set_ids, subject_set_names: props.subject_set_names, chosen: null };

        this.handleSubmit = this.handleSubmit.bind(this);
        this.handleChange = this.handleChange.bind(this);
    }

    handleSubmit(event) {
        event.preventDefault();

        if (this.state.chosen == null) {
            return;
        }

        const subject_set   = this.state.chosen;
        const redirect_url = '/choose-subject-set/' + subject_set;

        document.getElementById('choose-plot-container').style.visibility = 'hidden';
        document.getElementById('choose-plot-container').style.opacity = 0;
        document.getElementById('choose-plot-container').style.display = 'none';
        document.getElementById('loading-container').style.display='block';

        fetch(redirect_url, {
            method: 'POST',
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json'
            },
            body: ''
        }).then( result => result.json()).then( data => {
            if(!data.error) {
                document.getElementById('loading-container').style.display='none';


                ReactDOM.render(<ChoosePlotType variables={data.variables} subject_set_id={subject_set} key={subject_set+"_plot_type"} />,
                    document.getElementById('plot-picker-container'));

                document.getElementById('choose-plot-container').style.display = 'block';
                document.getElementById('choose-plot-container').style.visibility = 'visible';
                document.getElementById('choose-plot-container').style.opacity = 1;
            } else {
                
            }
        });
    }

    handleChange(event) {
        this.state["chosen"] = event.target.value;
    }

    render() {

        var subject_sets = [];

        const subject_set_ids   = this.state.subject_set_ids;
        const subject_set_names = this.state.subject_set_names;

        for( var i=0; i<subject_set_ids.length; i++) {
            subject_sets.push({id: subject_set_ids[i], name: subject_set_names[i]});
        }

        return (
            <form id="subject-set-picker" onSubmit={this.handleSubmit} key={Math.random()}>
                {subject_sets.map(ss => (
                    <span className='subject-radio-container' key={ss.id+'_0'}>
                        <input type='radio' id={ss.id} name='subject-set' value={ss.id} style={{visibility: 'hidden'}} key={ss.id+'_1'} onChange={this.handleChange}/>
                        <label htmlFor={ss.id} className='radio' key={ss.id+'_2'}>{ss.name}</label>
                    </span>
                    ))
                }
                <input type='submit' value='submit' />
            </form>
        )
    }
}

class ChoosePlotType extends React.Component {
    constructor(props) {
        super(props);
        // this.state = {};
        this.state = {subject_set_id: props.subject_set_id, 
            variables: props.variables, 
        };

        this.handleChange = this.handleChange.bind(this);
    }

    
    handleChange(event) {
        var plot_type = event.target.id;

        ReactDOM.render(<CreatePlotForm subject_set_id={this.state.subject_set_id} variables={this.state.variables} 
            plot_name={plot_type} var_names={var_names[plot_type]} key={this.state.subject_set_id+plot_type}/>, document.getElementById('variable-picker'));
    }

    render() {

        return (
            <nav id='plot-type'>
                <span>
                    <input type="radio" name="plot-type" className="plot-type" id="hist" onChange={this.handleChange} />
                    <label htmlFor="hist" className="radio plot-type">Histogram</label>
                </span>
                <span>
                    <input type="radio" name="plot-type" className="plot-type" id="scatter" onChange={this.handleChange}/>
                    <label htmlFor="scatter" className="radio plot-type">Scatter plot</label>
                </span>
                <span>
                    <input type="radio" name="plot-type" className="plot-type" id="bar" onChange={this.handleChange}/>
                    <label htmlFor="bar" className="radio plot-type">Bar graph</label>
                </span>
            </nav>
        )
    }

}

class CreatePlotForm extends React.Component {
    constructor(props) {
        super(props);
        // this.state = {};
        this.state = {subject_set_id: props.subject_set_id, 
            variables: props.variables, 
            n_vars: props.var_names.length, 
            var_names: props.var_names,
            plot_name: props.plot_name
        };

        this.handleSubmit = this.handleSubmit.bind(this);
    }

    handleSubmit(event) {
        event.preventDefault();

        var data = {subject_set_id: this.state.subject_set_id, plot_type: this.state.plot_name};
        var variables = [];
        for(var i=0; i<this.state.n_vars; i++) {
            if(event.target.elements[this.state.var_names[i]].value=='') {
                return;
            }
            data[this.state.var_names[i]] = event.target.elements[this.state.var_names[i]].value;
            variables.push(event.target.elements[this.state.var_names[i]].value);
        }

        fetch('/plot-data/', {
            method: 'POST',
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        }).then( result => result.json()).then( plotly_meta => {
            if(!plotly_meta.error) {
                var layout = plotly_meta.layout;
                layout['hovermode'] = 'closest';
                layout['width'] = 800;
                layout['height'] = 600;

                ReactDOM.render(<SubjectPlotter key={this.state.subject_set_id+"_"+this.state.plot_name+variables[0]} plot_name={this.state.plot_name} subject_set_id={this.state.subject_set_id} 
                    data={[plotly_meta.data]} layout={layout} variables={variables} subject_urls={plotly_meta.subject_urls} />,
                    document.getElementById('plot'));

                
                // ReactDOM.render(<SubjectImages subject_set_id={this.state.subject_set_id} 
                //     variables={variables} subject_urls={plotly_meta.subject_urls.slice(0,100)} />,
                //     document.getElementById('images'));


            } else {
                
            }
        })
    }
    render() {
        var var_selects = [];
        var variables   = [];

        for( var i=0; i<this.state.n_vars; i++) {
            var_selects.push({name: this.state.var_names[i]});
        }

        for( var i=0; i<this.state.variables.length; i++) {
            variables.push({name: this.state.variables[i]});
        }

        return (
            <div id="hist-variable" className="variable-picker-container" key={this.state.subject_set_id+"_var_container"}>
                <form id="hist-variables" className="plot-variable" onSubmit={this.handleSubmit} key={this.state.subject_set_id+"_var_form"}>
                    {var_selects.map(vx => (
                        <span key={vx.name+"_span"}>
                            <label htmlFor={vx.name} key={vx.name+"_label"}>{vx.name}: </label>
                            <select name={vx.name} id={vx.name} defaultValue='' className="variable-select" key={vx.name+"_select"}>
                                <option value="" disabled key={vx.name+"_default"}>Select a project and subject set!</option>
                                {variables.map(vi => (
                                    <option value={vi.name} key={vx.name+vi.name+"_label"}>{vi.name}</option>
                                ))
                                }
                            </select>
                        </span>
                        ))
                    }
                    <input type="hidden" name="subject-set-id" id="subject-set-id" value={this.state.subject_set_id} key={this.state.subject_set_id+"_value"}/>
                    <input type="submit" value="Plot!" key={this.state.subject_set_id+"_var_submit"}/>
                </form>
            </div>
        )
    }
}

class SubjectImages extends React.Component {
    constructor(props) {
        super(props);
        // this.state = {};
        this.state = {subject_set_id: props.subject_set_id, 
            variables: props.variables, 
            n_vars: props.variables.length, 
            subject_urls: props.subject_urls,
            render_type: props.render_type,
			page: 0,
        };
        
		this.prevPage = this.prevPage.bind(this);
		this.nextPage = this.nextPage.bind(this);
    }

	prevPage(e) {
		e.preventDefault();
		if(this.state.page > 0) {
			this.setState({page: this.state.page -1});
		}
	}

	nextPage(e) {
		e.preventDefault();
		if(this.state.page < this.state.npages - 1) {
			this.setState({page: this.state.page + 1});
		}
	}

    render() {
		
		var nmax = 25;
        if(this.state.render_type=='hover') {
            nmax = 6;
        }


		this.state.nimages = nmax;
		this.state.npages = Math.ceil(this.state.subject_urls.length / nmax);

        var urls = [];

		const startind = this.state.page*this.state.nimages;

        for(var i=startind; i<Math.min(this.state.subject_urls.length, startind+this.state.nimages); i++) {
            urls.push({idx: i, url: this.state.subject_urls[i]});
        }

        var style = {};
        if(( urls.length > 1 )&(this.state.render_type=='hover')) {
            style = {width: '28%'};
        }

        return (
            <div className={'subject-images-container subject-images-container-'+this.state.render_type}>
				<div className='image-page'>
					<button onClick={this.prevPage}>&laquo;</button>
						{this.state.page+1} / {this.state.npages}
					<button onClick={this.nextPage}>&raquo;</button>
				</div>
				{urls.map(url => (
					<span key={this.state.render_type+"_"+url.url+"_span"} style={style} id={"subject_"+url.idx}>
						<img key={this.state.render_type+"_"+url.url+"_img"} src={url.url} className='subject-image' />
					</span>
				))
				}
            </div>
        )
    }
}

class SubjectPlotter extends React.Component {
    constructor(props) {
        super(props);
        // this.state = {};
        this.state = {subject_set_id: props.subject_set_id, 
            data: props.data,
            layout: props.layout,
            variables: props.variables, 
            n_vars: props.variables.length, 
            subject_urls: props.subject_urls,
            plot_name: props.plot_name
        };

        ReactDOM.render(<SubjectImages key={this.state.subject_set_id} subject_set_id={this.state.subject_set_id} 
            variables={this.state.variables} render_type={'selection'} subject_urls={this.state.subject_urls} ref={SubjectImages => { this.images = SubjectImages }} />, 
            document.getElementById('images'));

        ReactDOM.render(<SubjectImages key={this.state.subject_set_id+"_hover"} subject_set_id={this.state.subject_set_id} 
                variables={this.state.variables} render_type={'hover'} subject_urls={[this.state.subject_urls[0]]} ref={SubjectImages => { this.hoverimage=SubjectImages }} />, 
                document.getElementById('hover-image'));

        this.handleHover  = this.handleHover.bind(this);
        this.handleSelect = this.handleSelect.bind(this);
        this.resetSelection = this.resetSelection.bind(this);
    }

    handleHover(data) {
        var urls = [];
        if(this.state.plot_name == 'hist') {
            for(var i=0; i < data.points[0].pointNumbers.length; i++){
                urls.push(this.state.subject_urls[data.points[0].pointNumbers[i]]);
            };
        } else if(this.state.plot_name=='scatter') {
            for(var i=0; i < data.points.length; i++){
                urls.push(this.state.subject_urls[data.points[i].pointNumber]);
            };
        }

		this.hoverimage.setState({subject_urls: urls, page: 0});
    }
    
	handleSelect(data) {
		if (data==undefined) {
			return;
		}

        var urls = [];
        if(this.state.plot_name == 'hist') {
            for(var i=0; i < data.points[0].pointNumbers.length; i++){
                urls.push(this.state.subject_urls[data.points[0].pointNumbers[i]]);
            };
        } else if(this.state.plot_name=='scatter') {
            for(var i=0; i < data.points.length; i++){
                urls.push(this.state.subject_urls[data.points[i].pointNumber]);
            };
        }

		this.images.setState({subject_urls: urls, page: 0});
    }

	resetSelection() {
		this.images.setState({subject_urls: this.state.subject_urls, page: 0});
	}

    render() {
        return (
        <Plot data={this.state.data} layout={this.state.layout}
            onHover={this.handleHover} onSelected={this.handleSelect} onDeselect={this.resetSelection} />
        )
    }
}

ReactDOM.render(<ProjectForm />, document.getElementById("project-picker-container"));
