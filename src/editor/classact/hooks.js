/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';
import { useState, useCallback } from '@wordpress/element';
import { useDispatch } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { 
    sanitizeAndValidateClasses, 
    parseClassNames,
    ERROR_MESSAGES,
    validClassNameRegex,
    sortClassesAlphabetically,
    sortClassesByLength,
    moveStyleClassToEnd,
    clearExceptStyleClasses
} from './utils';

/**
 * Get the specific variation type for a core/group block
 *
 * @param {Object} attributes - Block attributes
 * @returns {string} The specific variation type (Group, Row, Stack, Grid)
 */
export const getGroupVariationType = ( attributes ) => {
	// Check for layout type in the attributes
	if ( attributes?.layout?.type ) {
		// Map layout types to their display names
		switch ( attributes.layout.type ) {
			case 'flex':
				// First check explicitly for orientation: horizontal
				if ( attributes.layout.orientation === 'horizontal' ) {
					return 'Row';
				}

				// If orientation is missing but has other Row-like properties
				// treat as a Row
				if (
					attributes.layout.contentSize ||
					attributes.layout.justifyContent === 'space-between' ||
					attributes.layout.flexWrap === 'nowrap'
				) {
					return 'Row';
				}

				// If orientation is explicitly vertical, it's a Stack
				if ( attributes.layout.orientation === 'vertical' ) {
					return 'Stack';
				}

				// In WordPress, flex layout without orientation specified
				// is commonly used for rows, so default to Row
				return 'Row';

			case 'grid':
				return 'Grid';
			default:
				return 'Group';
		}
	}

	// Default to Group if no layout type is specified
	return 'Group';
};

/**
 * Custom hook to get a block's display title with fallbacks
 *
 * This hook follows WordPress's format of "Custom Name (Block Type)" when
 * a custom name is present, otherwise just returns the block type name.
 *
 * @param {Object} options - Hook options
 * @param {string} options.clientId - The block's client ID
 * @param {string} options.fallbackName - Optional fallback name to use if clientId is not provided
 * @returns {string} The display title for the block
 */
export const useBlockTitle = ( { clientId, fallbackName = '' } ) => {
	return useSelect(
		( select ) => {
			if ( ! clientId && ! fallbackName ) {
				return __( 'Block' );
			}

			// Try to use the clientId to get block information
			if ( clientId ) {
				try {
					const editor = select( blockEditorStore );
					const blockName = editor.getBlockName( clientId );
					const blockAttributes =
						editor.getBlockAttributes( clientId );
					const blockRegistry = select( 'core/blocks' );
					let blockTypeName = '';
					let customName = '';

					// Get the standard block type name
					if ( blockName ) {
						const blockType =
							blockRegistry.getBlockType( blockName );

						// Special handling for core/group blocks to show their specific variation
						if ( blockName === 'core/group' ) {
							blockTypeName =
								getGroupVariationType( blockAttributes );

							// Additional safety check for row blocks that might be misidentified
							if (
								blockAttributes?.layout?.orientation ===
									'horizontal' &&
								blockTypeName !== 'Row'
							) {
								blockTypeName = 'Row';
							}
						} else if ( blockType?.title ) {
							blockTypeName = blockType.title;
						} else if ( blockName.includes( '/' ) ) {
							// Format block name if title not available
							const nameParts = blockName.split( '/' );
							blockTypeName = nameParts[ 1 ]
								.split( '-' )
								.map(
									( part ) =>
										part.charAt( 0 ).toUpperCase() +
										part.slice( 1 )
								)
								.join( ' ' );
						} else {
							blockTypeName = blockName;
						}
					}

					// Check for custom name
					if ( blockAttributes?.metadata?.name ) {
						customName = blockAttributes.metadata.name;
					} else if ( blockAttributes?.name ) {
						customName = blockAttributes.name;
					} else if ( blockAttributes?.title ) {
						customName = blockAttributes.title;
					} else if (
						blockName === 'core/heading' &&
						blockAttributes?.content
					) {
						// For headings, use content as name
						const textContent = blockAttributes.content.replace(
							/<[^>]*>/g,
							''
						);
						if ( textContent.length > 0 ) {
							customName =
								textContent.length > 30
									? textContent.substring( 0, 27 ) + '...'
									: textContent;
						}
					}

					// Format according to WordPress convention
					if ( customName && blockTypeName ) {
						return `${ customName } (${ blockTypeName })`;
					} else if ( blockTypeName ) {
						return blockTypeName;
					} else if ( customName ) {
						return customName;
					}

					// Last resort fallback if we somehow got here
					return blockName || fallbackName || __( 'Block' );
				} catch ( e ) {
					// Silently fail and continue to fallback
				}
			}

			// Final fallback
			return fallbackName || __( 'Block' );
		},
		[ clientId, fallbackName ]
	);
};

