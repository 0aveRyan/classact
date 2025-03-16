<?php
/**
 * Main Plugin Class
 *
 * @package ClassAct
 */

namespace ClassAct;

// Exit if accessed directly
defined( 'ABSPATH' ) || exit;

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
        if ( is_admin() && ! wp_doing_ajax() && CLASSACT_DISABLE_AUTOUPDATE !== 'true' ) {
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