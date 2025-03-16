/**
 * ClassAct - Core Functionality
 */

/**
 * WordPress dependencies
 */
import { hasBlockSupport } from '@wordpress/blocks';
import { InspectorAdvancedControls, store as blockEditorStore } from '@wordpress/block-editor';
import { FormTokenField, Notice, Button } from '@wordpress/components';
import { createHigherOrderComponent } from '@wordpress/compose';
import { dispatch, useSelect, useDispatch } from '@wordpress/data';
import domReady from '@wordpress/dom-ready';
import { 
    Fragment,
    createRoot
} from '@wordpress/element';
import { addFilter } from '@wordpress/hooks';
import { __ } from '@wordpress/i18n';
import { copySmall, tool, trash, listView } from '@wordpress/icons';
import { store as keyboardShortcutsStore, useShortcut } from '@wordpress/keyboard-shortcuts';
import { registerPlugin } from '@wordpress/plugins';

/**
 * Internal dependencies
 */
import { useModalContext, ModalProvider } from './context';
import { 
    CopyButton, 
    SortButton, 
    ClearButton, 
    ClassActModal, 
} from './components';
import { 
    useBlockTitle, 
    useBlockAttributes, 
    useClassManagement 
} from './hooks';

/**
 * Constants
 */
const FILTER_NAME = 'classact/inspector-controls';
const SHORTCUT_NAME = 'classact/open-css-modal';

/**
 * Register the keyboard shortcut at initialization time
 */
dispatch(keyboardShortcutsStore).registerShortcut({
    name: SHORTCUT_NAME,
    category: 'block',
    description: __('Open CSS class management modal'),
    keyCombination: {
        modifier: 'alt',
        character: 'c',
    },
});

/**
 * Global shortcut handler plugin
 */
registerPlugin('classact-global-shortcut', {
    render: () => {
        const { getSelectedBlockClientId, getBlockName } = useSelect(
            select => ({
                getSelectedBlockClientId: select(blockEditorStore).getSelectedBlockClientId,
                getBlockName: select(blockEditorStore).getBlockName
            }),
            []
        );

        // Use the context hook which falls back to the singleton
        const { openModal } = useModalContext();

        useShortcut(
            SHORTCUT_NAME,
            (event) => {
                event.preventDefault();
                
                const selectedBlockClientId = getSelectedBlockClientId();
                if (!selectedBlockClientId) {
                    return;
                }
                
                const blockName = getBlockName(selectedBlockClientId);
                if (!hasBlockSupport(blockName, 'customClassName', true)) {
                    return;
                }
                
                // This will work regardless of context availability
                openModal(selectedBlockClientId);
            },
            {
                bindGlobal: true,
            }
        );
        
        return null;
    }
});

/**
 * Higher-order component that adds CSS class management to block inspector controls
 * Now using the new useClassManagement and useBlockAttributes hooks
 */
const withClassActInspectorControls = createHigherOrderComponent(
    (BlockEdit) => {
        return (props) => {
            const { name, clientId } = props;
            
            // Skip if block doesn't support custom class names
            if (!hasBlockSupport(name, 'customClassName', true)) {
                return <BlockEdit {...props} />;
            }
            
            // Get block attributes and update functions using our custom hook
            const blockAttrs = useBlockAttributes({ clientId });
            
            // Get a user-friendly block title using our custom hook
            const blockTitle = useBlockTitle({ clientId, fallbackName: name });
            
            // Use our class management hook
            const classManagement = useClassManagement({
                initialClasses: blockAttrs?.attributes?.className,
                onChange: (newClassName) => {
                    if (blockAttrs) {
                        blockAttrs.updateClassName(newClassName);
                    }
                },
                onTextChange: (value) => {
                    if (blockAttrs) {
                        blockAttrs.updateClassName(value);
                    }
                }
            });
            
            // Use the modal context for opening the modal
            const { openModal } = useModalContext();
            
            return (
                <Fragment>
                    <BlockEdit {...props} />
                    <InspectorAdvancedControls>
                        {classManagement.errorMessage && (
                            <Notice
                                status="error"
                                isDismissible
                                onRemove={() => classManagement.setErrorMessage('')}
                                className="classact-error-message"
                            >
                                <span id="classact-inspector-error">{classManagement.errorMessage}</span>
                            </Notice>
                        )}
                        
                        <FormTokenField
                            label={__('Manage CSS Classes')}
                            value={classManagement.classesArray}
                            placeholder={__('Separate with spaces or commas')}
                            onChange={classManagement.handleClassChange}
                            __experimentalValidateInput={(token) => classManagement.isValidClass(token)}
                            __experimentalShowHowTo={false}
                            tokenizeOnSpace
                            tokenizeOnBlur
                            __next40pxDefaultSize
                            __nextHasNoMarginBottom
                            help={__('Type class names and press Enter or Space to add. Press backspace to remove.')}
                            aria-describedby={classManagement.errorMessage ? 'classact-inspector-error' : undefined}
                        />
                        
                        <div className="classact-spacer" />
                        
                        <div className="classact-button-group">
                            <CopyButton className={blockAttrs?.attributes?.className} />
                            <SortButton 
                                classesArray={classManagement.classesArray} 
                                handleClassChange={classManagement.handleClassChange} 
                            />
                            <ClearButton 
                                setAttributes={props.setAttributes} 
                            />
                        </div>
                        
                        <Button
                            variant="secondary"
                            size="compact"
                            onClick={() => openModal(clientId, blockTitle)}
                            icon={tool}
                            className="classact-full-width-button"
                            aria-label={__('Manage CSS Classes for') + ' ' + blockTitle}
                        >
                            {__('Manage')}
                        </Button>
                    </InspectorAdvancedControls>
                </Fragment>
            );
        };
    },
    'withClassActInspectorControls'
);

/**
 * Initialize the modal container
 */
domReady(() => {
    const modalRoot = document.createElement('div');
    modalRoot.id = 'classact-modal-root';
    document.body.appendChild(modalRoot);
    
    const root = createRoot(modalRoot);
    root.render(
        <ModalProvider>
            <ClassActModal />
        </ModalProvider>
    );
});

// Register the inspector controls
addFilter(
    'editor.BlockEdit',
    FILTER_NAME,
    withClassActInspectorControls
);