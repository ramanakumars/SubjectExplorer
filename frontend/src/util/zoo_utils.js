const BATCH_SIZE = 100;

const getImageUrl = (media) => {
	if (media.length === 1) {
		if ('image/png' in media[0]) {
			return media[0]['image/png'];
		} else if ('image/jpeg' in media[0]) {
			return media[0]['image/jpeg'];
		} else {
			console.log(media);
		}
	} else {
		console.log(media);
	}
}

const getJSONData = async (url) => {
	return fetch(url, {
		method: "GET",
		headers: {
			Accept: "application/vnd.api+json; version=1",
			"Content-Type": "application/json",
		}
	}).then((result) => {
		return result.json();
	});

}

export const getAvatarSrc = async (project_id) => {
	return getJSONData("https://www.zooniverse.org/api/projects/" + project_id + "/avatar/")
	  .then((data) => {
		  return data.media[0].src;
	  });
}

export const getWorkflowData = async (workflow_id) => {
	return getJSONData("https://www.zooniverse.org/api/workflows/" + workflow_id)
	  .then((data) => {
		  let workflow = data.workflows[0];
		  return {
			  id: workflow_id,
			  name: workflow.display_name,
			  subject_sets: workflow.links.subject_sets, 
			  subject_count: workflow.subjects_count
		  }
	  });
}

export const getSubjects = async (workflow_id) => {
	return getJSONData('/backend/get-workflow-subjects/' + workflow_id);
}


export const getSubjectsOld = async (subject_sets) => {
	let promises = subject_sets.map(async (subject_set) => {
		return getSubjectFromSubjectSet(subject_set).then((subs) => {
			return [...subs];
		});
	});

	return Promise.all(promises).then((subs) => {
		return subs.flat();
	});
}

export const getSubjectFromSubjectSet = async (subject_set) => {
	return 	getJSONData("https://www.zooniverse.org/api/subject_sets/" + subject_set + "/")
		.then(async (data) => {
			let nsubjects = data.subject_sets[0].set_member_subjects_count;
			let npages = parseInt( nsubjects / BATCH_SIZE ) + 1;

			let promises = []
			for(let i=1; i<=npages; i++) {
				promises.push(getJSONData("https://www.zooniverse.org/api/subjects?subject_set_id=" + subject_set + "&page_size=" + BATCH_SIZE + "&page=" + i)
					.then((data) => {
						return 	data.subjects;
					})
				);
			}

			return Promise.all(promises).then((sub_batches) => {
				return sub_batches.flat().map((subject) => {
					return {
						id: subject.id,
						metadata: subject.metadata,
						urls: getImageUrl(subject.locations)
					};
				});
			})		
		});
}
