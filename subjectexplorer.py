from re import sub
from flask import Flask, render_template, request
from panoptes_client import Project, Workflow, Subject, SubjectSet
import subprocess
import json
import ast
import tqdm
import os
import numpy as np
from astropy.io import ascii

plotly_type = {'hist': 'histogram', 'scatter': 'scatter'}

app = Flask(__name__)

@app.route("/")
def index():
    return render_template('index.html')

@app.route('/choose-project/', methods=['POST'])
def get_project():
    if request.method=='POST':
        project_id = request.form['project-id']
    elif request.method=='GET':
        return 0
    else:
        return 0

    project = Project(project_id)
    
    name      = project.display_name
    workflows = project.raw['links']['workflows']

    subject_set_ids   = set([])
    for workflow_id in workflows:
        workflow = Workflow(workflow_id)
        if workflow.active:
            for subject_set_id in workflow.raw['links']['subject_sets']:
                subject_set_ids.add(subject_set_id)

    subject_set_ids   = list(subject_set_ids)

    subject_set_names = []
    for subject_set_id in subject_set_ids:
        sset = SubjectSet(subject_set_id)
        subject_set_names.append(sset.display_name)

    data = {'name': name, 'subject-set-ids': subject_set_ids, 'subject-set-names': subject_set_names}

    if not os.path.exists(f'project_{project_id}_subjects.csv'):
        print("Dowloading subject manifest file")
        subprocess.run(['panoptes', 'project', 'download', '-t', 'subjects', project_id, f'project_{project_id}_subjects.csv'])

    subject_data = ascii.read(f'project_{project_id}_subjects.csv', format='csv')
    subject_data['subject_set_id'].dtype=int
    for subject_set_id in subject_set_ids:
        if not os.path.exists(f'sset_{subject_set_id}_subjects.csv'):
            subjects = subject_data[subject_data['subject_set_id'][:]==int(subject_set_id)]
            subjects.write(f'sset_{subject_set_id}_subjects.csv')

    return json.dumps(data)

@app.route('/choose-subject-set/', methods=['POST'])
def get_subject_set():
    if request.method=='POST':
        subject_set_id = int(request.form['subject-set'])
    elif request.method=='GET':
        return 0
    else:
        return 0

    print(subject_set_id)
    metadata, types = get_metadata_info(subject_set_id)

    print(metadata)

    return json.dumps(metadata)

def get_metadata_info(subject_set_id): 
    subjectset = SubjectSet(subject_set_id)

    sub0 = next(subjectset.subjects)
    metadata_keys = sub0.raw['metadata'].keys()

    metas    = []
    types    = []
    for key in metadata_keys:
        try:
            typei = type(ast.literal_eval(sub0.raw['metadata'][key]))
            types.append(typei)
            metas.append(key)
        except ValueError:
            typei = 'string'
        
    return metas, types

@app.route('/plot-data/', methods=['POST'])
def create_plot():
    print(request.json)
    if request.method=='POST':
        subject_set_id = int(request.json['subject-set-id'])
        plot_type      = request.json['plot_type']
        if plot_type not in ['scatter']:
            metadata_key   = request.json[f'{plot_type}-variable']
        else:
            meta_x = request.json[f'{plot_type}-variable-x']
            meta_y = request.json[f'{plot_type}-variable-y']
    elif request.method=='GET':
        return 0
    else:
        return 0

    subject_data = ascii.read(f'sset_{subject_set_id}_subjects.csv', format='csv')

    if plot_type not in ['scatter']:
        values = []

        for subject in tqdm.tqdm(subject_data):
            values.append(ast.literal_eval(subject['metadata'])[metadata_key])

        output = {'x': values, 'type': plotly_type[plot_type]}
    else:
        x = []
        y = []

        for subject in tqdm.tqdm(subject_data):
            x.append(ast.literal_eval(subject['metadata'])[meta_x])
            y.append(ast.literal_eval(subject['metadata'])[meta_y])

        output = {'x': x,  'y': y, 'mode': 'markers', 'type': plotly_type[plot_type]}
    return json.dumps(output)


if __name__=='__main__':
    app.run(debug=True, port=5000)