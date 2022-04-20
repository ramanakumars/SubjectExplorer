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

@app.route('/get-project-info/<project_id>', methods=['POST'])
def get_project(project_id):
    try:
        project   = Project(project_id)
        name      = project.display_name
        workflows = project.raw['links']['workflows']
    except Exception as e:
        print(e)
        return json.dumps({"error": "No such project found"})

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

    print("Dowloading subject manifest file")
    subprocess.run(['panoptes', 'project', 'download', '-t', 'subjects', project_id, f'project_{project_id}_subjects.csv'])

    subject_data = ascii.read(f'project_{project_id}_subjects.csv', format='csv')
    subject_data['subject_set_id'].dtype=int
    for subject_set_id in subject_set_ids:
        subjects = subject_data[subject_data['subject_set_id'][:]==int(subject_set_id)]
        subjects.write(f'sset_{subject_set_id}_subjects.csv', overwrite=True)

    return json.dumps(data)

@app.route('/choose-subject-set/<subject_set_id>', methods=['POST'])
def get_subject_set(subject_set_id):
    print(subject_set_id)
    variables, types = get_metadata_info(subject_set_id)

    metadata = {'variables': variables}

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
        except (ValueError, SyntaxError):
            print(f"Skipping {key}")
        
    return metas, types

@app.route('/plot-data/', methods=['POST'])
def create_plot():
    print(request.json)
    if request.method=='POST':
        subject_set_id = int(request.json['subject_set_id'])
        plot_type      = request.json['plot_type']
        if plot_type not in ['scatter']:
            metadata_key   = request.json['x']
        else:
            meta_x = request.json['x']
            meta_y = request.json['y']
    elif request.method=='GET':
        return 0
    else:
        return 0

    subject_data = ascii.read(f'sset_{subject_set_id}_subjects.csv', format='csv')

    layout = {}

    urls = []

    if plot_type not in ['scatter']:
        values = []

        for subject in tqdm.tqdm(subject_data):
            values.append(ast.literal_eval(subject['metadata'])[metadata_key])
            urls.append(ast.literal_eval(subject['locations'])["0"])

        output = {'x': values, 'type': plotly_type[plot_type]}

        layout['xaxis'] = {'title': metadata_key}
    else:
        x = []
        y = []

        for subject in tqdm.tqdm(subject_data):
            x.append(ast.literal_eval(subject['metadata'])[meta_x])
            y.append(ast.literal_eval(subject['metadata'])[meta_y])
            urls.append(ast.literal_eval(subject['locations'])["0"])

        layout['xaxis'] = {'title': meta_x}
        layout['yaxis'] = {'title': meta_y}

        output = {'x': x,  'y': y, 'mode': 'markers', 'type': plotly_type[plot_type]}
    return json.dumps({'data': output, 'layout': layout, 'subject_urls': urls})


if __name__=='__main__':
    app.run(debug=True, port=5500)
