import React, { useState, useEffect } from "react";
import { getSubjectTalkPage } from '../util/zoo_utils'

export default function Subject({metadata}) {
    const [followUrl, setFollowURL] = useState('');

    useEffect(() => {
        getSubjectTalkPage(metadata.subject_ID).then((url) => setFollowURL(url));
    }, []);

    return (
        <span key={metadata.subject_ID + "_span"} style={metadata.style}>
            <a href={followUrl} target="_blank" rel="noreferrer">
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
