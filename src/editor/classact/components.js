/**
 * ClassAct - Component Definitions
 */

/**
 * WordPress dependencies
 */
import { FormTokenField, Notice, Button, Modal, TextareaControl, Icon } from '@wordpress/components';
import { useCopyToClipboard } from '@wordpress/compose';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { createPortal, useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { styles, copySmall, trash, formatLowercase, formatOutdentRTL, moveTo, listView, tableRowDelete, check } from '@wordpress/icons';
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { 
    parseClassNames, 
    sortClassesAlphabetically, 
    sortClassesByLength, 
    moveStyleClassToEnd, 
    clearExceptStyleClasses,
    autoSortClasses,
    ARIA_MESSAGES,
} from './utils';
import { useModalContext } from './context';
import { 
    useBlockTitle, 
    getGroupVariationType, 
    useBlockAttributes,
    useClassManagement
} from './hooks';
import {
    AriaLiveAnnouncement,
    useFeedback,
} from './accessibility';

/**
 * BlockTitleDisplay Component
 * Displays a block title with icon in WordPress native style
 * Enhanced to properly handle group block variations
 */
export const BlockTitleDisplay = ({ clientId, title }) => {
    const blockInfo = useSelect(
        (select) => {
            if (!clientId) return { icon: null, displayTitle: title || '' };
            
            const editor = select(blockEditorStore);
            const blockName = editor.getBlockName(clientId);
            const blockAttributes = editor.getBlockAttributes(clientId);
            const blockRegistry = select('core/blocks');
            const blockType = blockRegistry.getBlockType(blockName);
            
            let displayTitle = title || '';
            let blockIcon = blockType?.icon?.src || null;
            
            // If it's a core/group block and we don't have a custom title yet,
            // explicitly set the title based on its variation type
            if (blockName === 'core/group' && !title) {
                const variationType = getGroupVariationType(blockAttributes);
                displayTitle = variationType;
            }
            
            return {
                icon: blockIcon,
                displayTitle: displayTitle
            };
        },
        [clientId, title]
    );
    
    return (
        <div className="classact-block-title">
            <div className="classact-block-title__container">
                {blockInfo.icon && (
                    <span className="classact-block-title__icon">
                        <Icon icon={blockInfo.icon} />
                    </span>
                )}
                <span className="classact-block-title__name">
                    {blockInfo.displayTitle}
                </span>
            </div>
        </div>
    );
};

/**
 * CopyButton component for copying class names to clipboard
 */
export const CopyButton = ({ className, variant = 'secondary', size = 'small' }) => {
    const feedback = useFeedback({
        successMessage: ARIA_MESSAGES.COPIED
    });
    
    const copyRef = useCopyToClipboard(
        () => className || '',
        () => {
            feedback.activate();
        }
    );
    
    return (
        <>
            <Button 
                variant={variant} 
                size={size} 
                ref={copyRef} 
                icon={copySmall} 
                aria-label={__('Copy CSS classes to clipboard')}
            >
                {feedback.isActive ? __('Copied!') : __('Copy')}
            </Button>
            <AriaLiveAnnouncement message={feedback.message} />
        </>
    );
};

/**
 * SortButton component for sorting class names with temporary feedback
 */
export const SortButton = ({ classesArray, handleClassChange, variant = 'secondary', size = 'small' }) => {
    const feedback = useFeedback({
        successMessage: ARIA_MESSAGES.SORTED_ALPHA
    });
    
    const handleSort = () => {
        handleClassChange(autoSortClasses(classesArray));
        feedback.activate();
    };
    
    return (
        <>
            <Button 
                variant={variant} 
                size={size} 
                onClick={handleSort} 
                icon={listView} 
                aria-label={__('Sort CSS classes alphabetically')}
            >
                {feedback.isActive ? __('Sorted!') : __('Sort')}
            </Button>
            <AriaLiveAnnouncement message={feedback.message} />
        </>
    );
};

/**
 * ClearButton component for clearing class names with temporary feedback
 */
export const ClearButton = ({ setAttributes, variant = 'secondary', size = 'small' }) => {
    const feedback = useFeedback({
        successMessage: ARIA_MESSAGES.CLEARED_ALL
    });
    
    const handleClear = () => {
        setAttributes({ className: '' });
        feedback.activate();
    };
    
    return (
        <>
            <Button 
                variant={variant} 
                isDestructive 
                size={size} 
                onClick={handleClear} 
                icon={trash} 
                aria-label={__('Clear all CSS classes')}
            >
                {feedback.isActive ? __('Cleared!') : __('Clear')}
            </Button>
            <AriaLiveAnnouncement message={feedback.message} />
        </>
    );
};

/**
 * AutoSortButton component for the modal
 */
export const AutoSortButton = ({ classesArray, handleClassChange }) => {
    const feedback = useFeedback({
        successMessage: ARIA_MESSAGES.SORTED_AUTO
    });
    
    const handleAutoSort = () => {
        handleClassChange(autoSortClasses(classesArray));
        feedback.activate();
    };
    
    return (
        <>
            <Button
                variant="primary"
                size="compact"
                onClick={handleAutoSort}
                icon={feedback.isActive ? check : listView}
                aria-label={__('Automatically sort CSS classes')}
            >
                {__('Auto Sort')}
            </Button>
            <AriaLiveAnnouncement message={feedback.message} />
        </>
    );
};

/**
 * AlphaSortButton component for the modal
 */
export const AlphaSortButton = ({ classesArray, handleClassChange }) => {
    const feedback = useFeedback({
        successMessage: ARIA_MESSAGES.SORTED_ALPHA
    });
    
    const handleAlphaSort = () => {
        handleClassChange(sortClassesAlphabetically(classesArray));
        feedback.activate();
    };
    
    return (
        <>
            <Button
                variant="secondary"
                size="compact"
                icon={feedback.isActive ? check : formatLowercase}
                onClick={handleAlphaSort}
                aria-label={__('Sort CSS classes alphabetically')}
            >
                {__('Alpha Sort')}
            </Button>
            <AriaLiveAnnouncement message={feedback.message} />
        </>
    );
};

/**
 * LengthSortButton component for the modal
 */
export const LengthSortButton = ({ classesArray, handleClassChange }) => {
    const feedback = useFeedback({
        successMessage: ARIA_MESSAGES.SORTED_LENGTH
    });
    
    const handleLengthSort = () => {
        handleClassChange(sortClassesByLength(classesArray));
        feedback.activate();
    };
    
    return (
        <>
            <Button
                variant="secondary"
                size="compact"
                icon={feedback.isActive ? check : formatOutdentRTL}
                onClick={handleLengthSort}
                aria-label={__('Sort CSS classes by length')}
            >
                {__('Length Sort')}
            </Button>
            <AriaLiveAnnouncement message={feedback.message} />
        </>
    );
};

/**
 * StyleToEndButton component for the modal
 */
export const StyleToEndButton = ({ classesArray, handleClassChange }) => {
    const feedback = useFeedback({
        successMessage: ARIA_MESSAGES.STYLE_MOVED
    });
    
    const handleMoveToEnd = () => {
        handleClassChange(moveStyleClassToEnd(classesArray));
        feedback.activate();
    };
    
    return (
        <>
            <Button
                variant="secondary"
                size="compact"
                icon={feedback.isActive ? check : moveTo}
                onClick={handleMoveToEnd}
                aria-label={__('Move style classes to the end')}
            >
                {__('Block Style to End')}
            </Button>
            <AriaLiveAnnouncement message={feedback.message} />
        </>
    );
};

/**
 * ClearCustomButton component for the modal
 */
export const ClearCustomButton = ({ classesArray, handleClassChange }) => {
    const feedback = useFeedback({
        successMessage: ARIA_MESSAGES.CLEARED_CUSTOM
    });
    
    const handleClearCustom = () => {
        handleClassChange(clearExceptStyleClasses(classesArray));
        feedback.activate();
    };
    
    return (
        <>
            <Button
                variant="secondary"
                isDestructive
                size="compact"
                onClick={handleClearCustom}
                icon={feedback.isActive ? check : tableRowDelete}
                aria-label={__('Clear all custom classes, keeping style classes')}
            >
                {__('Clear Custom')}
            </Button>
            <AriaLiveAnnouncement message={feedback.message} />
        </>
    );
};

/**
 * ClearAllButton component for the modal
 */
export const ClearAllButton = ({ handleTextAreaChange }) => {
    const feedback = useFeedback({
        successMessage: ARIA_MESSAGES.CLEARED_ALL
    });
    
    const handleClearAll = () => {
        handleTextAreaChange('');
        feedback.activate();
    };
    
    return (
        <>
            <Button
                variant="secondary"
                isDestructive
                size="compact"
                onClick={handleClearAll}
                icon={feedback.isActive ? check : trash}
                aria-label={__('Clear all CSS classes')}
            >
                {__('Clear All')}
            </Button>
            <AriaLiveAnnouncement message={feedback.message} />
        </>
    );
};

/**
 * Global modal container that listens for open requests
 */
export const ClassActModal = () => {
    const { isOpen, blockClientId, closeModal } = useModalContext();
    
    // Return early if modal is not open or no block is selected
    if (!isOpen || !blockClientId) {
        return null;
    }
    
    // Use createPortal to render the modal in the #classact-modal-root
    return createPortal(
        <ClassActManagementModal 
            clientId={blockClientId} 
            onRequestClose={closeModal} 
            isKeyboardShortcutTriggered={true}
        />,
        document.getElementById('classact-modal-root')
    );
};

/**
 * Reusable class management modal component
 * Now uses the centralized useClassManagement and useBlockAttributes hooks
 */
export const ClassActManagementModal = ({ 
    clientId, 
    onRequestClose, 
    isKeyboardShortcutTriggered = false, 
    classes, 
    name, 
    array, 
    setAttributes, 
    updateArray 
}) => {
    // If keyboard shortcut mode is active, use the clientId to get block data
    const blockAttrs = isKeyboardShortcutTriggered 
        ? useBlockAttributes({ clientId })
        : null;
    
    // Get the initial class string from the appropriate source
    const initialClasses = isKeyboardShortcutTriggered 
        ? blockAttrs?.attributes?.className 
        : classes;
    
    // Use our new hook for class management
    const classManagement = useClassManagement({
        initialClasses,
        onChange: (newClassName) => {
            if (isKeyboardShortcutTriggered && blockAttrs) {
                blockAttrs.updateClassName(newClassName);
            } else if (updateArray) {
                updateArray(parseClassNames(newClassName || ''));
            } else if (setAttributes) {
                setAttributes({
                    className: newClassName
                });
            }
        },
        onTextChange: (value) => {
            if (isKeyboardShortcutTriggered && blockAttrs) {
                blockAttrs.updateClassName(value);
            } else if (setAttributes) {
                setAttributes({
                    className: value
                });
            }
        }
    });
    
    // Use given array or parse from class string
    const classesArray = array || classManagement.classesArray;
    
    // Initialize textarea value from props or state
    useEffect(() => {
        if (initialClasses !== undefined) {
            classManagement.handleTextChange(initialClasses || '');
        }
    }, [initialClasses]);
    
    // Get the block's display title using our custom hook with fallbacks
    const blockDisplayTitle = useBlockTitle({ 
        clientId,
        fallbackName: name || (blockAttrs?.blockName)
    });
    
    // If in keyboard shortcut mode and no block data yet, return null
    if (isKeyboardShortcutTriggered && (!blockAttrs || !classesArray)) {
        return null;
    }
    
    return (
        <Modal
            icon={styles}
            size="large"
            title={__('Manage CSS Classes')}
            onRequestClose={onRequestClose}
            headerActions={<CopyButton className={initialClasses} variant="secondary" size="compact" />}
        >
            {classManagement.errorMessage && (
                <Notice
                    status="error"
                    isDismissible
                    onRemove={() => classManagement.setErrorMessage('')}
                    className="classact-error-message"
                >
                    <span id="classact-error-message">{classManagement.errorMessage}</span>
                </Notice>
            )}
            
            <div className="classact-modal-header">
                <BlockTitleDisplay 
                    clientId={clientId} 
                    title={blockDisplayTitle} 
                />
                
                <div className="classact-block-title__count">
                    {classesArray.length}
                </div>
            </div>
            
            <FormTokenField
                label={__('CSS Classes')}
                value={classesArray}
                placeholder={__('Separate with spaces or commas')}
                onChange={classManagement.handleClassChange}
                __experimentalValidateInput={(token) => classManagement.isValidClass(token)}
                __experimentalShowHowTo={false}
                tokenizeOnSpace
                tokenizeOnBlur
                __next40pxDefaultSize
                __nextHasNoMarginBottom
                help={__('Type class names and press Enter or Space to add. Press backspace to remove.')}
                aria-describedby={classManagement.errorMessage ? 'classact-error-message' : undefined}
            />
            
            <div className="classact-spacer" />
            
            <TextareaControl
                label={__('Class Names')}
                value={classManagement.textValue}
                onChange={classManagement.handleTextChange}
                onBlur={classManagement.handleTextBlur}
                __nextHasNoMarginBottom
            />
            
            <div className="classact-modal-button-group">
                <AutoSortButton 
                    classesArray={classesArray} 
                    handleClassChange={classManagement.handleClassChange} 
                />
                <AlphaSortButton 
                    classesArray={classesArray} 
                    handleClassChange={classManagement.handleClassChange} 
                />
                <LengthSortButton 
                    classesArray={classesArray} 
                    handleClassChange={classManagement.handleClassChange} 
                />
                <StyleToEndButton 
                    classesArray={classesArray} 
                    handleClassChange={classManagement.handleClassChange} 
                />
                <ClearCustomButton 
                    classesArray={classesArray} 
                    handleClassChange={classManagement.handleClassChange} 
                />
                <ClearAllButton 
                    handleTextAreaChange={classManagement.handleTextChange} 
                />
            </div>
        </Modal>
    );
};