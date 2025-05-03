<?php
/**
 * Tests for the Plugin class.
 *
 * @package ClassAct
 * @subpackage Tests
 */

use ClassAct\Plugin;

/**
 * Test the ClassAct Plugin class.
 */
class Test_Plugin extends WP_UnitTestCase {

    /**
     * The Plugin instance.
     *
     * @var Plugin
     */
    private $plugin;

    /**
     * Set up the test.
     */
    public function setUp() : void {
        parent::setUp();
        
        // Get the plugin instance
        $this->plugin = Plugin::instance();
    }

    /**
     * Test the singleton instance method.
     */
    public function test_instance() {
        // Get the singleton instance
        $instance1 = Plugin::instance();
        $instance2 = Plugin::instance();
        
        // Test that the instances are the same
        $this->assertSame( $instance1, $instance2 );
        
        // Test that the instance is of the correct class
        $this->assertInstanceOf( Plugin::class, $instance1 );
    }
    
    /**
     * Test that the load_textdomain method works correctly.
     */
    public function test_load_textdomain() {
        // Mock the load_plugin_textdomain function
        $mock_function_called = false;
        $plugin_basename = plugin_basename( CLASSACT_FILE );
        
        // Add a filter to intercept the load_plugin_textdomain call
        add_filter( 'load_textdomain_mofile', function( $mofile, $domain ) use ( &$mock_function_called ) {
            if ( 'classact' === $domain ) {
                $mock_function_called = true;
                // Return a non-existent file to prevent actually loading anything
                return '/non/existent/file.mo';
            }
            return $mofile;
        }, 10, 2 );
        
        // Call the method
        $this->plugin->load_textdomain();
        
        // Check that the function was called
        $this->assertTrue( $mock_function_called );
        
        // Remove the filter
        remove_all_filters( 'load_textdomain_mofile' );
    }
    
    /**
     * Test that the enqueue_editor_assets method properly registers scripts and styles.
     */
    public function test_enqueue_editor_assets() {
        // Define test asset data
        $test_version = '1.2.3';
        $test_deps = array( 'wp-blocks', 'wp-editor' );
        
        // Create a mock asset file
        $mock_asset_data = array(
            'dependencies' => $test_deps,
            'version' => $test_version,
        );
        
        // Add a filter to intercept the include call
        add_filter( 'pre_option_classact_asset_include', function() use ( $mock_asset_data ) {
            return $mock_asset_data;
        } );
        
        // Mock the WordPress functions
        $wp_enqueue_script_args = null;
        $wp_enqueue_style_args = null;
        $wp_set_script_translations_args = null;
        $wp_localize_script_args = null;
        
        // Replace wp_enqueue_script
        $this->_replace_wp_function( 'wp_enqueue_script', function() use ( &$wp_enqueue_script_args ) {
            $wp_enqueue_script_args = func_get_args();
            return true;
        } );
        
        // Replace wp_enqueue_style
        $this->_replace_wp_function( 'wp_enqueue_style', function() use ( &$wp_enqueue_style_args ) {
            $wp_enqueue_style_args = func_get_args();
            return true;
        } );
        
        // Replace wp_set_script_translations
        $this->_replace_wp_function( 'wp_set_script_translations', function() use ( &$wp_set_script_translations_args ) {
            $wp_set_script_translations_args = func_get_args();
            return true;
        } );
        
        // Replace wp_localize_script
        $this->_replace_wp_function( 'wp_localize_script', function() use ( &$wp_localize_script_args ) {
            $wp_localize_script_args = func_get_args();
            return true;
        } );
        
        // Mock the include function to return our mock asset data
        $this->_replace_wp_function( 'include', function( $file ) use ( $mock_asset_data ) {
            if ( strpos( $file, 'editor.asset.php' ) !== false ) {
                return $mock_asset_data;
            }
            return include( $file );
        } );
        
        // Call the method
        $this->plugin->enqueue_editor_assets();
        
        // Check that wp_enqueue_script was called with the right arguments
        $this->assertNotNull( $wp_enqueue_script_args );
        $this->assertEquals( 'classact-editor', $wp_enqueue_script_args[0] );
        $this->assertContains( 'editor.js', $wp_enqueue_script_args[1] );
        $this->assertEquals( $test_deps, $wp_enqueue_script_args[2] );
        $this->assertEquals( $test_version, $wp_enqueue_script_args[3] );
        
        // Check that wp_enqueue_style was called with the right arguments
        $this->assertNotNull( $wp_enqueue_style_args );
        $this->assertEquals( 'classact-editor', $wp_enqueue_style_args[0] );
        $this->assertContains( 'editor.css', $wp_enqueue_style_args[1] );
        $this->assertEquals( array(), $wp_enqueue_style_args[2] );
        $this->assertEquals( $test_version, $wp_enqueue_style_args[3] );
        
        // Check that wp_set_script_translations was called
        $this->assertNotNull( $wp_set_script_translations_args );
        $this->assertEquals( 'classact-editor', $wp_set_script_translations_args[0] );
        $this->assertEquals( 'classact', $wp_set_script_translations_args[1] );
        
        // Check that wp_localize_script was called with keyboard shortcut
        $this->assertNotNull( $wp_localize_script_args );
        $this->assertEquals( 'classact-editor', $wp_localize_script_args[0] );
        $this->assertEquals( 'classactConfig', $wp_localize_script_args[1] );
        $this->assertArrayHasKey( 'keyboardShortcut', $wp_localize_script_args[2] );
        $this->assertArrayHasKey( 'modifier', $wp_localize_script_args[2]['keyboardShortcut'] );
        $this->assertArrayHasKey( 'character', $wp_localize_script_args[2]['keyboardShortcut'] );
    }
    