/**
 * Safe wrapper for getting block display title
 * following WordPress style convention
 *
 * @param {Object} options - Options for the hook
 * @param {string} options.clientId - The block's client ID
 * @returns {string|null} The block's display title or null if unavailable
 */
export const useSafeBlockDisplayTitle = ( { clientId } ) => {
	return useSelect(
		( select ) => {
			try {
				// Get block info from the editor store
				const editor = select( blockEditorStore );
				const blockName = editor.getBlockName( clientId );
				const blockAttributes = editor.getBlockAttributes( clientId );

				// Get block type name
				let blockTypeName = '';
				if ( blockName ) {
					// Special handling for core/group blocks
					if ( blockName === 'core/group' ) {
						blockTypeName =
							getGroupVariationType( blockAttributes );

						// Additional safety check for row blocks
						if (
							blockAttributes?.layout?.orientation ===
								'horizontal' &&
							blockTypeName !== 'Row'
						) {
							blockTypeName = 'Row';
						}
					} else {
						const blockType =
							select( 'core/blocks' ).getBlockType( blockName );
						if ( blockType?.title ) {
							blockTypeName = blockType.title;
						} else {
							// Format from namespace if needed
							blockTypeName = blockName
								.split( '/' )
								.pop()
								.replace( /-/g, ' ' )
								.replace( /\b\w/g, ( l ) => l.toUpperCase() );
						}
					}
				}

				// Check for custom name
				let customName = '';
				if ( blockAttributes?.metadata?.name ) {
					customName = blockAttributes.metadata.name;
				}

				// Format according to WordPress convention
				if ( customName && blockTypeName ) {
					return `${ customName } (${ blockTypeName })`;
				}

				return blockTypeName || null;
			} catch ( e ) {
				// If anything fails, return null
				return null;
			}
		},
		[ clientId ]
	);
};

/**
 * Custom hook for managing block attributes
 * Provides simplified access to common block editor operations
 * 
 * @param {Object} options - Hook options
 * @param {string} options.clientId - The block's client ID
 * @returns {Object} Object containing block data and updater functions
 */
export const useBlockAttributes = ({ clientId }) => {
    const { updateBlockAttributes } = useDispatch(blockEditorStore);
    
    // Get block data from the editor store
    const blockData = useSelect(
        (select) => {
            if (!clientId) return null;
            
            const editor = select(blockEditorStore);
            return {
                blockName: editor.getBlockName(clientId),
                attributes: editor.getBlockAttributes(clientId),
                blockType: select('core/blocks').getBlockType(editor.getBlockName(clientId))
            };
        },
        [clientId]
    );
    
    // Update className attribute specifically
    const updateClassName = useCallback((newClassName) => {
        if (!clientId) return;
        
        updateBlockAttributes(clientId, {
            className: newClassName && newClassName.trim() ? newClassName : undefined,
        });
    }, [clientId, updateBlockAttributes]);
    
    return {
        ...blockData,
        updateClassName,
        updateAttributes: (attributes) => updateBlockAttributes(clientId, attributes)
    };
};

