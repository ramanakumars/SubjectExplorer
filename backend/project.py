from .utils import NpEncoder
from panoptes_client import Project, Workflow
import json
import tqdm
import os
from astropy.io import ascii
from astropy.table import Table
from flask import Blueprint
import urllib.request as request


project_ids = [17032, 16696, 14993]
BATCH_SIZE = 200

project_bp = Blueprint("project", __name__)


@project_bp.route('/backend/get-projects/', methods=['GET'])
def get_projects():
    output = []
    for id in project_ids:
        project = Project(id)

        output.append({'id': int(project.id),
                       'name': project.display_name,
                       'logo': project.avatar['media'][0]['src'],
                       })

    return json.dumps(output, cls=NpEncoder)


@project_bp.route('/backend/get-project-info/<project_id>', methods=['GET'])
def get_project_info(project_id):
    project = Project(project_id)
    active_workflows = [int(w.id) for w in project.links.workflows if w.active]

    workflow_data = []
    for w in active_workflows:
        workflow = Workflow(w)
        subject_sets = [int(s.id) for s in workflow.links.subject_sets]
        name = workflow.display_name

        workflow_data.append({'id': w, 'subject_sets': subject_sets, 'name': name})

    output = {'id': int(project.id),
              'name': project.display_name,
              'logo': project.avatar['media'][0]['src'],
              'workflow_data': workflow_data
              }

    return output


@project_bp.route('/backend/get-workflow-subjects/<workflow_id>', methods=['GET'])
def get_workflow_data(workflow_id):
    workflow = Workflow(workflow_id)

    n_subjects = workflow.subjects_count

    if os.path.exists(f'{workflow_id}_subjects.csv'):
        data = ascii.read(f'{workflow_id}_subjects.csv', format='csv')
        if len(data) != n_subjects:
            get_subjects_for_workflow(workflow_id)
    else:
        get_subjects_for_workflow(workflow_id)

    subjects_data, variables, dtypes = process_subjects_from_csv(f'{workflow_id}_subjects.csv')

    return json.dumps({'subjects': subjects_data, 'variables': variables, 'dtypes': dtypes}, cls=NpEncoder)


def process_subjects_from_csv(csv):
    data = ascii.read(csv, format='csv')

    subjects_data = []
    for row in data:
        subjects_data.append({key: row[key] for key in data.colnames})

    names = data.colnames
    variables = [n for n in names if n not in ['url', 'subject_ID']]
    dtypes = dict(zip(variables, [data[v].dtype.name for v in variables]))

    return subjects_data, variables, dtypes


def get_subjects_for_workflow(workflow_id):
    workflow = Workflow(workflow_id)

    subject_sets = list(workflow.links.subject_sets)

    subjects = []

    with tqdm.tqdm(total=workflow.subjects_count) as pbar:
        for subject_set in subject_sets:
            page = 1
            while page is not None:
                pbar.set_postfix({'page': page, 'subject_set_id': subject_set.id})
                req = request.Request(f"https://www.zooniverse.org/api/subjects/?subject_set_id={subject_set.id}&page_size={BATCH_SIZE}&page={page}")
                req.add_header('accept', "application/vnd.api+json; version=1")
                req.add_header('content-type', "application/json")
                data = json.loads(request.urlopen(req).read())

                meta = data['meta']['subjects']
                page = meta['next_page']

                for subject in data['subjects']:
                    sub = {'subject_ID': subject['id']}
                    for key in subject['metadata'].keys():
                        sub[key] = subject['metadata'][key]
                    sub['url'] = img_url(subject['locations'])
                    subjects.append(sub)
                
                pbar.update(len(data['subjects']))

    table = Table(rows=subjects)
    table.write(f'{workflow_id}_subjects.csv', overwrite=True)

def img_url(media):
    if len(media) == 1:
        if 'image/png' in media[0]:
            return media[0]['image/png']
        elif 'image/jpeg' in media[0]:
            return media[0]['image/jpeg']
