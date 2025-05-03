<?php
/**
 * ClassAct PHPUnit Bootstrap File
 *
 * Bootstrap file for PHPUnit that sets up WordPress test environment.
 */

// Define plugin directory paths
define( 'CLASSACT_PLUGIN_DIR', dirname( dirname( dirname( __FILE__ ) ) ) );
define( 'CLASSACT_TESTS_DIR', CLASSACT_PLUGIN_DIR . '/tests/phpunit' );

// Path to the WordPress tests bootstrap file
$wp_tests_dir = getenv( 'WP_TESTS_DIR' );

if ( ! $wp_tests_dir ) {
    // Try a few common locations
    $potential_dirs = array(
        '/tmp/wordpress-tests-lib',
        '/var/www/wordpress-tests-lib',
        '/opt/wordpress-tests-lib',
        dirname( dirname( dirname( dirname( dirname( dirname( __FILE__ ) ) ) ) ) ) . '/tests/phpunit',
    );

    foreach ( $potential_dirs as $dir ) {
        if ( file_exists( $dir . '/includes/bootstrap.php' ) ) {
            $wp_tests_dir = $dir;
            break;
        }
    }
}

if ( ! $wp_tests_dir ) {
    echo "WordPress tests directory not found. Please set the WP_TESTS_DIR environment variable.\n";
    exit( 1 );
}

// Give access to tests_add_filter() function
require_once $wp_tests_dir . '/includes/functions.php';

/**
 * Manually load the plugin being tested.
 */
function _manually_load_plugin() {
    require CLASSACT_PLUGIN_DIR . '/classact.php';
}
tests_add_filter( 'muplugins_loaded', '_manually_load_plugin' );

// Create test helper functions and mock objects
require_once CLASSACT_TESTS_DIR . '/includes/class-test-helpers.php';

// Start up the WP testing environment
require $wp_tests_dir . '/includes/bootstrap.php';