/**
 * Custom hook for managing CSS classes
 * Provides functions for parsing, validating, and manipulating classes
 * 
 * @param {Object} options - Hook options
 * @param {string} options.initialClasses - Initial CSS class string
 * @param {Function} options.onChange - Callback function when classes change
 * @param {Function} options.onTextChange - Callback for direct text changes
 * @returns {Object} Object containing class data and manipulation functions
 */
export const useClassManagement = ({ 
    initialClasses = '', 
    onChange, 
    onTextChange 
}) => {
    const [errorMessage, setErrorMessage] = useState('');
    const [textValue, setTextValue] = useState(initialClasses || '');
    
    // Parse classes into array form
    const classesArray = parseClassNames(initialClasses);
    
    // Handle validated class change
    const handleClassChange = useCallback((newClasses) => {
        const { cleanedClasses, invalidClasses, isValid } = sanitizeAndValidateClasses(newClasses);
        
        if (!isValid) {
            setErrorMessage(
                `${ERROR_MESSAGES.INVALID_CLASS} ${invalidClasses.join(', ')}. ${ERROR_MESSAGES.CLASS_FORMAT}`
            );
            return;
        }
        
        setErrorMessage('');
        
        // Update internal state
        setTextValue(cleanedClasses.join(' '));
        
        // Call the onChange callback if provided
        if (onChange) {
            onChange(cleanedClasses.length ? cleanedClasses.join(' ') : undefined);
        }
    }, [onChange]);
    
    // Handle direct text area changes
    const handleTextChange = useCallback((value) => {
        // Update internal state
        setTextValue(value);
        
        // Call the onTextChange callback if provided
        if (onTextChange) {
            onTextChange(value);
        }
    }, [onTextChange]);
    
    // Handle blur event for text input - validates and cleans classes
    const handleTextBlur = useCallback(() => {
        if (!textValue.trim()) {
            setTextValue('');
            if (onChange) {
                onChange(undefined);
            }
            return;
        }
        
        // Parse and validate classes
        const classes = parseClassNames(textValue);
        const { cleanedClasses, invalidClasses, isValid } = sanitizeAndValidateClasses(classes);
        
        if (!isValid) {
            setErrorMessage(
                `${ERROR_MESSAGES.INVALID_CLASS} ${invalidClasses.join(', ')}. ${ERROR_MESSAGES.CLASS_FORMAT}`
            );
        } else {
            setErrorMessage('');
        }
        
        // Update with cleaned classes
        const newValue = cleanedClasses.join(' ');
        setTextValue(newValue);
        
        if (onChange) {
            onChange(cleanedClasses.length ? newValue : undefined);
        }
    }, [textValue, onChange]);
    
    // Sorting and manipulation functions
    const sortAlphabetically = useCallback(() => {
        handleClassChange(sortClassesAlphabetically(classesArray));
    }, [classesArray, handleClassChange]);
    
    const sortByLength = useCallback(() => {
        handleClassChange(sortClassesByLength(classesArray));
    }, [classesArray, handleClassChange]);
    
    const moveStyleToEnd = useCallback(() => {
        handleClassChange(moveStyleClassToEnd(classesArray));
    }, [classesArray, handleClassChange]);
    
    const autoSort = useCallback(() => {
        handleClassChange(moveStyleClassToEnd(sortClassesAlphabetically(classesArray)));
    }, [classesArray, handleClassChange]);
    
    const clearCustomClasses = useCallback(() => {
        handleClassChange(clearExceptStyleClasses(classesArray));
    }, [classesArray, handleClassChange]);
    
    const clearAllClasses = useCallback(() => {
        handleTextChange('');
    }, [handleTextChange]);
    
    return {
        classesArray,
        textValue,
        errorMessage,
        setErrorMessage,
        handleClassChange,
        handleTextChange,
        handleTextBlur,
        sortAlphabetically,
        sortByLength,
        moveStyleToEnd,
        autoSort,
        clearCustomClasses,
        clearAllClasses,
        isValidClass: (token) => validClassNameRegex.test(token.trim())
    };
};