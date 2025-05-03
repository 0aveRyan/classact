<?php
/**
 * Tests for the ClassAct autoloader.
 *
 * @package ClassAct
 * @subpackage Tests
 */

/**
 * Test the ClassAct autoloader functionality.
 */
class Test_Autoloader extends WP_UnitTestCase {

    /**
     * The path to a temporary test class file.
     *
     * @var string
     */
    private $test_class_file;

    /**
     * Set up the test.
     */
    public function setUp() : void {
        parent::setUp();
        
        // Create a temporary test class file
        $this->test_class_file = CLASSACT_PLUGIN_DIR . '/includes/TestAutoload.php';
        file_put_contents( $this->test_class_file, '<?php
namespace ClassAct;
class TestAutoload {
    public function test_method() {
        return "Autoload successful";
    }
}' );
    }

    /**
     * Test that the autoloader loads ClassAct namespace classes.
     */
    public function test_autoloader_loads_classact_classes() {
        // Attempt to use the test class that should be autoloaded
        $test_class = new \ClassAct\TestAutoload();
        
        // Check that the class was loaded and the method works
        $this->assertEquals( 'Autoload successful', $test_class->test_method() );
    }
    
    /**
     * Test that the autoloader doesn't attempt to load non-ClassAct classes.
     */
    public function test_autoloader_ignores_non_classact_classes() {
        // Create a flag to check if the autoloader is triggered
        $autoloader_triggered = false;
        
        // Create a fake autoloader function to check if it gets called
        $test_autoloader = function( $class ) use ( &$autoloader_triggered ) {
            // Check if it's a non-ClassAct class
            if ( strpos( $class, 'ClassAct\\' ) !== 0 && strpos( $class, 'NonClassAct\\' ) === 0 ) {
                $autoloader_triggered = true;
            }
        };
        
        // Register our test autoloader
        spl_autoload_register( $test_autoloader );
        
        // Try to load a non-existent non-ClassAct class
        // This should not be handled by the ClassAct autoloader
        @class_exists( 'NonClassAct\\TestClass' );
        
        // Unregister our test autoloader
        spl_autoload_unregister( $test_autoloader );
        
        // The ClassAct autoloader should not have tried to handle this
        $this->assertFalse( $autoloader_triggered );
    }
    
    /**
     * Test that the autoloader correctly maps namespace structure to file paths.
     */
    public function test_autoloader_maps_namespaces_to_paths() {
        // Create a nested namespace test class
        $nested_dir = CLASSACT_PLUGIN_DIR . '/includes/Nested';
        $nested_file = $nested_dir . '/TestClass.php';
        
        // Create directory
        if ( ! file_exists( $nested_dir ) ) {
            mkdir( $nested_dir, 0777, true );
        }
        
        // Create test file
        file_put_contents( $nested_file, '<?php
namespace ClassAct\\Nested;
class TestClass {
    public function test_method() {
        return "Nested autoload successful";
    }
}' );
        
        // Attempt to use the nested class
        $test_class = new \ClassAct\Nested\TestClass();
        
        // Check that the class was loaded and the method works
        $this->assertEquals( 'Nested autoload successful', $test_class->test_method() );
        
        // Clean up
        unlink( $nested_file );
        rmdir( $nested_dir );
    }
    
    /**
     * Test that the autoloader correctly handles non-existent files.
     */
    public function test_autoloader_handles_nonexistent_files() {
        // Try to load a non-existent ClassAct class
        // This shouldn't cause any errors, just fail to load
        $class_exists = @class_exists( 'ClassAct\\NonExistentClass' );
        
        // The class should not exist
        $this->assertFalse( $class_exists );
    }

    /**
     * Clean up after the test.
     */
    public function tearDown() : void {
        // Remove the temporary test class file
        if ( file_exists( $this->test_class_file ) ) {
            unlink( $this->test_class_file );
        }
        
        parent::tearDown();
    }
}