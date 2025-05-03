<?php
/**
 * ClassAct Test Helpers
 *
 * This file contains test helper functions and mock objects for unit testing.
 *
 * @package ClassAct
 * @subpackage Tests
 */

/**
 * Class ClassAct_Test_Helpers
 *
 * Helper methods and utilities for unit testing ClassAct plugin.
 */
class ClassAct_Test_Helpers {

    /**
     * Creates a mock for the WP_Error class.
     *
     * @param array $methods Methods to mock.
     * @return \PHPUnit\Framework\MockObject\MockObject
     */
    public static function get_wp_error_mock( $methods = array() ) {
        $methods = array_merge( array( 'get_error_code', 'get_error_message' ), $methods );
        return self::getMockBuilder( 'WP_Error' )
            ->setMethods( $methods )
            ->getMock();
    }

    /**
     * Creates a mock HTTP response for testing API calls.
     *
     * @param int    $response_code The HTTP response code.
     * @param string $body          The response body.
     * @param array  $headers       Response headers.
     * @return array A WordPress HTTP API response array.
     */
    public static function create_mock_http_response( $response_code = 200, $body = '', $headers = array() ) {
        return array(
            'headers'       => $headers,
            'body'          => $body,
            'response'      => array(
                'code'    => $response_code,
                'message' => get_status_header_desc( $response_code ),
            ),
            'cookies'       => array(),
            'http_response' => null,
        );
    }

    /**
     * Helper to set a private/protected property of an object.
     *
     * @param object $object   The object containing the property.
     * @param string $property The name of the private property.
     * @param mixed  $value    The value to set.
     */
    public static function set_private_property( $object, $property, $value ) {
        $reflection = new ReflectionClass( get_class( $object ) );
        $property   = $reflection->getProperty( $property );
        $property->setAccessible( true );
        $property->setValue( $object, $value );
    }

    /**
     * Helper to access a private/protected property of an object.
     *
     * @param object $object   The object containing the property.
     * @param string $property The name of the private property.
     *
     * @return mixed The property value.
     */
    public static function get_private_property( $object, $property ) {
        $reflection = new ReflectionClass( get_class( $object ) );
        $property   = $reflection->getProperty( $property );
        $property->setAccessible( true );
        return $property->getValue( $object );
    }

    /**
     * Helper to call a private/protected method of an object.
     *
     * @param object $object The object containing the method.
     * @param string $method The name of the private method.
     * @param array  $args   Arguments to pass to the method.
     *
     * @return mixed The method return value.
     */
    public static function call_private_method( $object, $method, array $args = array() ) {
        $reflection = new ReflectionClass( get_class( $object ) );
        $method     = $reflection->getMethod( $method );
        $method->setAccessible( true );
        return $method->invokeArgs( $object, $args );
    }
}