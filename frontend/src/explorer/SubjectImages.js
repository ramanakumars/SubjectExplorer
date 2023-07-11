import React, { useState, useEffect } from "react";
import { LoadingPage } from "../util/LoadingPage.js";
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

    const getExport = (e) => {

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
