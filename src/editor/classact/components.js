/**
 * ClassAct - Component Definitions
 */

/**
 * WordPress dependencies
 */
import { store as blockEditorStore } from '@wordpress/block-editor';
import {
	Button,
	FormTokenField,
	Icon,
	Modal,
	Notice,
	TextareaControl,
} from '@wordpress/components';
import { useCopyToClipboard } from '@wordpress/compose';
import { useSelect } from '@wordpress/data';
import { createPortal, useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import {
	check,
	copySmall,
	formatLowercase,
	formatOutdentRTL,
	listView,
	moveTo,
	styles,
	tableRowDelete,
	trash,
} from '@wordpress/icons';

/**
 * Internal dependencies
 */
import {
	AriaLiveAnnouncement,
	FeedbackButton,
	useFeedback,
} from './accessibility';
import { useModalContext } from './context';
import {
	getGroupVariationType,
	useBlockAttributes,
	useBlockTitle,
	useClassManagement,
} from './hooks';
import {
	ARIA_MESSAGES,
	autoSortClasses,
	clearExceptStyleClasses,
	moveStyleClassToEnd,
	parseClassNames,
	sortClassesAlphabetically,
	sortClassesByLength,
	TIMING,
} from './utils';

/**
 * BlockTitleDisplay Component
 * Displays a block title with icon in WordPress native style
 * Enhanced to properly handle group block variations
 */
export const BlockTitleDisplay = ( { clientId, title } ) => {
	const blockInfo = useSelect(
		( select ) => {
			if ( ! clientId ) return { icon: null, displayTitle: title || '' };

			const editor = select( blockEditorStore );
			const blockName = editor.getBlockName( clientId );
			const blockAttributes = editor.getBlockAttributes( clientId );
			const blockRegistry = select( 'core/blocks' );
			const blockType = blockRegistry.getBlockType( blockName );

			let displayTitle = title || '';
			let blockIcon = blockType?.icon?.src || null;

			// If it's a core/group block and we don't have a custom title yet,
			// explicitly set the title based on its variation type
			if ( blockName === 'core/group' && ! title ) {
				const variationType = getGroupVariationType( blockAttributes );
				displayTitle = variationType;
			}

			return {
				icon: blockIcon,
				displayTitle: displayTitle,
			};
		},
		[ clientId, title ]
	);

	return (
		<div className="classact-block-title">
			<div className="classact-block-title__container">
				{ blockInfo.icon && (
					<span className="classact-block-title__icon">
						<Icon icon={ blockInfo.icon } />
					</span>
				) }
				<span className="classact-block-title__name">
					{ blockInfo.displayTitle }
				</span>
			</div>
		</div>
	);
};

/**
 * CopyButton component for copying class names to clipboard
 */
export const CopyButton = ( {
	className,
	variant = 'secondary',
	size = 'small',
} ) => {
	const copyRef = useCopyToClipboard(
		() => className || '',
		() => {}
	);

	return (
		<FeedbackButton
			variant={ variant }
			size={ size }
			ref={ copyRef }
			icon={ copySmall }
			ariaLabel={ __( 'Copy CSS classes to clipboard' ) }
			ariaMessage={ ARIA_MESSAGES.COPIED }
			feedbackText={ __( 'Copied!' ) }
		>
			{ __( 'Copy' ) }
		</FeedbackButton>
	);
};

/**
 * SortButton component for sorting class names with temporary feedback
 */
export const SortButton = ( {
	classesArray,
	handleClassChange,
	variant = 'secondary',
	size = 'small',
} ) => {
	const handleSort = () => {
		handleClassChange( autoSortClasses( classesArray ) );
	};

	return (
		<FeedbackButton
			variant={ variant }
			size={ size }
			onClick={ handleSort }
			icon={ listView }
			ariaLabel={ __( 'Sort CSS classes alphabetically' ) }
			ariaMessage={ ARIA_MESSAGES.SORTED_ALPHA }
			feedbackText={ __( 'Sorted!' ) }
		>
			{ __( 'Sort' ) }
		</FeedbackButton>
	);
};

/**
 * ClearButton component for clearing class names with temporary feedback
 */
export const ClearButton = ( {
	setAttributes,
	variant = 'secondary',
	size = 'small',
} ) => {
	const handleClear = () => {
		setAttributes( { className: '' } );
	};

	return (
		<FeedbackButton
			variant={ variant }
			isDestructive
			size={ size }
			onClick={ handleClear }
			icon={ trash }
			ariaLabel={ __( 'Clear all CSS classes' ) }
			ariaMessage={ ARIA_MESSAGES.CLEARED_ALL }
			feedbackText={ __( 'Cleared!' ) }
		>
			{ __( 'Clear' ) }
		</FeedbackButton>
	);
};

/**
 * AutoSortButton component for the modal
 */
export const AutoSortButton = ( { classesArray, handleClassChange } ) => {
	const handleAutoSort = () => {
		handleClassChange( autoSortClasses( classesArray ) );
	};

	return (
		<FeedbackButton
			variant="primary"
			size="compact"
			onClick={ handleAutoSort }
			icon={ listView }
			ariaLabel={ __( 'Automatically sort CSS classes' ) }
			ariaMessage={ ARIA_MESSAGES.SORTED_AUTO }
			feedbackText={ __( 'Auto Sort' ) }
		>
			{ __( 'Auto Sort' ) }
		</FeedbackButton>
	);
};

/**
 * AlphaSortButton component for the modal
 */
export const AlphaSortButton = ( { classesArray, handleClassChange } ) => {
	const handleAlphaSort = () => {
		handleClassChange( sortClassesAlphabetically( classesArray ) );
	};

	return (
		<FeedbackButton
			variant="secondary"
			size="compact"
			icon={ formatLowercase }
			onClick={ handleAlphaSort }
			ariaLabel={ __( 'Sort CSS classes alphabetically' ) }
			ariaMessage={ ARIA_MESSAGES.SORTED_ALPHA }
			feedbackText={ __( 'Alpha Sort' ) }
		>
			{ __( 'Alpha Sort' ) }
		</FeedbackButton>
	);
};

/**
 * LengthSortButton component for the modal
 */
export const LengthSortButton = ( { classesArray, handleClassChange } ) => {
	const handleLengthSort = () => {
		handleClassChange( sortClassesByLength( classesArray ) );
	};

	return (
		<FeedbackButton
			variant="secondary"
			size="compact"
			icon={ formatOutdentRTL }
			onClick={ handleLengthSort }
			ariaLabel={ __( 'Sort CSS classes by length' ) }
			ariaMessage={ ARIA_MESSAGES.SORTED_LENGTH }
			feedbackText={ __( 'Length Sort' ) }
		>
			{ __( 'Length Sort' ) }
		</FeedbackButton>
	);
};

/**
 * StyleToEndButton component for the modal
 */
export const StyleToEndButton = ( { classesArray, handleClassChange } ) => {
	const handleMoveToEnd = () => {
		handleClassChange( moveStyleClassToEnd( classesArray ) );
	};

	return (
		<FeedbackButton
			variant="secondary"
			size="compact"
			icon={ moveTo }
			onClick={ handleMoveToEnd }
			ariaLabel={ __( 'Move style classes to the end' ) }
			ariaMessage={ ARIA_MESSAGES.STYLE_MOVED }
			feedbackText={ __( 'Block Style to End' ) }
		>
			{ __( 'Block Style to End' ) }
		</FeedbackButton>
	);
};

/**
 * ClearCustomButton component for the modal
 */
export const ClearCustomButton = ( { classesArray, handleClassChange } ) => {
	const handleClearCustom = () => {
		handleClassChange( clearExceptStyleClasses( classesArray ) );
	};

	return (
		<FeedbackButton
			variant="secondary"
			isDestructive
			size="compact"
			onClick={ handleClearCustom }
			icon={ tableRowDelete }
			ariaLabel={ __(
				'Clear all custom classes, keeping style classes'
			) }
			ariaMessage={ ARIA_MESSAGES.CLEARED_CUSTOM }
			feedbackText={ __( 'Clear Custom' ) }
		>
			{ __( 'Clear Custom' ) }
		</FeedbackButton>
	);
};

/**
 * ClearAllButton component for the modal
 */
export const ClearAllButton = ( { handleTextAreaChange } ) => {
	const handleClearAll = () => {
		handleTextAreaChange( '' );
	};

	return (
		<FeedbackButton
			variant="secondary"
			isDestructive
			size="compact"
			onClick={ handleClearAll }
			icon={ trash }
			ariaLabel={ __( 'Clear all CSS classes' ) }
			ariaMessage={ ARIA_MESSAGES.CLEARED_ALL }
			feedbackText={ __( 'Clear All' ) }
		>
			{ __( 'Clear All' ) }
		</FeedbackButton>
	);
};

/**
 * Global modal container that listens for open requests
 */
export const ClassActModal = () => {
	const { isOpen, blockClientId, closeModal } = useModalContext();

	// Return early if modal is not open or no block is selected
	if ( ! isOpen || ! blockClientId ) {
		return null;
	}

	// Use createPortal to render the modal in the #classact-modal-root
	return createPortal(
		<ConnectedClassActModal
			clientId={ blockClientId }
			onRequestClose={ closeModal }
		/>,
		document.getElementById( 'classact-modal-root' )
	);
};

/**
 * Core class management modal content component
 * Displays the main modal UI without any data handling logic
 */
export const ClassManagementModalContent = ( {
	classesArray,
	classManagement,
	initialClasses,
	blockDisplayTitle,
	onRequestClose,
	clientId,
} ) => {
	return (
		<Modal
			icon={ styles }
			size="large"
			title={ __( 'Manage CSS Classes' ) }
			onRequestClose={ onRequestClose }
			shouldCloseOnEsc={ true }
			shouldCloseOnClickOutside={ true }
			headerActions={
				<CopyButton
					className={ initialClasses }
					variant="secondary"
					size="compact"
				/>
			}
		>
			{ classManagement.errorMessage && (
				<Notice
					status="error"
					isDismissible
					onRemove={ () => classManagement.setErrorMessage( '' ) }
					className="classact-error-message"
					politeness="assertive"
				>
					<span id="classact-error-message" role="alert">
						{ classManagement.errorMessage }
					</span>
				</Notice>
			) }

			<div className="classact-modal-header">
				<BlockTitleDisplay
					clientId={ clientId }
					title={ blockDisplayTitle }
				/>

				<div className="classact-block-title__count">
					{ classesArray.length }
				</div>
			</div>

			<FormTokenField
				label={ __( 'CSS Classes' ) }
				value={ classesArray }
				placeholder={ __( 'Separate with spaces or commas' ) }
				onChange={ classManagement.handleClassChange }
				__experimentalValidateInput={ ( token ) =>
					classManagement.isValidClass( token )
				}
				__experimentalShowHowTo={ false }
				tokenizeOnSpace
				tokenizeOnBlur
				__next40pxDefaultSize
				__nextHasNoMarginBottom
				help={ __(
					'Type class names and press Enter or Space to add. Press backspace to remove.'
				) }
				aria-describedby={
					classManagement.errorMessage
						? 'classact-error-message'
						: undefined
				}
				aria-label={ __( 'CSS classes for' ) + ' ' + blockDisplayTitle }
				maxSuggestions={ 100 }
			/>

			<div className="classact-spacer" />

			<TextareaControl
				label={ __( 'Class Names' ) }
				value={ classManagement.textValue }
				onChange={ classManagement.handleTextChange }
				onBlur={ classManagement.handleTextBlur }
				__nextHasNoMarginBottom
				aria-label={
					__( 'CSS class names as text for' ) +
					' ' +
					blockDisplayTitle
				}
				help={ __(
					'Edit class names directly as a space-separated list.'
				) }
			/>

			<div className="classact-modal-button-group">
				<AutoSortButton
					classesArray={ classesArray }
					handleClassChange={ classManagement.handleClassChange }
				/>
				<AlphaSortButton
					classesArray={ classesArray }
					handleClassChange={ classManagement.handleClassChange }
				/>
				<LengthSortButton
					classesArray={ classesArray }
					handleClassChange={ classManagement.handleClassChange }
				/>
				<StyleToEndButton
					classesArray={ classesArray }
					handleClassChange={ classManagement.handleClassChange }
				/>
				<ClearCustomButton
					classesArray={ classesArray }
					handleClassChange={ classManagement.handleClassChange }
				/>
				<ClearAllButton
					handleTextAreaChange={ classManagement.handleTextChange }
				/>
			</div>
		</Modal>
	);
};

/**
 * Connected version of the modal that gets data from block context
 */
export const ConnectedClassActModal = ( { clientId, onRequestClose } ) => {
	// Get block data through the block attributes hook
	const blockAttrs = useBlockAttributes( { clientId } );

	// Get the initial class string from the block attributes
	const initialClasses = blockAttrs?.attributes?.className;

	// Use the class management hook
	const classManagement = useClassManagement( {
		initialClasses,
		onChange: ( newClassName ) => {
			if ( blockAttrs ) {
				blockAttrs.updateClassName( newClassName );
			}
		},
		onTextChange: ( value ) => {
			if ( blockAttrs ) {
				blockAttrs.updateClassName( value );
			}
		},
	} );

	// Initialize textarea value when initial classes change
	useEffect( () => {
		if ( initialClasses !== undefined ) {
			classManagement.handleTextChange( initialClasses || '' );
		}
	}, [ initialClasses ] );

	// Get the block's display title
	const blockDisplayTitle = useBlockTitle( {
		clientId,
		fallbackName: blockAttrs?.blockName,
	} );

	// If no block data yet, return null
	if ( ! blockAttrs || ! classManagement.classesArray ) {
		return null;
	}

	return (
		<ClassManagementModalContent
			classesArray={ classManagement.classesArray }
			classManagement={ classManagement }
			initialClasses={ initialClasses }
			blockDisplayTitle={ blockDisplayTitle }
			onRequestClose={ onRequestClose }
			clientId={ clientId }
		/>
	);
};

/**
 * Controlled version of the modal for direct state management
 */
export const ControlledClassActModal = ( {
	onRequestClose,
	classes,
	name,
	array,
	setAttributes,
	updateArray,
} ) => {
	// Use the class management hook
	const classManagement = useClassManagement( {
		initialClasses: classes,
		onChange: ( newClassName ) => {
			if ( updateArray ) {
				updateArray( parseClassNames( newClassName || '' ) );
			} else if ( setAttributes ) {
				setAttributes( {
					className: newClassName,
				} );
			}
		},
		onTextChange: ( value ) => {
			if ( setAttributes ) {
				setAttributes( {
					className: value,
				} );
			}
		},
	} );

	// Use given array or parse from class string
	const classesArray = array || classManagement.classesArray;

	// Initialize textarea value when classes change
	useEffect( () => {
		if ( classes !== undefined ) {
			classManagement.handleTextChange( classes || '' );
		}
	}, [ classes ] );

	return (
		<ClassManagementModalContent
			classesArray={ classesArray }
			classManagement={ classManagement }
			initialClasses={ classes }
			blockDisplayTitle={ name || __( 'Block' ) }
			onRequestClose={ onRequestClose }
			clientId={ null }
		/>
	);
};

/**
 * Backward compatibility wrapper for the modal component
 * Determines which implementation to use based on props
 */
export const ClassActManagementModal = ( {
	clientId,
	onRequestClose,
	isKeyboardShortcutTriggered = false,
	classes,
	name,
	array,
	setAttributes,
	updateArray,
} ) => {
	// If using the keyboard shortcut or clientId, use the connected version
	if ( isKeyboardShortcutTriggered || ( clientId && ! classes && ! array ) ) {
		return (
			<ConnectedClassActModal
				clientId={ clientId }
				onRequestClose={ onRequestClose }
			/>
		);
	}

	// Otherwise use the controlled version
	return (
		<ControlledClassActModal
			onRequestClose={ onRequestClose }
			classes={ classes }
			name={ name }
			array={ array }
			setAttributes={ setAttributes }
			updateArray={ updateArray }
		/>
	);
};
