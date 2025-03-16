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

// Load updater class
require_once CLASSACT_PATH . 'updates.php';

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
    $file = CLASSACT_PATH . str_replace( '\\', '/', $relative_class ) . '.php';
    
    // If the file exists, require it
    if ( file_exists( $file ) ) {
        require $file;
    }
} );

/**
 * Main plugin class
 */
namespace ClassAct;

/**
 * Plugin initialization class
 */
class Plugin {
    /**
     * Instance of this class
     *
     * @var Plugin
     */
    private static $instance = null;
    
    /**
     * Get singleton instance
     *
     * @return Plugin Instance of plugin class
     */
    public static function instance() {
        if ( is_null( self::$instance ) ) {
            self::$instance = new self();
        }
        return self::$instance;
    }
    
    /**
     * Constructor
     */
    private function __construct() {
        $this->init_hooks();
        $this->init_updater();
    }
    
    /**
     * Initialize hooks
     */
    private function init_hooks() {
        add_action( 'init', array( $this, 'load_textdomain' ) );
        add_action( 'enqueue_block_editor_assets', array( $this, 'enqueue_editor_assets' ) );
    }
    
    /**
     * Initialize the updater
     */
    private function init_updater() {
        // Only initialize the updater in the admin area
        if ( is_admin() && ! wp_doing_ajax() ) {
            new Updater(
                CLASSACT_FILE,
                'classact',
                CLASSACT_VERSION
            );
        }
    }
    
    /**
     * Load plugin textdomain
     */
    public function load_textdomain() {
        load_plugin_textdomain( 'classact', false, dirname( plugin_basename( CLASSACT_FILE ) ) . '/languages' );
    }
    
    /**
     * Enqueue editor assets
     */
    public function enqueue_editor_assets() {
        $asset_file = include( CLASSACT_BUILD_DIR . '/editor.asset.php' );
        
        wp_enqueue_script(
            'classact-editor',
            CLASSACT_BUILD_URL . '/editor.js',
            $asset_file['dependencies'],
            $asset_file['version']
        );
        
        wp_enqueue_style(
            'classact-editor',
            CLASSACT_BUILD_URL . '/editor.css',
            array(),
            $asset_file['version']
        );
        
        wp_set_script_translations( 'classact-editor', 'classact' );
    }
}

// Initialize the plugin
function init() {
    return Plugin::instance();
}

// Start the plugin
init();