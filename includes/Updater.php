<?php
/**
 * ClassAct Updater
 *
 * A simple, secure updater class for ClassAct plugin using a custom update server.
 *
 * @package     ClassAct
 * @author      Dave Ryan
 * @copyright   Copyright (c) 2025, Dave Ryan
 * @license     GPL-2.0+
 */

namespace ClassAct;

// Exit if accessed directly
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Updater Class
 *
 * Handles checking for updates and integrating with the WordPress update system.
 */
class Updater {

	/**
	 * The API endpoint URL
	 *
	 * @var string
	 */
	private $api_url = 'https://updates.wpadmin.app/';

	/**
	 * The plugin slug
	 *
	 * @var string
	 */
	private $plugin_slug;

	/**
	 * The plugin basename
	 *
	 * @var string
	 */
	private $plugin_basename;

	/**
	 * The current plugin version
	 *
	 * @var string
	 */
	private $version;

	/**
	 * Cache key for update data
	 *
	 * @var string
	 */
	private $cache_key;

	/**
	 * Cache expiration in hours
	 *
	 * @var int
	 */
	private $cache_expiration = 12;

	/**
	 * Initialize the updater
	 *
	 * @param string $plugin_file   Full path to the plugin file.
	 * @param string $plugin_slug   The slug used for the plugin on the update server.
	 * @param string $version       Current plugin version.
	 */
	public function __construct( $plugin_file, $plugin_slug, $version ) {
		// Set class properties
		$this->plugin_basename = plugin_basename( $plugin_file );
		$this->plugin_slug = sanitize_key( $plugin_slug );
		$this->version = sanitize_text_field( $version );
		$this->cache_key = 'classact_' . $this->plugin_slug . '_update_data';

		// Hook into WordPress update system
		add_filter( 'pre_set_site_transient_update_plugins', array( $this, 'check_for_update' ) );
		
		// Filter the plugin API response for detailed information
		add_filter( 'plugins_api', array( $this, 'plugins_api_filter' ), 10, 3 );
		
		// Clean up after ourselves by removing the filter when the plugin is updated
		add_action( 'upgrader_process_complete', array( $this, 'clear_update_cache' ), 10, 2 );
		
		// Add our self-hosted plugin updater message
		add_filter( 'plugin_row_meta', array( $this, 'add_plugin_update_info' ), 10, 2 );
	}
	
	/**
	 * Set the API URL
	 *
	 * @param string $url The URL to set.
	 */
	public function set_api_url( $url ) {
		$this->api_url = esc_url_raw( $url );
	}
	
	/**
	 * Set cache expiration in hours
	 *
	 * @param int $hours Hours until cache expires.
	 */
	public function set_cache_expiration( $hours ) {
		$this->cache_expiration = absint( $hours );
	}

	/**
	 * Add information about the update server to the plugin row
	 *
	 * @param array  $plugin_meta The array of metadata.
	 * @param string $plugin_file The plugin filename.
	 * @return array Modified plugin metadata array.
	 */
	public function add_plugin_update_info( $plugin_meta, $plugin_file ) {
		if ( $plugin_file === $this->plugin_basename ) {
			$plugin_meta[] = sprintf(
				'<span class="classact-update-info">%s</span>',
				esc_html__( 'Updates via Cloudflare & GitHub', 'classact' )
			);
		}
		return $plugin_meta;
	}

	/**
	 * Check for updates when WordPress checks for updates
	 *
	 * @param object $transient The update_plugins transient object.
	 * @return object Modified transient object.
	 */
	public function check_for_update( $transient ) {
		if ( empty( $transient->checked ) ) {
			return $transient;
		}

		// Get update data
		$update_data = $this->get_update_data();
		
		if ( false === $update_data ) {
			return $transient;
		}

		// If there's a newer version, add it to the transient
		if ( isset( $update_data->version ) && version_compare( $this->version, $update_data->version, '<' ) ) {
			$plugin_info = new \stdClass();
			$plugin_info->slug = $this->plugin_slug;
			$plugin_info->plugin = $this->plugin_basename;
			$plugin_info->new_version = $update_data->version;
			$plugin_info->url = $update_data->homepage ?? '';
			$plugin_info->package = $update_data->download_url ?? '';
			
			// Include icons if available
			if ( isset( $update_data->icons ) && is_object( $update_data->icons ) ) {
				$plugin_info->icons = (array) $update_data->icons;
			}
			
			// Include banners if available
			if ( isset( $update_data->banners ) && is_object( $update_data->banners ) ) {
				$plugin_info->banners = (array) $update_data->banners;
			}

			// Add tested up to if available
			if ( isset( $update_data->tested ) ) {
				$plugin_info->tested = $update_data->tested;
			}
			
			// Add requires PHP if available
			if ( isset( $update_data->requires_php ) ) {
				$plugin_info->requires_php = $update_data->requires_php;
			}
			
			$transient->response[ $this->plugin_basename ] = $plugin_info;
		}

		return $transient;
	}

