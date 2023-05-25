from .utils import NpEncoder
from panoptes_client import Workflow, SubjectSet
import json
import tqdm
import os
import numpy as np
from flask import Blueprint
import urllib.request as request


project_ids = [17032, 16696, 14993]
project_subject_sets = {
    '14993': [112229, 112230, 112374, 112376, 112378,
              112381, 112397, 112398, 112399, 112400,
              112471, 112499, 112852, 112856, 112864,
              112873, 112874, 112937, 112938, 112968,
              112969, 112996, 112997],
    '17032': [105808]
}
BATCH_SIZE = 200

project_bp = Blueprint("project", __name__)


@project_bp.route('/backend/get-workflow-subjects/<workflow_id>', methods=['GET'])
def get_workflow_data(workflow_id):
    workflow = Workflow(workflow_id)

    n_subjects = workflow.subjects_count

    if os.path.exists(f'{workflow_id}_subjects.json'):
        with open(f'{workflow_id}_subjects.json', 'r') as infile:
            data = json.load(infile)
        if len(data) != n_subjects:
            get_subjects_for_workflow(workflow_id)
    else:
        get_subjects_for_workflow(workflow_id)

    subjects_data, variables, dtypes = process_subjects_from_json(f'{workflow_id}_subjects.json')

    return json.dumps({'subjects': subjects_data, 'variables': variables, 'dtypes': dtypes}, cls=NpEncoder)


@project_bp.route('/backend/get-project-subjects/<project_id>', methods=['GET'])
def get_project_data(project_id):
    if project_id not in project_subject_sets:
        return json.dumps({'error': f'Project {project_id} is not set up yet'})
    subject_sets = project_subject_sets[project_id]

    n_subjects = 0
    for subject_set in subject_sets:
        sset = SubjectSet(subject_set)
        sset.reload()
        n_subjects += sset.set_member_subjects_count

    print(f'Project {project_id} has {n_subjects} subjects')

    if os.path.exists(f'{project_id}_subjects.json'):
        with open(f'{project_id}_subjects.json', 'r') as infile:
            data = json.load(infile)
        print(f'Loading {len(data)} subjects from {project_id}_subjects.json')
    else:
        get_subjects_for_project(project_id, n_subjects)

    subjects_data, variables, dtypes = process_subjects_from_json(f'{project_id}_subjects.json')
    print(f'Loaded subject data from {project_id}_subjects.json')

    return json.dumps({'subjects': subjects_data, 'variables': variables, 'dtypes': dtypes}, cls=NpEncoder)


def process_subjects_from_json(json_file):
    with open(json_file, 'r') as infile:
        subjects_data = json.load(infile)

    names = subjects_data[0].keys()
    variables = [n for n in names if n not in ['url', 'subject_ID']]
    dtypes = dict(zip(variables, [str(np.asanyarray([sub[v] for sub in subjects_data[:100]]).dtype) for v in variables]))

    return subjects_data, variables, dtypes


def get_subjects_for_project(project_id, n_subjects):
    subject_sets = project_subject_sets[project_id]

    subjects = get_subjects_from_subject_sets(subject_sets, n_subjects)

    with open(f'{project_id}_subjects.json', 'w') as outfile:
        json.dump(subjects, outfile)


def get_subjects_for_workflow(workflow_id):
    workflow = Workflow(workflow_id)

    subject_sets = list(workflow.links.subject_sets)

    subjects = []

    subjects = get_subjects_from_subject_sets(subject_sets, workflow.subjects_count)

    with open(f'{workflow_id}_subjects.json', 'w') as outfile:
        json.dump(subjects, outfile)


def get_subjects_from_subject_sets(subject_sets, n_subjects):
    subjects = []

    with tqdm.tqdm(total=n_subjects) as pbar:
        for subject_set in subject_sets:
            page = 1
            while page is not None:
                pbar.set_postfix({'page': page, 'subject_set_id': subject_set})
                req = request.Request(f"https://www.zooniverse.org/api/subjects/?subject_set_id={subject_set}&page_size={BATCH_SIZE}&page={page}")
                req.add_header('accept', "application/vnd.api+json; version=1")
                req.add_header('content-type', "application/json")
                data = json.loads(request.urlopen(req).read())

                meta = data['meta']['subjects']
                page = meta['next_page']

                for subject in data['subjects']:
                    sub = {'subject_ID': subject['id']}
                    for key in subject['metadata'].keys():
                        metai = change_type(subject['metadata'][key])
                        sub[key] = metai
                    sub['url'] = img_url(subject['locations'])
                    subjects.append(sub)

                pbar.update(len(data['subjects']))
    return subjects


def img_url(media):
    urls = []
    for url in media:
        if 'image/png' in url:
            urls.append(url['image/png'])
        elif 'image/jpeg' in url:
            urls.append(url['image/jpeg'])
    return urls


def change_type(val):
    if val.replace('.', '', 1).replace('-', '', 1).isnumeric():
        try:
            return int(val)
        except ValueError:
            return float(val)
        except Exception:
            return val
    else:
        return val
