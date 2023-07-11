import React, { useState, useEffect } from "react";
import Subject from '../subject/Subject.js'


export default function SubjectImages({ subject_data, render_type }) {
    const [currentPage, setPage] = useState(0);
    const [visibleData, setVisibleData] = useState([]);
    const [npages, setnPages] = useState(0);

    const nimages = 16;

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
        var fields = Object.keys(subject_data[0])
        var replacer = function(key, value) { return value === null ? '' : value } 
        var csv = subject_data.map(function(row){
          return fields.map(function(fieldName){
            return JSON.stringify(row[fieldName], replacer)
          }).join(',')
        })
        csv.unshift(fields.join(',')) // add header column
        csv = csv.join('\n');
        
        const content = `data:text/csv;charset=utf-8,${csv}`;
        const encodedURI = encodeURI(content);
        window.open(encodedURI);
    }


    return (
        <div
            className={
                "subject-images-container subject-images-container-" +
                    render_type
            }
        >
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