	/**
	 * Provide plugin information for the WordPress plugin API
	 *
	 * @param false|object|array $result The result object or array.
	 * @param string             $action The API action being performed.
	 * @param object             $args   Arguments for the API request.
	 * @return false|object The API response or unchanged result.
	 */
	public function plugins_api_filter( $result, $action, $args ) {
		// Only filter for plugin information API requests for our plugin
		if ( 'plugin_information' !== $action || ! isset( $args->slug ) || $args->slug !== $this->plugin_slug ) {
			return $result;
		}

		$update_data = $this->get_update_data();
		
		if ( false === $update_data ) {
			return $result;
		}

		// Convert to the format WordPress expects
		$api_response = new \stdClass();
		$api_response->name = $update_data->name ?? $this->plugin_slug;
		$api_response->slug = $this->plugin_slug;
		$api_response->version = $update_data->version;
		$api_response->author = $update_data->author ?? '';
		$api_response->homepage = $update_data->homepage ?? '';
		$api_response->requires = $update_data->requires ?? '';
		$api_response->tested = $update_data->tested ?? '';
		$api_response->requires_php = $update_data->requires_php ?? '';
		$api_response->downloaded = 0;
		$api_response->download_link = $update_data->download_url ?? '';
		
		// Add banners if available
		if ( isset( $update_data->banners ) && is_object( $update_data->banners ) ) {
			$api_response->banners = (array) $update_data->banners;
		}
		
		// Add icons if available
		if ( isset( $update_data->icons ) && is_object( $update_data->icons ) ) {
			$api_response->icons = (array) $update_data->icons;
		}
		
		// Add sections if available (description, changelog, etc.)
		if ( isset( $update_data->sections ) && is_object( $update_data->sections ) ) {
			$api_response->sections = (array) $update_data->sections;
		} else {
			$api_response->sections = array(
				'description' => isset( $update_data->description ) ? $update_data->description : '',
				'changelog' => isset( $update_data->changelog ) ? $update_data->changelog : '',
			);
		}

		return $api_response;
	}

	/**
	 * Get plugin update data from the API
	 *
	 * @return false|object Update data or false on error
	 */
	private function get_update_data() {
		// Check cache first
		$cached_data = get_transient( $this->cache_key );
		if ( false !== $cached_data ) {
			return json_decode( $cached_data );
		}

		// Build the request URL
		$request_params = array(
			'plugin_slug' => $this->plugin_slug,
			'version' => $this->version,
		);
		
		$request_url = add_query_arg( $request_params, $this->api_url );

		// Make the request with proper timeout and security
		$response = wp_remote_get( 
			$request_url, 
			array(
				'timeout' => 10,
				'sslverify' => true,
				'headers' => array(
					'Accept' => 'application/json',
				),
			) 
		);

		// Handle errors
		if ( is_wp_error( $response ) || 200 !== wp_remote_retrieve_response_code( $response ) ) {
			return false;
		}

		// Parse the response
		$response_body = wp_remote_retrieve_body( $response );
		$update_data = json_decode( $response_body );

		// Validate the response
		if ( ! is_object( $update_data ) || empty( $update_data->version ) ) {
			return false;
		}

		// Cache the result
		set_transient( $this->cache_key, $response_body, $this->cache_expiration * HOUR_IN_SECONDS );

		return $update_data;
	}

	/**
	 * Clear update cache when plugin is updated
	 *
	 * @param \WP_Upgrader $upgrader WP_Upgrader instance.
	 * @param array       $options  Array of bulk item update data.
	 */
	public function clear_update_cache( $upgrader, $options ) {
		if ( 'update' === $options['action'] && 'plugin' === $options['type'] ) {
			// Check if our plugin was updated
			if ( isset( $options['plugins'] ) && is_array( $options['plugins'] ) ) {
				if ( in_array( $this->plugin_basename, $options['plugins'], true ) ) {
					// Clear our transient
					delete_transient( $this->cache_key );
				}
			}
		}
	}
}