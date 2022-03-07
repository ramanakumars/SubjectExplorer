const webpack = require('webpack');
const config = {
    entry:  __dirname + '/index.js',
    devtool: 'inline-source-map',
    output: {
        path: __dirname + '/dist',
        filename: 'bundle.js',
    },
    resolve: {
        extensions: ['.js', '.jsx', '.css']
    },
  
    module: {
        rules: [
            {
                test: /\.(js|jsx)?/,
                exclude: /node_modules/,
                loader: 'babel-loader'
            }        
        ]
    }
};
module.exports = config;