<?php
/**
 * Plugin Name: ClassAct
 * Plugin URI: https://daveryan.co
 * Description: A miniplugin for acting on Additional CSS classes per-block in the WordPress Editor.
 * Version: 2.1.0
 * Author: Dave Ryan
 * Author URI: https://daveryan.co
 * License: GPL-2.0+
 * License URI: http://www.gnu.org/licenses/gpl-2.0.txt
 * Text Domain: classact
 * Domain Path: /languages
 *
 * ClassAct enhances the WordPress block editor by providing a comprehensive interface
 * for managing CSS classes on blocks. It adds powerful tools for sorting, organizing,
 * and manipulating class names with an accessibility-focused design.
 *
 * @package ClassAct
 * @version 2.1.0
 */

// Prevent direct file access.
defined( 'ABSPATH' ) || exit;

/**
 * Plugin Constants
 *
 * These constants define the core plugin properties and paths used throughout
 * the plugin for file access, asset loading, and versioning.
 */

// Plugin version for cache busting and version checking.
if ( ! defined( 'CLASSACT_VERSION' ) ) {
	define( 'CLASSACT_VERSION', '2.1.0' );
}

// Main plugin file path.
if ( ! defined( 'CLASSACT_FILE' ) ) {
	define( 'CLASSACT_FILE', __FILE__ );
}

// Plugin directory path (with trailing slash).
if ( ! defined( 'CLASSACT_PATH' ) ) {
	define( 'CLASSACT_PATH', plugin_dir_path( CLASSACT_FILE ) );
}

// Plugin directory URL (with trailing slash).
if ( ! defined( 'CLASSACT_URL' ) ) {
	define( 'CLASSACT_URL', plugin_dir_url( CLASSACT_FILE ) );
}

// Build directory for compiled assets (with version-specific directory).
if ( ! defined( 'CLASSACT_BUILD_DIR' ) ) {
	define( 'CLASSACT_BUILD_DIR', CLASSACT_PATH . 'build/' . CLASSACT_VERSION );
}

// Build URL for compiled assets (with version-specific directory).
if ( ! defined( 'CLASSACT_BUILD_URL' ) ) {
	define( 'CLASSACT_BUILD_URL', CLASSACT_URL . 'build/' . CLASSACT_VERSION );
}

// Control automatic updates (set to true to disable).
if ( ! defined( 'CLASSACT_DISABLE_AUTOUPDATE' ) ) {
	define( 'CLASSACT_DISABLE_AUTOUPDATE', false );
}

/**
 * Plugin Autoloader
 *
 * Registers a PSR-4 compatible autoloader for the ClassAct namespace.
 * Maps namespace classes to their corresponding files in the includes directory.
 */
spl_autoload_register(
	function ( $class ) {
		// Project-specific namespace prefix.
		$prefix = 'ClassAct\\';

		// Check if the class uses the namespace prefix.
		$len = strlen( $prefix );
		if ( strncmp( $prefix, $class, $len ) !== 0 ) {
				// Not our namespace, let other autoloaders handle it.
				return;
		}

		// Get the relative class name (without namespace prefix).
		$relative_class = substr( $class, $len );

		// Replace namespace separators with directory separators and add .php extension.
		$file = CLASSACT_PATH . 'includes/' . str_replace( '\\', '/', $relative_class ) . '.php';

		// If the file exists, require it.
		if ( file_exists( $file ) ) {
			require $file;
		}
	}
);

/**
 * Initialize the ClassAct plugin
 *
 * Creates and returns the singleton instance of the main Plugin class.
 * This is the main entry point for the plugin's functionality.
 *
 * @return ClassAct\Plugin The initialized plugin instance
 */
function classact_init() {
	return ClassAct\Plugin::instance();
}

// Bootstrap the plugin.
classact_init();
