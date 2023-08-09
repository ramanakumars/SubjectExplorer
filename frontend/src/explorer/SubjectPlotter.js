import React, { useState, useEffect } from "react";
import Plot from "react-plotly.js";

export const blue = "#2e86c1";
export const red = "#922b21";

export default function SubjectPlotter({ data, layout, subject_data, plot_type, handleHover, handleSelect }) {

    const [_data, setData] = useState(null);

    useEffect(() => {
        setData(data);
    }, [data]);

    const _handleHover = (event_data) => {
        var _subject_data;
        var colors = [];
        if (plot_type === "hist") {
            _subject_data = event_data.points[0].pointNumbers.map((point) => (subject_data[point]));

            // change the bin corresponding to the hover data
            colors = new Array(_data[0].marker.color.length).fill(blue);
            colors[event_data.points[0].binNumber] = red;
        } else if (plot_type === "scatter") {
            _subject_data = event_data.points.map((point) => (subject_data[point.pointNumber]));
            colors = new Array(_data[0].marker.color.length).fill(blue);
            colors[event_data.points[0].pointNumber] = red;
        }

        var state_data = _data[0];
        state_data.marker.color = colors;
        handleHover(_subject_data);
        setData([state_data]);
    }

    const _handleSelect = (event_data) => {
        if (event_data === undefined) {
            return;
        }

        var data = [];
        if (plot_type === "hist") {
            for (var j = 0; j < event_data.points.length; j++) {
                for (var i = 0; i < event_data.points[j].pointNumbers.length; i++) {
                    data.push(subject_data[event_data.points[0].pointNumbers[i]]);
                }
            }
        } else if (plot_type === "scatter") {
            for (i = 0; i < event_data.points.length; i++) {
                data.push(subject_data[event_data.points[i].pointNumber]);
            }
        }

        handleSelect(data);
    }

    const _resetSelection = () => {
        var data = [];
        if (plot_type === "hist") {
            for (var i = 0; i < subject_data.length; i++) {
                data.push(subject_data[i]);
            }
        } else if (plot_type === "scatter") {
            for (i = 0; i < subject_data.length; i++) {
                data.push(subject_data[i]);
            }
        }

        handleSelect(data);
    }

    return (
        <>
            {(_data && layout) ? (
                <Plot
                    data={_data}
                    layout={layout}
                    onClick={_handleHover}
                    onSelected={_handleSelect}
                    onDeselect={_resetSelection}
                />
            ) : (<></>)
            }
        </>
    )
}

