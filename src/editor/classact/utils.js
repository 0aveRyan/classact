/**
 * ClassAct - CSS Class Management Utilities
 * 
 * This file contains utilities organized into logical groups:
 * 1. Constants - Regex patterns and error messages
 * 2. Parsing Utilities - Functions for parsing and validating class names
 * 3. Sorting Utilities - Functions for various sorting operations
 * 4. Manipulation Utilities - Functions for transforming class collections
 */

import { __ } from '@wordpress/i18n';

/**
 * =========================================================================
 * 1. CONSTANTS
 * =========================================================================
 */

/**
 * Regular Expression for Valid CSS Class Names
 */
export const validClassNameRegex = /^[a-zA-Z_-][a-zA-Z0-9_-]*|\[[^\s.<>#{}]+\]$/;

/**
 * Error messages
 */
export const ERROR_MESSAGES = {
    INVALID_CLASS: __('The following CSS class names are invalid:'),
    CLASS_FORMAT: __(
        'CSS class names must start with a letter, underscore, or hyphen, followed by alphanumeric characters.'
    ),
    EMPTY_CLASS: __('Please enter at least one valid CSS class name.'),
    DUPLICATE_CLASS: __('Duplicate class names were removed:')
};

/**
 * ARIA Live region messages
 */
export const ARIA_MESSAGES = {
    COPIED: __('CSS classes copied to clipboard'),
    SORTED_ALPHA: __('CSS classes sorted alphabetically'),
    SORTED_LENGTH: __('Classes sorted by length'),
    SORTED_AUTO: __('Classes automatically sorted'),
    CLEARED_ALL: __('All CSS classes cleared'),
    CLEARED_CUSTOM: __('Custom classes cleared, style classes kept'),
    STYLE_MOVED: __('Style classes moved to the end')
};

/**
 * =========================================================================
 * 2. PARSING UTILITIES
 * =========================================================================
 */

/**
 * Convert a class string to an array of unique class names.
 * @param {string} classString - String of CSS class names separated by spaces.
 * @returns {string[]} Array of unique CSS class names.
 */
export const parseClassNames = (classString) => {
    return [
        ...new Set((classString || '').split(/\s+/).filter(Boolean)),
    ];
};

/**
 * Validate and clean class names.
 * @param {string[]} newClasses - Array of CSS class names to validate and clean.
 * @returns {Object} Object containing cleaned classes, invalid classes, and validation status.
 */
export const sanitizeAndValidateClasses = (newClasses) => {
    const cleanedClasses = [
        ...new Set(
            newClasses
                .map((cls) => (typeof cls === 'string' ? cls.trim() : ''))
                .filter(Boolean)
        ),
    ];

    const invalidClasses = cleanedClasses.filter(
        (c) => !validClassNameRegex.test(c)
    );

    return {
        cleanedClasses,
        invalidClasses,
        isValid: invalidClasses.length === 0,
    };
};

/**
 * =========================================================================
 * 3. SORTING UTILITIES
 * =========================================================================
 */

/**
 * Sort CSS class names alphabetically, accounting for numeric prefixes.
 * @param {string[]} classesArray - Array of CSS class names to sort.
 * @returns {string[]} Sorted array of CSS class names.
 */
export const sortClassesAlphabetically = (classesArray) => {
    return classesArray.slice().sort((a, b) => {
        const strA = String(a);
        const strB = String(b);

        const startsWithDigitA = /^\d/.test(strA);
        const startsWithDigitB = /^\d/.test(strB);

        if (!startsWithDigitA && !startsWithDigitB) {
            return strA.localeCompare(strB);
        }

        if (!startsWithDigitA && startsWithDigitB) return -1;
        if (startsWithDigitA && !startsWithDigitB) return 1;

        const numA = parseInt(strA.match(/^(\d+)/)[0], 10);
        const numB = parseInt(strB.match(/^(\d+)/)[0], 10);

        if (numA !== numB) {
            return numA - numB;
        }

        const restA = strA.replace(/^\d+[-]?/, '');
        const restB = strB.replace(/^\d+[-]?/, '');
        return restA.localeCompare(restB);
    });
};

/**
 * Sort CSS class names by length, shortest to longest.
 * @param {string[]} classesArray - Array of CSS class names to sort.
 * @returns {string[]} Sorted array of CSS class names.
 */
export const sortClassesByLength = (classesArray) => {
    return classesArray.slice().sort((a, b) => a.length - b.length);
};

/**
 * The "auto sort" function - combines alphabetical sorting with style classes at the end
 * @param {string[]} classesArray - Array of CSS class names to sort.
 * @returns {string[]} Sorted array with style classes at the end.
 */
export const autoSortClasses = (classesArray) => {
    return moveStyleClassToEnd(sortClassesAlphabetically(classesArray));
};

/**
 * =========================================================================
 * 4. MANIPULATION UTILITIES  
 * =========================================================================
 */

/**
 * Move .is-style classes to the end of the array.
 * @param {string[]} classes - Array of CSS class names.
 * @returns {string[]} Array with the style class moved to the end.
 */
export const moveStyleClassToEnd = (classes) => {
    const result = [...classes]; // Create a copy to avoid mutating the original
    const index = result.findIndex((cls) => cls.startsWith('is-style-'));
    if (index !== -1) {
        const [styleClass] = result.splice(index, 1);
        result.push(styleClass);
    }
    return result;
};

/**
 * Clear all classes except .is-style classes.
 * @param {string[]} classes - Array of CSS class names.
 * @returns {string[]} Array with all non-style classes removed.
 */
export const clearExceptStyleClasses = (classes) => {
    return classes.filter((cls) => cls.startsWith('is-style-'));
};

/**
 * Convert array of class names to a space-separated string
 * @param {string[]} classes - Array of CSS class names
 * @returns {string} Space-separated class names string
 */
export const classArrayToString = (classes) => {
    return classes?.length ? classes.join(' ') : '';
};

/**
 * Check if a class name is a WordPress block style class
 * @param {string} className - CSS class name to check
 * @returns {boolean} True if it's a style class
 */
export const isStyleClass = (className) => {
    return className.startsWith('is-style-');
};

/**
 * Gets class count statistics
 * @param {string[]} classes - Array of CSS class names
 * @returns {Object} Statistics about the classes
 */
export const getClassStats = (classes) => {
    const styleClasses = classes.filter(isStyleClass);
    
    return {
        total: classes.length,
        styleClasses: styleClasses.length,
        customClasses: classes.length - styleClasses.length
    };
};