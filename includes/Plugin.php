<?php
/**
 * Main Plugin Class
 *
 * This file contains the main Plugin class which initializes the ClassAct plugin.
 * It handles all core functionality, including admin hooks, asset loading,
 * and automatic updates configuration.
 *
 * @package ClassAct
 * @since   1.0.0
 */

namespace ClassAct;

// Exit if accessed directly.
defined( 'ABSPATH' ) || exit;

/**
 * Plugin Core Class
 *
 * Handles the initialization and main functionality of the ClassAct plugin.
 * Uses the singleton pattern to ensure only one instance is created.
 *
 * @since 1.0.0
 */
class Plugin {
	/**
	 * The single instance of this class
	 *
	 * @since 1.0.0
	 * @access private
	 * @var Plugin|null
	 */
	private static $instance = null;

	/**
	 * Get singleton instance of the plugin
	 *
	 * Ensures only one instance of the plugin is loaded or can be loaded.
	 * Uses the singleton pattern to maintain a single instance across the site.
	 *
	 * @since 1.0.0
	 * @access public
	 * @static
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
	 * Private constructor to prevent creating a new instance directly
	 *
	 * Initializes the plugin by setting up hooks and the updater.
	 * This is called only once by the instance() method.
	 *
	 * @since 1.0.0
	 * @access private
	 */
	private function __construct() {
		$this->init_hooks();
		$this->init_updater();
	}

	/**
	 * Initialize WordPress hooks
	 *
	 * Sets up all the necessary WordPress action and filter hooks
	 * that the plugin needs to function properly.
	 *
	 * @since 1.0.0
	 * @access private
	 */
	private function init_hooks() {
		// Load translations when WordPress initializes.
		add_action( 'init', array( $this, 'load_textdomain' ) );

		// Load the editor assets only when the block editor is active.
		add_action( 'enqueue_block_editor_assets', array( $this, 'enqueue_editor_assets' ) );
	}

	/**
	 * Initialize the automatic update system
	 *
	 * Sets up the custom updater for the plugin when appropriate.
	 * Only runs in the admin area and when auto-updates aren't disabled.
	 *
	 * @since 1.0.0
	 * @access private
	 */
	private function init_updater() {
		// Only initialize the updater in the admin area.
		if ( is_admin() && ! wp_doing_ajax() && ! CLASSACT_DISABLE_AUTOUPDATE ) {
			new Updater(
				CLASSACT_FILE,
				'classact',
				CLASSACT_VERSION
			);
		}
	}

	/**
	 * Load plugin translations
	 *
	 * Loads the text domain for translations from the languages directory.
	 * Used for internationalizing the plugin.
	 *
	 * @since 1.0.0
	 * @access public
	 */
	public function load_textdomain() {
		load_plugin_textdomain( 'classact', false, dirname( plugin_basename( CLASSACT_FILE ) ) . '/languages' );
	}

	/**
	 * Enqueue block editor assets
	 *
	 * Loads the JavaScript and CSS assets for the block editor integration.
	 * This includes the main functionality for the ClassAct plugin.
	 *
	 * @since 1.0.0
	 * @access public
	 */
	public function enqueue_editor_assets() {
		// Get the asset information (version and dependencies).
		$asset_file = include CLASSACT_BUILD_DIR . '/editor.asset.php';

		// Enqueue the main editor script.
		wp_enqueue_script(
			'classact-editor',
			CLASSACT_BUILD_URL . '/editor.js',
			$asset_file['dependencies'],
			$asset_file['version'],
			true
		);

		// Enqueue the editor styles.
		wp_enqueue_style(
			'classact-editor',
			CLASSACT_BUILD_URL . '/editor.css',
			array(),
			$asset_file['version']
		);

		// Set up translations for the editor script.
		wp_set_script_translations( 'classact-editor', 'classact' );

		// Define default keyboard shortcut.
		$keyboard_shortcut = array(
			'modifier'  => 'alt',
			'character' => 'c',
		);

		// Allow filtering the keyboard shortcut.
		$keyboard_shortcut = apply_filters( 'classact_keyboard_shortcut', $keyboard_shortcut );

		// Localize the script with the keyboard shortcut.
		wp_localize_script(
			'classact-editor',
			'classactConfig',
			array(
				'keyboardShortcut' => $keyboard_shortcut,
			)
		);
	}
}
