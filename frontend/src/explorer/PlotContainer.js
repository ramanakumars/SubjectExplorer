import React from "react";
const plotly_type = { 'hist': 'histogram', 'scatter': 'scattergl' };
export const blue = "#2e86c1";
export const red = "#922b21";

export default class PlotContainer extends React.Component {
    /*
     * Main display component for the Plotly plots and the subject images
     * also handles the data distribution between the plotly components
     * and the subject image display
     */

    constructor(props) {
        super(props);

        // create links to child components for plotting the
        // subject images and the plotly component
        this.subject_images = React.createRef();
        this.subject_plotter = React.createRef();
        this.hover_images = React.createRef();

        // create handlers for hovering over/selecting the plotly data
        this.handleHover = this.handleHover.bind(this);
        this.handleSelect = this.handleSelect.bind(this);
    }

    set_data(plot_variables, layout, plot_type, int_vars, float_vars, bool_vars) {
        /*
         * main function for setting the data received from the backend
         * immediately calls `filter_PJ` which calls the
         * `set_plot_data` to set the plotly data
         */

        var data = {}
        if (plot_type === "hist") {
            var metadata_key = plot_variables['x']

            var values = this.state.subject_data.map((data) => (
                data[metadata_key]
            ));

            var binstart = Math.floor(Math.min(...values));
            var binend = Math.ceil(Math.max(...values));
            var nbins = 50;
            var binwidth = (binend - binstart) / nbins;

            data = {
                'x': values, 'type': plotly_type[plot_type],
                'xbins': { 'start': binstart, 'end': binend, 'size': binwidth },
                'nbinsx': nbins,
                'marker': { 'color': Array(nbins).fill(blue) }
            };
        } else if (plot_type === "scatter") {
            var data_x = this.state.subject_data.map((data) => (
                data[plot_variables['x']]));
            var data_y = this.state.subject_data.map((data) => (
                data[plot_variables['y']]));

            data = {
                'x': data_x, 'y': data_y, 'mode': 'markers',
                'type': plotly_type[plot_type],
                'marker': { 'color': Array(data_x.length).fill("dodgerblue") }
            };
        }

        this.setState(
            {
                data: data,
                layout: layout,
                plot_name: plot_type,
            },
            function() {
                this.filter(int_vars, float_vars, bool_vars);
            }
        );
    }



    updatePlot = (new_data, new_layout) => {
        this.subject_plotter.current.updatePlot(new_data, new_layout);
    }

    render() {
        return;
    }
}

