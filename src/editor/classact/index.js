/**
 * ClassAct - CSS Class Management for WordPress Block Editor
 *
 * Main module for the ClassAct plugin's editor integration.
 * This file serves as the entry point for the ClassAct functionality,
 * importing styles and the core logic that powers the editor enhancements.
 *
 * @module ClassAct/Editor
 * @since 2.0.0
 */

/**
 * Import core functionality
 * The core.js file contains all the plugin's integration with the block editor,
 * including filters, hooks, and component registrations
 */
import './core';

/**
 * Import stylesheets for the editor interface
 * These styles customize the appearance of ClassAct components
 */
import './styles.scss';
