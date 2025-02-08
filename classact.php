<?php
/**
 * Plugin Name: ClassAct
 * Plugin URI: https://daveryan.co
 * Description: A microplugin for acting on Additional CSS classes per-block in the WordPress Editor.
 * Version: 1.0.0
 * Author: Dave Ryan
 * Author URI: https://daveryan.co
 * License: GPL-2.0+
 * License URI: http://www.gnu.org/licenses/gpl-2.0.txt
 * Text Domain: classact
 * Domain Path: /languages
 * 
 * @package ClassAct
 * @version 1.0.0
 */

defined( 'ABSPATH' ) || exit;

/**
 * Plugin initialization class
 */
class ClassAct_Plugin {
    /**
     * Constructor
     */
    public function __construct() {
        $this->define_constants();
        $this->init_hooks();
    }

    /**
     * Define plugin constants
     */
    private function define_constants() {
        define( 'CLASSACT_VERSION', '1.0.0' );
        define( 'CLASSACT_FILE', __FILE__ );
        define( 'CLASSACT_PATH', plugin_dir_path( CLASSACT_FILE ) );
        define( 'CLASSACT_URL', plugin_dir_url( CLASSACT_FILE ) );
        define( 'CLASSACT_BUILD_DIR', CLASSACT_PATH . 'build/' . CLASSACT_VERSION );
        define( 'CLASSACT_BUILD_URL', CLASSACT_URL . 'build/' . CLASSACT_VERSION );
    }

    /**
     * Initialize hooks
     */
    private function init_hooks() {
        add_action( 'init', array( $this, 'load_textdomain' ) );
        add_action( 'enqueue_block_editor_assets', array( $this, 'enqueue_editor_assets' ) );
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

        wp_set_script_translations( 'classact-editor', 'classact' );
    }
}

// Initialize plugin
new ClassAct_Plugin();