    /**
     * Test that the keyboard shortcut filter works.
     */
    public function test_keyboard_shortcut_filter() {
        // Define a custom keyboard shortcut
        $custom_shortcut = array(
            'modifier' => 'ctrl',
            'character' => 'x',
        );
        
        // Add a filter to modify the keyboard shortcut
        add_filter( 'classact_keyboard_shortcut', function() use ( $custom_shortcut ) {
            return $custom_shortcut;
        } );
        
        // Mock the wp_localize_script function
        $wp_localize_script_args = null;
        $this->_replace_wp_function( 'wp_localize_script', function() use ( &$wp_localize_script_args ) {
            $wp_localize_script_args = func_get_args();
            return true;
        } );
        
        // Call the method
        $this->plugin->enqueue_editor_assets();
        
        // Check that wp_localize_script was called with our custom shortcut
        $this->assertNotNull( $wp_localize_script_args );
        $this->assertEquals( 'classactConfig', $wp_localize_script_args[1] );
        $this->assertEquals( $custom_shortcut, $wp_localize_script_args[2]['keyboardShortcut'] );
        
        // Remove the filter
        remove_all_filters( 'classact_keyboard_shortcut' );
    }
    
    /**
     * Helper method to replace WordPress functions for testing.
     *
     * @param string   $function_name The name of the function to replace.
     * @param callable $replacement   The replacement function.
     */
    private function _replace_wp_function( $function_name, $replacement ) {
        global $wp_filter;
        
        if ( ! function_exists( 'runkit_function_redefine' ) ) {
            $this->markTestSkipped( 'This test requires the runkit extension.' );
            return;
        }
        
        if ( function_exists( $function_name ) ) {
            runkit_function_redefine( $function_name, '', $replacement );
        }
    }

    /**
     * Clean up after the test.
     */
    public function tearDown() : void {
        // Remove any filters we added
        remove_all_filters( 'load_textdomain_mofile' );
        remove_all_filters( 'pre_option_classact_asset_include' );
        remove_all_filters( 'classact_keyboard_shortcut' );
        
        parent::tearDown();
    }
}