import { InspectorAdvancedControls } from '@wordpress/block-editor';
import { FormTokenField, Notice } from '@wordpress/components';

import { createHigherOrderComponent } from '@wordpress/compose';
import { useState, useMemo, Fragment } from '@wordpress/element';

import { addFilter } from '@wordpress/hooks';
import { __ } from '@wordpress/i18n';

// Regular Expression for Valid CSS Class Names
const validClassNameRegex = /^[a-zA-Z_-][a-zA-Z0-9_-]*|\[[^\s.<>#{}]+\]$/;

const withClassActInspectorControls = createHigherOrderComponent(
	( BlockEdit ) => {
		return ( props ) => {
			const { attributes, setAttributes } = props;
			const [ errorMessage, setErrorMessage ] = useState( '' );

			// Convert className string to array for FormTokenField
			// Ensure initial class list is clean and deduplicated
			const classArray = useMemo( () => {
				return [
					...new Set(
						( attributes.className || '' )
							.split( /\s+/ )
							.filter( Boolean )
					),
				];
			}, [ attributes.className ] );

			const handleClassChange = ( newClasses ) => {
				const cleanedClasses = [
					...new Set(
						newClasses
							.map( ( cls ) =>
								typeof cls === 'string' ? cls.trim() : ''
							) // Ensure string, trim spaces
							.filter( Boolean ) // Remove empty values
					),
				];

				const invalidClasses = cleanedClasses.filter(
					( c ) => ! validClassNameRegex.test( c )
				);

				if ( invalidClasses.length > 0 ) {
					setErrorMessage(
						__( 'Invalid class names:' ) +
							' ' +
							invalidClasses.join( ', ' )
					);
					return;
				}

				setErrorMessage( '' ); // Clear error
				setAttributes( {
					className: cleanedClasses.length
						? cleanedClasses.join( ' ' )
						: undefined,
				} );
			};

			return (
				<Fragment>
					<BlockEdit { ...props } />
					<InspectorAdvancedControls>
						{ errorMessage && (
							<Notice
								status="error"
								isDismissible
								onRemove={ () => setErrorMessage( '' ) }
							>
								{ errorMessage }
							</Notice>
						) }
						<FormTokenField
							label={ __( 'Manage Classes' ) }
							value={ classArray }
							tokenizeOnSpace
							tokenizeOnBlur
							__experimentalValidateInput={ ( token ) =>
								validClassNameRegex.test( token.trim() )
							}
							onChange={ handleClassChange }
						/>
					</InspectorAdvancedControls>
				</Fragment>
			);
		};
	}
);

addFilter(
	'editor.BlockEdit',
	'classact/inspector-controls',
	withClassActInspectorControls
);
