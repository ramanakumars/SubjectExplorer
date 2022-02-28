var metadata_keys = new Array();

jQuery(document).ready(function ($) {
    $('form#project-picker').submit(function(event) {
        start_project_progress();
        $.ajax({
            url: '/choose-project/',
            type: 'post',
            data: new FormData(this),
            cache: false,
            contentType: false,
            processData: false,
            success: function(response) {
                data = JSON.parse(response);
                var div = $('div#project-name')
                div.html("Found project: " + data['name']);
                populate_subject_sets(data);
                end_project_progress();
            }
        });
        return false;
    });

    $('form#subject-set-picker').submit(function(event) {
        input_data = $(this).serializeJSON();
        $.ajax({
            url: '/choose-subject-set/',
            type: 'post',
            data: new FormData(this),
            cache: false,
            contentType: false,
            processData: false,
            success: function(response) {
                data = JSON.parse(response);
                for(i=0; i<data.length; i++) {
                    metadata_keys.push(data[i]);
                }

                selects = document.getElementsByClassName("variable-select");
                for( i=0; i<selects.length; i++ ) {
                    selecti = selects[i];
                    selecti.innerHTML = '';

                    for( j=0; j<metadata_keys.length; j++) {
                        optioni = document.createElement('option')
                        optioni.value = metadata_keys[j];
                        optioni.innerHTML = metadata_keys[j];

                        selecti.appendChild(optioni);
                    }
                }

                sset_id = input_data['subject-set'];

                sset_id_inputs = $('input[type=hidden]#subject-set-id');
                sset_id_inputs.each(function () { 
                    $(this).val(sset_id);
                });

            }
        });
        return false;
    });

    $('label.plot-type').click(function(event) {
        plot_type = $(this).prev().attr('id');

        hide_variable_pickers();

        variable_picker = document.getElementById(plot_type+'-variable');
        variable_picker.style.display = 'block';
    });
    
    $('form#subject-set-picker').on('click', 'span', function() {
        var radio = $(this).children();
        
        if( radio.is(':checked')==false ) {
            radio.prop('checked', true);
        } else {
            radio.prop('checked', false);
        }
    });

    $('form.plot-variable').submit(function(event) {
        var plot_type = $(this).attr('id').split('-')[0];

        input_data = $(this).serializeJSON();
        input_data['plot_type'] = plot_type;

        console.log(input_data);

        $.ajax({
            url: '/plot-data/',
            type: 'post',
            data: JSON.stringify(input_data),
            cache: false,
            dataType: 'json',
            contentType: 'application/json',
            processData: false,
            success: function(data) {
                console.log(data);
                Plotly.newPlot('plot', [data]);
            }
        });

        return false;
    });

    hide_variable_pickers();
});

function start_project_progress() {
    form = document.getElementById('subject-set-picker');

    /* clear the form data first */
    form.innerHTML = '';

    project_name = document.getElementById('project-name');
    project_name.style.visibility = 'hidden';
    project_name.style.opacity    = 0;

    subject_set_sec = document.getElementById('subject-set-loader');
    subject_set_sec.style.visibility = 'hidden';
    subject_set_sec.style.opacity = 0;
}

function end_project_progress() {
    project_name = document.getElementById('project-name');
    project_name.style.visibility = 'visible';
    project_name.style.opacity    = 1;

    subject_set_sec = document.getElementById('subject-set-loader');
    subject_set_sec.style.visibility = 'visible';
    subject_set_sec.style.opacity = 1;
}



function populate_subject_sets(data) {
    form = document.getElementById('subject-set-picker');

    subject_set_ids   = data['subject-set-ids']
    subject_set_names = data['subject-set-names']
    for (let i=0; i < subject_set_ids.length; i++) {
        spani       = document.createElement('span');
        spani.classList.add('subject-radio-container');

        form.appendChild(spani);

        inputi = document.createElement('input');
        inputi.type = 'radio';
        inputi.id = subject_set_ids[i];
        inputi.name = 'subject-set'
        inputi.value = subject_set_ids[i];
        inputi.style.visibility = 'hidden';
        spani.appendChild(inputi);

        labeli = document.createElement('label');
        labeli.for = subject_set_ids[i];
        labeli.innerHTML = subject_set_names[i];
        labeli.classList.add('radio')
        spani.appendChild(labeli);
    }

    submit = document.createElement('input');
    submit.type = 'submit';
    submit.value = "Submit!";
    form.appendChild(submit);
}

function hide_variable_pickers() {
    variable_pickers = document.getElementsByClassName('variable-picker-container');

    for( i=0; i<variable_pickers.length; i++) {
        variable_pickers[i].style.display = 'none';
    }
}