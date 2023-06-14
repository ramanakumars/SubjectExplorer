import React from "react";
import Plot from "react-plotly.js";

export const blue = "#2e86c1";
export const red = "#922b21";

export default class SubjectPlotter extends React.Component {
    constructor(props) {
        super(props);
        // this.state = {};
        this.state = {
            data: props.data,
            layout: props.layout,
            n_vars: props.variables.length,
            subject_data: props.subject_data,
            plot_name: props.plot_name,
        };

        this.handleHover = this.handleHover.bind(this);
        this.handleSelect = this.handleSelect.bind(this);
        this.resetSelection = this.resetSelection.bind(this);
        this.plot = React.createRef();
    }

    handleHover(event_data) {
        var data = [];
        var colors = [];
        if (this.state.plot_name === "hist") {
            var binNumber = [];
            for (var i = 0; i < event_data.points[0].pointNumbers.length; i++) {
                data.push(this.state.subject_data[event_data.points[0].pointNumbers[i]]);
                binNumber.push(event_data.points[0].binNumber);
            }

            binNumber = [...new Set(binNumber)];

            // change the bin corresponding to the hover data
            colors = new Array(this.state.data[0].marker.color.length).fill(blue);
            for (i = 0; i < binNumber.length; i++) {
                colors[binNumber[i]] = red;
            }
        } else if (this.state.plot_name === "scatter") {
            colors = new Array(this.state.data[0].x.length).fill(blue);
            for (i = 0; i < event_data.points.length; i++) {
                data.push(this.state.subject_data[event_data.points[i].pointNumber]);
                colors[event_data.points[i].pointNumber] = red;
            }
        }

        var state_data = this.state.data[0];
        state_data.marker.color = colors;
        this.setState({ data: [state_data] });

        this.props.handleHover(data);
    }

    handleSelect(event_data) {
        if (event_data === undefined) {
            return;
        }

        var data = [];
        if (this.state.plot_name === "hist") {
            for (var j = 0; j < event_data.points.length; j++) {
                for (var i = 0; i < event_data.points[j].pointNumbers.length; i++) {
                    data.push(this.state.subject_data[event_data.points[0].pointNumbers[i]]);
                }
            }
        } else if (this.state.plot_name === "scatter") {
            for (i = 0; i < event_data.points.length; i++) {
                data.push(this.state.subject_data[event_data.points[i].pointNumber]);
            }
        }

        this.props.handleSelect(data);
    }

    resetSelection() {
        var data = [];
        if (this.state.plot_name === "hist") {
            for (var i = 0; i < this.state.subject_data.length; i++) {
                data.push(this.state.subject_data[i]);
            }
        } else if (this.state.plot_name === "scatter") {
            for (i = 0; i < this.state.subject_data.length; i++) {
                data.push(this.state.subject_data[i]);
            }
        }

        this.props.handleSelect(data);
    }

    updatePlot = (new_data, new_layout) => {
        var data = this.state.data[0];

        // update the data variables
        Object.entries(new_data).map(([k, d]) => (
            data[k] = Object.assign({}, data[k], d)
        ));

        var layout = this.state.layout;

        // update the data variables
        Object.entries(new_layout).map(([k, d]) => (
            layout[k] = Object.assign({}, layout[k], d)
        ));

        this.setState({ data: [data], layout: layout });
    }

    render() {
        if (this.state.data != null) {
            return (
                <div id="plot">
                    <Plot
                        ref={this.plot}
                        data={this.state.data}
                        layout={this.state.layout}
                        onHover={this.handleHover}
                        onSelected={this.handleSelect}
                        onDeselect={this.resetSelection}
                    />
                </div>
            );
        } else {
            return <div id="plot"></div>;
        }
    }
}

