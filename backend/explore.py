from flask import request, Response
from panoptes_client import Subject
import json
import ast
import tqdm
import io
import datetime
import numpy as np
from astropy.io import ascii
from astropy import Table
from .app import app
from .utils import NpEncoder


data = None


@app.route('/backend/get-subject-info/<subject_id>', methods=['GET', 'POST'])
def get_subject_info(subject_id):
    '''
        Retrieve the metadata information for a given subject
    '''
    try:
        # check if the subject exists in the subject set
        subject = Subject(int(subject_id))
    except Exception as e:
        print(e)
        return json.dumps({"error": "No such subject found"})

    # get the relevant metadata (including the image for the subject)
    url = subject.raw['locations'][0]['image/png']
    lat = float(subject.metadata['latitude'])
    PJ = int(subject.metadata['perijove'])
    lon = float(subject.metadata['longitude'])

    # send the keys back as a response
    response = Response(json.dumps({'subject_id': subject_id,
                                    'subject_url': url,
                                    'latitude': lat,
                                    'longitude': lon,
                                    'PJ': PJ}))
    return response


@app.route('/backend/get-exploration-data/', methods=['GET'])
def get_exploration_data(dsub=None):
    if dsub is None:
        dsub = data
    names = dsub.colnames
    subject_data = [dict(zip(names, row)) for row in dsub]
    variables = [n for n in names if n not in ['url', 'subject_ID']]
    dtypes = dict(zip(variables, [dsub[v].dtype.name for v in variables]))

    return json.dumps({'subject_data': subject_data,
                       'variables': variables,
                       'dtypes': dtypes}, cls=NpEncoder)


@app.route('/backend/create-export/', methods=['POST'])
def create_export():
    '''
        Generate a subject export based on the requested
        `subject_IDs` from the POST request
    '''
    if request.method == 'POST':
        # get the set of subject IDs
        subjects = request.json['subject_IDs']
    else:
        return json.dumps({'error': 'error! request failed'})

    # open the subject data CSV
    subject_data = ascii.read('jvh_subjects.csv', format='csv')

    # create a clone of the table that we can fill in
    export_table = Table(names=('subject_id', 'latitude', 'longitude',
                                'perijove', 'location',
                                'classification_count', 'retired_at',
                                'retirement_reason'),
                         dtype=('i8', 'f8', 'f8', 'i8', 'U40', 'i8',
                                'U40', 'U40'))

    # for each requested subject, add the metadata from the CSV file
    for subject_id in subjects:
        datai = subject_data[(subject_data['subject_id'] == subject_id) & (
            subject_data['subject_set_id'] != 105808)]
        for row in datai:
            meta = ast.literal_eval(row[4])

            latitude = float(meta['latitude'])
            longitude = float(meta['longitude'])
            perijove = int(meta['perijove'])

            location = ast.literal_eval(row[5])["0"]

            export_table.add_row([row[0], latitude, longitude, perijove,
                                  location, row[6], row[7], row[8]])

    # save it out to CSV-like string so we can send it to the frontend
    # to package it and submit for download
    outfile = io.StringIO()
    export_table.write(outfile, format='csv')
    output = outfile.getvalue()

    return json.dumps({'filedata': output})


@app.route('/backend/refresh-vortex-list/', methods=['GET'])
def update_vortex_list():
    # prepare the subject data
    subject_data = ascii.read('jvh_subjects.csv', format='csv')

    subject_data = subject_data[subject_data['subject_set_id'] == 105808]

    subject_ID_list = np.asarray(subject_data['subject_id'])
    subject_IDs = np.unique(subject_ID_list)

    for subject in tqdm.tqdm(subject_IDs, desc='Updating vortex info'):
        data['is_vortex'][data['subject_ID'] == subject] = 1

    return f"Done at {datetime.datetime.now()}"


@app.route('/backend/upload-umap/', methods=['POST'])
def upload_umap():
    if request.method == 'POST':
        umap_file = request.files.get('umap')
    else:
        return Response(status=500, response="Please upload a file!")

    with io.BytesIO(umap_file.read()) as umap_file_data:
        umap_file_data.seek(0)
        umap_data = ascii.read(umap_file_data, format='csv')

    if 'subject_ID' not in umap_data.colnames:
        return Response(status=500, response="UMAP file must have a `subject_ID` column")

    umap_subject_id = np.asarray(umap_data['subject_ID'][:])
    subject_ids = np.asarray(data['subject_ID'][:])

    n_umaps = len(umap_data.colnames) - 1
    dsub = data.copy()

    umap_coords = np.zeros((len(subject_ids), n_umaps))

    for i, subject in enumerate(tqdm.tqdm(subject_ids, desc='Loading UMAP data')):
        umap_idx = np.where(subject == umap_subject_id)[0]

        if len(umap_idx) < 1:
            return Response(status=500, response=f"{subject} not found in UMAP file!")

        umap_coord_i = umap_data[umap_idx[0]]

        umap_coords[i, :] = np.asarray([umap_coord_i[key] for key in umap_data.colnames if key not in ['subject_ID']])

    for j in range(n_umaps):
        dsub.add_column(umap_coords[:, j], name=f'UMAP{j+1}')

    return get_exploration_data(dsub=dsub)
