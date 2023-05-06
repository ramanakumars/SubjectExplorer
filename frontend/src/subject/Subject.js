import React from "react";

export default class Subject extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            ...props.metadata
        };
    }

    render() {
        return (
            <span key={this.state.subject_ID + "_span"} style={this.state.style}>
                <a href={"/subject/" + this.state.subject_ID} target="_blank" rel="noreferrer">
                    {this.state.url.length == 1 &&
                    <SingleSubjectImage
                        subject_ID={this.state.subject_ID}
                        url={this.state.url}
                    />
                    }
                </a>
            </span>
        );
    }
}

class SingleSubjectImage extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            url: props.url,
            subject_ID: props.subject_ID
        };
    }

    render() {
        return (
            <img
                key={this.state.subject_ID + "_img"}
                src={this.state.url}
                alt={this.state.subject_ID}
                title={this.state.subject_ID}
                className="subject-image"
            />
        )
    }
}
