const path = require( 'path' );
const { merge } = require( 'webpack-merge' );
const version = require( './package.json' ).version;

const classactConfig = {
	resolve: {
		alias: {
			'@classact': path.resolve( __dirname, 'src' ),
		},
	},
	entry: {
		editor: path.resolve( __dirname, 'src/editor/index.js' ),
	},
	output: {
		path: path.resolve( __dirname, 'build/' + version ),
	},
};

module.exports = merge(
	require( '@wordpress/scripts/config/webpack.config' ),
	classactConfig
);
