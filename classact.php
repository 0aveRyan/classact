<?php
/**
 * Plugin Name: ClassAct
 * Plugin URI: https://daveryan.co
 * Description: A miniplugin for acting on Additional CSS classes per-block in the WordPress Editor.
 * Version: 2.0.0
 * Author: Dave Ryan
 * Author URI: https://daveryan.co
 * License: GPL-2.0+
 * License URI: http://www.gnu.org/licenses/gpl-2.0.txt
 * Text Domain: classact
 * Domain Path: /languages
 * 
 * @package ClassAct
 * @version 2.0.0
 */

defined( 'ABSPATH' ) || exit;

// Define plugin constants
if ( ! defined( 'CLASSACT_VERSION' ) ) {
    define( 'CLASSACT_VERSION', '2.0.0' );
}
if ( ! defined( 'CLASSACT_FILE' ) ) {
    define( 'CLASSACT_FILE', __FILE__ );
}
if ( ! defined( 'CLASSACT_PATH' ) ) {
    define( 'CLASSACT_PATH', plugin_dir_path( CLASSACT_FILE ) );
}
if ( ! defined( 'CLASSACT_URL' ) ) {
    define( 'CLASSACT_URL', plugin_dir_url( CLASSACT_FILE ) );
}
if ( ! defined( 'CLASSACT_BUILD_DIR' ) ) {
    define( 'CLASSACT_BUILD_DIR', CLASSACT_PATH . 'build/' . CLASSACT_VERSION );
}
if ( ! defined( 'CLASSACT_BUILD_URL' ) ) {
    define( 'CLASSACT_BUILD_URL', CLASSACT_URL . 'build/' . CLASSACT_VERSION );
}
if( ! defined( 'CLASSACT_DISABLE_AUTOUPDATE' ) ) {
    define( 'CLASSACT_DISABLE_AUTOUPDATE', 'false' );
}

// Autoloader for plugin classes
spl_autoload_register( function( $class ) {
    // Project-specific namespace prefix
    $prefix = 'ClassAct\\';
    
    // Check if the class uses the namespace prefix
    $len = strlen( $prefix );
    if ( strncmp( $prefix, $class, $len ) !== 0 ) {
        return;
    }
    
    // Get the relative class name
    $relative_class = substr( $class, $len );
    
    // Replace namespace separators with directory separators
    $file = CLASSACT_PATH . 'includes/' . str_replace( '\\', '/', $relative_class ) . '.php';
    
    // If the file exists, require it
    if ( file_exists( $file ) ) {
        require $file;
    }
} );

// Initialize the plugin
function classact_init() {
    return ClassAct\Plugin::instance();
}

// Start the plugin
classact_init();