from .utils import NpEncoder
from panoptes_client import Workflow
import json
import tqdm
import os
import numpy as np
from astropy.io import ascii
from flask import Blueprint
import urllib.request as request


project_ids = [17032, 16696, 14993]
BATCH_SIZE = 200

project_bp = Blueprint("project", __name__)


@project_bp.route('/backend/get-workflow-subjects/<workflow_id>', methods=['GET'])
def get_workflow_data(workflow_id):
    workflow = Workflow(workflow_id)

    n_subjects = workflow.subjects_count

    if os.path.exists(f'{workflow_id}_subjects.json'):
        data = ascii.read(f'{workflow_id}_subjects.json', format='csv')
        if len(data) != n_subjects:
            get_subjects_for_workflow(workflow_id)
    else:
        get_subjects_for_workflow(workflow_id)

    subjects_data, variables, dtypes = process_subjects_from_json(f'{workflow_id}_subjects.json')

    return json.dumps({'subjects': subjects_data, 'variables': variables, 'dtypes': dtypes}, cls=NpEncoder)


def process_subjects_from_json(json_file):
    with open(json_file, 'r') as infile:
        subjects_data = json.load(infile)

    names = subjects_data[0].keys()
    variables = [n for n in names if n not in ['url', 'subject_ID']]
    dtypes = dict(zip(variables, [str(np.asanyarray([sub[v] for sub in subjects_data[:100]]).dtype) for v in variables]))

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
                        metai = change_type(subject['metadata'][key])
                        sub[key] = metai
                    sub['url'] = img_url(subject['locations'])
                    subjects.append(sub)

                pbar.update(len(data['subjects']))

    with open(f'{workflow_id}_subjects.json', 'w') as outfile:
        json.dump(subjects, outfile)


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
