import React from "react";

export default function Subject({metadata}) {
    return (
        <span key={metadata.subject_ID + "_span"} style={metadata.style}>
            <a href={"/subject/" + metadata.subject_ID} target="_blank" rel="noreferrer">
                {metadata.url.length === 1 &&
                <SingleSubjectImage
                    subject_ID={metadata.subject_ID}
                    url={metadata.url}
                />
                }
            </a>
        </span>
    );
}

function SingleSubjectImage({ url, subject_ID }) {
    return (
        <img
            key={subject_ID + "_img"}
            src={url}
            alt={subject_ID}
            title={subject_ID}
            className="subject-image"
        />
    )
}
