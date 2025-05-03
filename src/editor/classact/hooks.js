/**
 * WordPress dependencies
 */
import { store as blockEditorStore } from '@wordpress/block-editor';
import { useDispatch, useSelect } from '@wordpress/data';
import { useCallback, useMemo, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import {
	autoSortClasses,
	clearExceptStyleClasses,
	ERROR_MESSAGES,
	moveStyleClassToEnd,
	parseClassNames,
	sanitizeAndValidateClasses,
	sortClassesAlphabetically,
	sortClassesByLength,
	validClassNameRegex,
} from './utils';

/**
 * Get the specific variation type for a core/group block
 *
 * @param {Object} attributes - Block attributes
 * @returns {string} The specific variation type (Group, Row, Stack, Grid)
 */
export const getGroupVariationType = ( attributes ) => {
	// Default to Group if no layout type
	if ( ! attributes?.layout?.type ) {
		return 'Group';
	}

	const { layout } = attributes;

	// Handle Grid type immediately
	if ( layout.type === 'grid' ) {
		return 'Grid';
	}

	// Handle non-flex layouts
	if ( layout.type !== 'flex' ) {
		return 'Group';
	}

	// For flex layouts, determine the subtype

	// Explicit horizontal orientation = Row
	if ( layout.orientation === 'horizontal' ) {
		return 'Row';
	}

	// Explicit vertical orientation = Stack
	if ( layout.orientation === 'vertical' ) {
		return 'Stack';
	}

	// Check for Row-like properties when orientation isn't specified
	const hasRowProperties =
		layout.contentSize ||
		layout.justifyContent === 'space-between' ||
		layout.flexWrap === 'nowrap';

	// Default to Row for flex layouts, as this is the most common use case in WordPress
	return hasRowProperties ? 'Row' : 'Row'; // Both cases return Row as it's the most common default
};

/**
 * Enhanced hook to get a block's display title with fallbacks
 * Combines and improves the functionality of previous useBlockTitle and useSafeBlockDisplayTitle hooks
 *
 * @param {Object} options - Hook options
 * @param {string} options.clientId - The block's client ID
 * @param {string} options.fallbackName - Optional fallback name to use if clientId is not provided
 * @param {boolean} options.safeMode - If true, returns null on error instead of fallback (default: false)
 * @param {boolean} options.fullCustomName - If true, checks all possible custom name locations (default: true)
 * @returns {string|null} The display title for the block, or null if in safe mode and an error occurs
 */
export const useBlockTitle = ( {
	clientId,
	fallbackName = '',
	safeMode = false,
	fullCustomName = true,
} ) => {
	return useSelect(
		( select ) => {
			// If no clientId and no fallback, return default or null based on mode
			if ( ! clientId && ! fallbackName ) {
				return safeMode ? null : __( 'Block' );
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
							// Use useMemo to avoid recalculating this string formatting on every render
							blockTypeName = useMemo( () => {
								const nameParts = blockName.split( '/' );
								return nameParts[ 1 ]
									.split( '-' )
									.map(
										( part ) =>
											part.charAt( 0 ).toUpperCase() +
											part.slice( 1 )
									)
									.join( ' ' );
							}, [ blockName ] );
						} else {
							blockTypeName = blockName;
						}
					}

					// Check for custom name - level of checking based on fullCustomName flag
					if ( blockAttributes?.metadata?.name ) {
						customName = blockAttributes.metadata.name;
					} else if ( fullCustomName && blockAttributes?.name ) {
						customName = blockAttributes.name;
					} else if ( fullCustomName && blockAttributes?.title ) {
						customName = blockAttributes.title;
					} else if (
						fullCustomName &&
						blockName === 'core/heading' &&
						blockAttributes?.content
					) {
						// For headings, use content as name
						// Use useMemo to avoid recalculating this string processing on every render
						customName = useMemo( () => {
							const textContent = blockAttributes.content.replace(
								/<[^>]*>/g,
								''
							);
							if ( textContent.length > 0 ) {
								return textContent.length > 30
									? textContent.substring( 0, 27 ) + '...'
									: textContent;
							}
							return '';
						}, [ blockAttributes.content ] );
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
					return (
						blockName ||
						fallbackName ||
						( safeMode ? null : __( 'Block' ) )
					);
				} catch ( e ) {
					// Return null in safe mode, otherwise continue to fallback
					if ( safeMode ) {
						return null;
					}
				}
			}

			// Final fallback
			return safeMode ? null : fallbackName || __( 'Block' );
		},
		[ clientId, fallbackName, safeMode, fullCustomName ]
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
export const useBlockAttributes = ( { clientId } ) => {
	const { updateBlockAttributes } = useDispatch( blockEditorStore );

	// Get block data from the editor store
	const blockData = useSelect(
		( select ) => {
			if ( ! clientId ) return null;

			const editor = select( blockEditorStore );
			return {
				blockName: editor.getBlockName( clientId ),
				attributes: editor.getBlockAttributes( clientId ),
				blockType: select( 'core/blocks' ).getBlockType(
					editor.getBlockName( clientId )
				),
			};
		},
		[ clientId ]
	);

	// Update className attribute specifically
	const updateClassName = useCallback(
		( newClassName ) => {
			if ( ! clientId ) return;

			updateBlockAttributes( clientId, {
				className:
					newClassName && newClassName.trim()
						? newClassName
						: undefined,
			} );
		},
		[ clientId, updateBlockAttributes ]
	);

	return {
		...blockData,
		updateClassName,
		updateAttributes: ( attributes ) =>
			updateBlockAttributes( clientId, attributes ),
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
export const useClassManagement = ( {
	initialClasses = '',
	onChange,
	onTextChange,
} ) => {
	const [ errorMessage, setErrorMessage ] = useState( '' );
	const [ textValue, setTextValue ] = useState( initialClasses || '' );

	// Parse classes into array form
	const classesArray = parseClassNames( initialClasses );

	// Handle validated class change
	const handleClassChange = useCallback(
		( newClasses ) => {
			const { cleanedClasses, invalidClasses, isValid } =
				sanitizeAndValidateClasses( newClasses );

			if ( ! isValid ) {
				setErrorMessage(
					`${ ERROR_MESSAGES.INVALID_CLASS } ${ invalidClasses.join(
						', '
					) }. ${ ERROR_MESSAGES.CLASS_FORMAT }`
				);
				return;
			}

			setErrorMessage( '' );

			// Update internal state
			setTextValue( cleanedClasses.join( ' ' ) );

			// Call the onChange callback if provided
			if ( onChange ) {
				onChange(
					cleanedClasses.length
						? cleanedClasses.join( ' ' )
						: undefined
				);
			}
		},
		[ onChange ]
	);

	// Handle direct text area changes
	const handleTextChange = useCallback(
		( value ) => {
			// Update internal state
			setTextValue( value );

			// Call the onTextChange callback if provided
			if ( onTextChange ) {
				onTextChange( value );
			}
		},
		[ onTextChange ]
	);

	// Handle blur event for text input - validates and cleans classes
	const handleTextBlur = useCallback( () => {
		if ( ! textValue.trim() ) {
			setTextValue( '' );
			if ( onChange ) {
				onChange( undefined );
			}
			return;
		}

		// Parse and validate classes
		const classes = parseClassNames( textValue );
		const { cleanedClasses, invalidClasses, isValid } =
			sanitizeAndValidateClasses( classes );

		if ( ! isValid ) {
			setErrorMessage(
				`${ ERROR_MESSAGES.INVALID_CLASS } ${ invalidClasses.join(
					', '
				) }. ${ ERROR_MESSAGES.CLASS_FORMAT }`
			);
		} else {
			setErrorMessage( '' );
		}

		// Update with cleaned classes
		const newValue = cleanedClasses.join( ' ' );
		setTextValue( newValue );

		if ( onChange ) {
			onChange( cleanedClasses.length ? newValue : undefined );
		}
	}, [ textValue, onChange ] );

	// Sorting and manipulation functions
	const sortAlphabetically = useCallback( () => {
		handleClassChange( sortClassesAlphabetically( classesArray ) );
	}, [ classesArray, handleClassChange ] );

	const sortByLength = useCallback( () => {
		handleClassChange( sortClassesByLength( classesArray ) );
	}, [ classesArray, handleClassChange ] );

	const moveStyleToEnd = useCallback( () => {
		handleClassChange( moveStyleClassToEnd( classesArray ) );
	}, [ classesArray, handleClassChange ] );

	const autoSort = useCallback( () => {
		handleClassChange( autoSortClasses( classesArray ) );
	}, [ classesArray, handleClassChange ] );

	const clearCustomClasses = useCallback( () => {
		handleClassChange( clearExceptStyleClasses( classesArray ) );
	}, [ classesArray, handleClassChange ] );

	const clearAllClasses = useCallback( () => {
		handleTextChange( '' );
	}, [ handleTextChange ] );

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
		isValidClass: ( token ) => validClassNameRegex.test( token.trim() ),
	};
};
