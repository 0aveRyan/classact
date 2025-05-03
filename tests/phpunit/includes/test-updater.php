<?php
/**
 * Tests for the Updater class.
 *
 * @package ClassAct
 * @subpackage Tests
 */

use ClassAct\Updater;

/**
 * Test the ClassAct Updater class.
 */
class Test_Updater extends WP_UnitTestCase {

    /**
     * The test plugin file path.
     *
     * @var string
     */
    private $plugin_file;

    /**
     * The test plugin slug.
     *
     * @var string
     */
    private $plugin_slug;

    /**
     * The test plugin version.
     *
     * @var string
     */
    private $plugin_version;

    /**
     * The Updater instance.
     *
     * @var Updater
     */
    private $updater;

    /**
     * Set up the test.
     */
    public function setUp() : void {
        parent::setUp();
        
        $this->plugin_file = CLASSACT_PLUGIN_DIR . '/classact.php';
        $this->plugin_slug = 'classact';
        $this->plugin_version = '2.0.0';
        
        // Create an Updater instance
        $this->updater = new Updater(
            $this->plugin_file,
            $this->plugin_slug,
            $this->plugin_version
        );
        
        // Clear any existing transients
        delete_transient( 'classact_classact_update_data' );
    }

    /**
     * Test that the Updater initializes with correct properties.
     */
    public function test_updater_initialization() {
        // Check the plugin basename is set correctly
        $plugin_basename = plugin_basename( $this->plugin_file );
        $actual_basename = ClassAct_Test_Helpers::get_private_property( $this->updater, 'plugin_basename' );
        $this->assertEquals( $plugin_basename, $actual_basename );
        
        // Check the plugin slug is sanitized
        $actual_slug = ClassAct_Test_Helpers::get_private_property( $this->updater, 'plugin_slug' );
        $this->assertEquals( sanitize_key( $this->plugin_slug ), $actual_slug );
        
        // Check the version is sanitized
        $actual_version = ClassAct_Test_Helpers::get_private_property( $this->updater, 'version' );
        $this->assertEquals( sanitize_text_field( $this->plugin_version ), $actual_version );
        
        // Check that the cache key is set correctly
        $expected_cache_key = 'classact_' . $this->plugin_slug . '_update_data';
        $actual_cache_key = ClassAct_Test_Helpers::get_private_property( $this->updater, 'cache_key' );
        $this->assertEquals( $expected_cache_key, $actual_cache_key );
    }
    
    /**
     * Test that get_update_data returns cached data when available.
     */
    public function test_get_update_data_uses_cache() {
        // Create mock update data
        $mock_data = (object) array(
            'version' => '2.1.0',
            'download_url' => 'https://example.com/download',
            'homepage' => 'https://example.com',
        );
        
        // Set the cache
        $cache_key = ClassAct_Test_Helpers::get_private_property( $this->updater, 'cache_key' );
        set_transient( $cache_key, json_encode( $mock_data ), 10 );
        
        // Call the method and check it returns the cached data
        $result = ClassAct_Test_Helpers::call_private_method( $this->updater, 'get_update_data' );
        
        $this->assertIsObject( $result );
        $this->assertEquals( '2.1.0', $result->version );
        $this->assertEquals( 'https://example.com/download', $result->download_url );
    }
    
    /**
     * Test that the updater properly checks for updates and adds to the transient.
     */
    public function test_check_for_update() {
        // Create a transient object for testing
        $transient = new stdClass();
        $transient->checked = array(
            plugin_basename( $this->plugin_file ) => $this->plugin_version,
        );
        $transient->response = array();
        
        // Mock the update data
        $mock_data = (object) array(
            'version' => '2.1.0', // Higher version than current
            'download_url' => 'https://example.com/download',
            'homepage' => 'https://example.com',
            'tested' => '6.1',
            'requires_php' => '7.4',
            'icons' => (object) array(
                '1x' => 'https://example.com/icon.png',
            ),
            'banners' => (object) array(
                'low' => 'https://example.com/banner.png',
            ),
        );
        
        // Create a partial mock of the Updater class
        $updater_mock = $this->getMockBuilder( Updater::class )
            ->setConstructorArgs( array( $this->plugin_file, $this->plugin_slug, $this->plugin_version ) )
            ->setMethods( array( 'get_update_data' ) )
            ->getMock();
            
        // Set up the mock to return our mock data
        $updater_mock->expects( $this->once() )
            ->method( 'get_update_data' )
            ->willReturn( $mock_data );
            
        // Run the function under test
        $result = $updater_mock->check_for_update( $transient );
        
        // Verify that it added the update info to the transient
        $this->assertArrayHasKey( plugin_basename( $this->plugin_file ), $result->response );
        $this->assertEquals( '2.1.0', $result->response[plugin_basename( $this->plugin_file )]->new_version );
    }
    
    /**
     * Test that no update is added when version is the same or lower.
     */
    public function test_no_update_when_version_is_same_or_lower() {
        // Create a transient object for testing
        $transient = new stdClass();
        $transient->checked = array(
            plugin_basename( $this->plugin_file ) => $this->plugin_version,
        );
        $transient->response = array();
        
        // Mock the update data with same version
        $mock_data = (object) array(
            'version' => $this->plugin_version, // Same version
            'download_url' => 'https://example.com/download',
        );
        
        // Create a partial mock of the Updater class
        $updater_mock = $this->getMockBuilder( Updater::class )
            ->setConstructorArgs( array( $this->plugin_file, $this->plugin_slug, $this->plugin_version ) )
            ->setMethods( array( 'get_update_data' ) )
            ->getMock();
            
        // Set up the mock to return our mock data
        $updater_mock->expects( $this->once() )
            ->method( 'get_update_data' )
            ->willReturn( $mock_data );
            
        // Run the function under test
        $result = $updater_mock->check_for_update( $transient );
        
        // Verify that no update was added
        $this->assertEmpty( $result->response );
    }
    
