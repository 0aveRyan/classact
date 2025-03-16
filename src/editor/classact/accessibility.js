/**
 * ClassAct - Accessibility Utilities
 */

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState, useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { ARIA_MESSAGES } from './utils';

/**
 * A centralized component for announcing status messages to screen readers
 * 
 * @param {Object} props Component props
 * @param {string} props.message The message to announce
 * @param {number} props.duration How long the message persists (ms), defaults to 2000ms
 * @returns {JSX.Element} The ARIA live region announcement component
 */
export const AriaLiveAnnouncement = ({ message, duration = 2000 }) => {
    const [statusMessage, setStatusMessage] = useState(message || '');
    
    useEffect(() => {
        if (!message) return;
        
        setStatusMessage(message);
        
        const timer = setTimeout(() => {
            setStatusMessage('');
        }, duration);
        
        return () => clearTimeout(timer);
    }, [message, duration]);
    
    return (
        <div 
            aria-live="polite" 
            aria-atomic="true"
            className="classact-visually-hidden"
        >
            {statusMessage}
        </div>
    );
};

/**
 * Custom hook for managing temporary feedback and announcements
 * 
 * @param {Object} options Hook options
 * @param {string} options.successMessage The message to announce on success
 * @param {number} options.duration How long the feedback should persist (ms)
 * @returns {Object} Object containing state and methods for managing feedback
 */
export const useFeedback = ({ successMessage, duration = 2000 }) => {
    const [isActive, setIsActive] = useState(false);
    const [message, setMessage] = useState('');
    
    const activate = (customMessage) => {
        setIsActive(true);
        setMessage(customMessage || successMessage);
        
        setTimeout(() => {
            setIsActive(false);
            setMessage('');
        }, duration);
    };
    
    const clearFeedback = () => {
        setIsActive(false);
        setMessage('');
    };
    
    return {
        isActive,
        message,
        activate,
        clearFeedback
    };
};

/**
 * Reusable component for buttons with feedback
 * 
 * @param {Object} props Component props
 * @param {ReactNode} props.children Button children
 * @param {string} props.feedbackText Text to show when feedback is active
 * @param {string} props.ariaMessage ARIA message to announce
 * @param {Function} props.onClick Click handler
 * @param {string} props.ariaLabel Button ARIA label
 * @param {Object} props.buttonProps Other button props to pass through
 * @returns {JSX.Element} Button with feedback capability
 */
export const FeedbackButton = ({ 
    children,
    feedbackText,
    ariaMessage,
    onClick,
    ariaLabel,
    ...buttonProps
}) => {
    const feedback = useFeedback({ 
        successMessage: ariaMessage 
    });
    
    const handleClick = (event) => {
        feedback.activate();
        
        if (onClick) {
            onClick(event);
        }
    };
    
    return (
        <>
            <Button
                onClick={handleClick}
                aria-label={ariaLabel}
                {...buttonProps}
            >
                {feedback.isActive ? feedbackText : children}
            </Button>
            <AriaLiveAnnouncement message={feedback.message} />
        </>
    );
};