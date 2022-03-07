import React from 'react';
import ReactDOM from 'react-dom';

'use strict';

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

        fetch(redirect_url, {
            method: 'POST',
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json'
            },
            body: ''
        }).then( result => result.json()).then( data => {
            if(!data.error) {
                ReactDOM.render(<ProjectName id={project_id} name={data.name} error={false} />, document.getElementById('project-name'));
                document.getElementById('project-name').style.visibility = 'visible';
                document.getElementById('project-name').style.opacity = 1;

                ReactDOM.render(<SubjectSetForm subject_set_ids={data['subject-set-ids']} subject_set_names={data['subject-set-names']} />, document.getElementById('subject-set-picker-container'));

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
        this.state = {subject_set_ids: props.subject_set_ids, subject_set_names: props.subject_set_names};

        this.handleSubmit = this.handleSubmit.bind(this);
        this.handleChange = this.handleChange.bind(this);
    }

    handleSubmit(event) {
        event.preventDefault();
    }

    handleChange(event) {
        this.state[event.target.name] = event.target.value;
    }

    render() {
        var subject_sets = [];

        const subject_set_ids   = this.state.subject_set_ids;
        const subject_set_names = this.state.subject_set_names;

        for( var i=0; i<subject_set_ids.length; i++) {
            subject_sets.push({id: subject_set_ids[i], name: subject_set_names[i]});
        }

        return (
            <form id="subject-set-picker" onSubmit={this.handleSubmit} >
                {subject_sets.map(ss => (
                    <span className='subject-radio-container' key={ss.id+'_0'}>
                        <input type='radio' id={ss.id} name='subject-set' value={ss.id} style={{visibility: 'hidden'}} key={ss.id+'_1'}/>
                        <label htmlFor={ss.id} className='radio' key={ss.id+'_2'}>{ss.name}</label>
                    </span>
                    ))
                }
                <input type='submit' value='submit' />
            </form>
        )
    }
}

// export default ProjectForm;

// ReactDOM.render(<HelloWorld />, document.getElementById("test"));
ReactDOM.render(<ProjectForm />, document.getElementById("project-picker-container"));