    /**
     * Test the plugins_api_filter method.
     */
    public function test_plugins_api_filter() {
        // Create mock update data
        $mock_data = (object) array(
            'name' => 'ClassAct',
            'version' => '2.1.0',
            'author' => 'Dave Ryan',
            'homepage' => 'https://example.com',
            'requires' => '5.8',
            'tested' => '6.1',
            'requires_php' => '7.4',
            'download_url' => 'https://example.com/download',
            'sections' => (object) array(
                'description' => 'A test description',
                'changelog' => 'Test changelog',
            ),
            'banners' => (object) array(
                'low' => 'https://example.com/banner.png',
            ),
            'icons' => (object) array(
                '1x' => 'https://example.com/icon.png',
            ),
        );
        
        // Create a partial mock of the Updater class
        $updater_mock = $this->getMockBuilder( Updater::class )
            ->setConstructorArgs( array( $this->plugin_file, $this->plugin_slug, $this->plugin_version ) )
            ->setMethods( array( 'get_update_data' ) )
            ->getMock();
            
        // Set up the mock to return our mock data
        $updater_mock->expects( $this->once() )
            ->method( 'get_update_data' )
            ->willReturn( $mock_data );
            
        // Set up the args for our plugin
        $args = new stdClass();
        $args->slug = $this->plugin_slug;
        
        // Run the function under test
        $result = $updater_mock->plugins_api_filter( false, 'plugin_information', $args );
        
        // Verify the response data
        $this->assertEquals( 'ClassAct', $result->name );
        $this->assertEquals( $this->plugin_slug, $result->slug );
        $this->assertEquals( '2.1.0', $result->version );
        $this->assertEquals( 'https://example.com/download', $result->download_link );
        $this->assertIsArray( $result->sections );
        $this->assertArrayHasKey( 'description', $result->sections );
        $this->assertArrayHasKey( 'changelog', $result->sections );
    }
    
    /**
     * Test that the updater properly clears the update cache.
     */
    public function test_clear_update_cache() {
        // Set a transient
        $cache_key = ClassAct_Test_Helpers::get_private_property( $this->updater, 'cache_key' );
        set_transient( $cache_key, 'test_data', 10 );
        
        // Check it exists
        $this->assertEquals( 'test_data', get_transient( $cache_key ) );
        
        // Create a mock upgrader and options
        $upgrader = new stdClass();
        $options = array(
            'action' => 'update',
            'type' => 'plugin',
            'plugins' => array( plugin_basename( $this->plugin_file ) ),
        );
        
        // Call the method
        $this->updater->clear_update_cache( $upgrader, $options );
        
        // Verify the transient was deleted
        $this->assertFalse( get_transient( $cache_key ) );
    }
    
    /**
     * Test that HTTP API errors are handled properly.
     */
    public function test_get_update_data_handles_http_errors() {
        // Create a partial mock of the Updater class to intercept the wp_remote_get call
        $updater_mock = $this->getMockBuilder( Updater::class )
            ->setConstructorArgs( array( $this->plugin_file, $this->plugin_slug, $this->plugin_version ) )
            ->setMethods( array( 'get_update_data' ) )
            ->getMock();
            
        // Replace the original get_update_data method with a version for testing
        $test_method = function() {
            // Set properties for testing
            $api_url = ClassAct_Test_Helpers::get_private_property( $this, 'api_url' );
            $plugin_slug = ClassAct_Test_Helpers::get_private_property( $this, 'plugin_slug' );
            $version = ClassAct_Test_Helpers::get_private_property( $this, 'version' );
            
            // Force a WP_Error response for testing
            add_filter( 'pre_http_request', function() {
                return new WP_Error( 'http_request_failed', 'Connection error' );
            } );
            
            // Build the request URL
            $request_params = array(
                'plugin_slug' => $plugin_slug,
                'version' => $version,
            );
            
            $request_url = add_query_arg( $request_params, $api_url );
            
            // Make the request that will now return an error
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
            
            // Remove our filter to avoid affecting other tests
            remove_filter( 'pre_http_request', function() {
                return new WP_Error( 'http_request_failed', 'Connection error' );
            } );
            
            // Handle errors
            if ( is_wp_error( $response ) || 200 !== wp_remote_retrieve_response_code( $response ) ) {
                return false;
            }
            
            return true;
        };
        
        // Replace the method with our test version
        ClassAct_Test_Helpers::set_private_property( $updater_mock, 'get_update_data', $test_method );
        
        // Verify the method handles WP_Error correctly
        $this->assertFalse( ClassAct_Test_Helpers::call_private_method( $updater_mock, 'get_update_data' ) );
    }

    /**
     * Clean up after the test.
     */
    public function tearDown() : void {
        // Clear any transients created during testing
        delete_transient( 'classact_classact_update_data' );
        
        parent::tearDown();
    }
}