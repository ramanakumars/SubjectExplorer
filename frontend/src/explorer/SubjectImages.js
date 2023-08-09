import React, { useState, useEffect, useRef } from "react";
import Subject from '../subject/Subject.js'
import { LoadingPage } from '../util/LoadingPage'


function download(content, fileName, mimeType) {
    var a = document.createElement('a');
    mimeType = mimeType || 'application/octet-stream';

    if (navigator.msSaveBlob) { // IE10
        return navigator.msSaveBlob(new Blob([content], { type: mimeType }),     fileName);
    } else if ('download' in a) { //html5 A[download]
        var csvData = new Blob([content], { type: mimeType });
        var csvUrl = URL.createObjectURL(csvData);
        a.href = csvUrl;
        a.setAttribute('download', fileName);
        document.body.appendChild(a);
        a.click();
        return true;
    } else { //do iframe dataURL download (old ch+FF):
        var f = document.createElement('iframe');
        document.body.appendChild(f);
        f.src = 'data:' + mimeType + ',' + encodeURIComponent(content);

        setTimeout(function() {
            document.body.removeChild(f);
        }, 333);
        return true;
    }
}

export default function SubjectImages({ subject_data, render_type }) {
    const [currentPage, setPage] = useState(0);
    const [visibleData, setVisibleData] = useState([]);
    const [npages, setnPages] = useState(0);

    const nimages = 16;
	
    const loadingDiv = useRef(null);

    useEffect(() => {
        setnPages(Math.ceil(subject_data.length / nimages));
        setPage(0);
    }, [subject_data]);

    useEffect(() => {
        const startind = nimages * currentPage;
        const data_subset = subject_data.slice(startind, startind + nimages);
        setVisibleData(data_subset);
    }, [subject_data, currentPage]);
    
    const prevPage = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (currentPage > 0) {
            setPage(currentPage - 1);
        }
    }

    const nextPage = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (currentPage < npages - 1) {
            setPage(currentPage + 1);
        }
    }

    const getExport = () => {
		loadingDiv.current.enable();
        console.log('Getting data for ' + subject_data.length + ' subjects');
        var fields = Object.keys(subject_data[0])
        var replacer = (key, value) => ( value === null ? '' : value );
        Promise.all(subject_data.map(function(row){
          return fields.map(function(fieldName) {
            return JSON.stringify(row[fieldName], replacer)
          }).join(',')
        })).then((csv) => {
            csv.unshift(fields.join(',')) // add header column
            csv = csv.join('\r\n');
            download(csv, 'subject_data.csv', 'text/csv')
            loadingDiv.current.disable();
        })
        
    }

    return (
        <div
            className={
                "subject-images-container subject-images-container-" +
                    render_type
            }
        >
            <LoadingPage 
                ref={loadingDiv}
                enable_default={false}
                text={"Collecting subject data..."}
            />
            <div className="image-page">
                <button onClick={prevPage}>&laquo;</button>
                {currentPage + 1} / {npages}
                <button onClick={nextPage}>&raquo;</button>
            </div>
            {visibleData.map(data => (
                <Subject
                    key={data.subject_ID + "_" + render_type}
                    metadata={data}
                />
            ))}

            <div className="subject-export-container">
                <button onClick={getExport}>Export subjects</button>
            </div>
        </div>
    )
}
