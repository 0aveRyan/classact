/**
 * ClassAct - Accessibility Utilities
 *
 * This module provides accessibility-focused components and hooks for the ClassAct plugin.
 * It includes ARIA live regions, feedback management, and accessible button components.
 * These utilities help ensure the plugin meets WCAG accessibility guidelines.
 *
 * @module ClassAct/Accessibility
 * @since 2.0.0
 */

/**
 * WordPress dependencies
 */
import { Button } from '@wordpress/components';
import { useState, useEffect, forwardRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { ARIA_MESSAGES, TIMING } from './utils';

/**
 * ARIA Live Region Announcement Component
 *
 * A centralized component for announcing status messages to screen readers.
 * This component creates a visually hidden region that screen readers will
 * announce when its content changes. It manages the announcement lifecycle,
 * including clearing the announcement after a specified duration.
 *
 * @since 2.0.0
 *
 * @param {Object} props Component props
 * @param {string} props.message The message to announce to screen readers
 * @param {number} props.duration How long the message persists (ms), defaults to 2000ms
 * @returns {JSX.Element} The ARIA live region announcement component
 *
 * @example
 * ```jsx
 * <AriaLiveAnnouncement message="Classes sorted alphabetically" duration={3000} />
 * ```
 */
export const AriaLiveAnnouncement = ( {
	message,
	duration = TIMING.ANNOUNCEMENT_DURATION,
} ) => {
	// Store the current announcement message
	const [ statusMessage, setStatusMessage ] = useState( message || '' );

	// Update the announcement when the message changes
	useEffect( () => {
		// Don't do anything if there's no message to announce
		if ( ! message ) return;

		// Set the message to be announced
		setStatusMessage( message );

		// Clear the message after the specified duration
		const timer = setTimeout( () => {
			setStatusMessage( '' );
		}, duration );

		// Clean up the timer if the component unmounts
		return () => clearTimeout( timer );
	}, [ message, duration ] );

	return (
		<div
			aria-live="polite" // Use "polite" to not interrupt the screen reader
			aria-atomic="true" // Read the entire content each time it changes
			className="classact-visually-hidden" // Visually hidden but available to screen readers
		>
			{ statusMessage }
		</div>
	);
};

/**
 * Feedback Management Hook
 *
 * Custom hook for managing temporary feedback states and accessibility announcements.
 * Provides utilities to display temporary feedback messages to users and
 * announce changes to screen readers.
 *
 * @since 2.0.0
 *
 * @param {Object} options Hook options
 * @param {string} options.successMessage The message to announce on success
 * @param {number} options.duration How long the feedback should persist (ms)
 * @returns {Object} Object containing state and methods for managing feedback
 *
 * @example
 * ```jsx
 * const feedback = useFeedback({
 *   successMessage: 'Item copied to clipboard',
 *   duration: 3000
 * });
 *
 * // Later in your code:
 * feedback.activate(); // Shows feedback and announces message
 * ```
 */
export const useFeedback = ( {
	successMessage,
	duration = TIMING.FEEDBACK_DURATION,
} ) => {
	// Track if feedback is currently being shown
	const [ isActive, setIsActive ] = useState( false );

	// Store the current announcement message
	const [ message, setMessage ] = useState( '' );

	/**
	 * Activate the feedback state
	 *
	 * @param {string} [customMessage] Optional custom message to override the default
	 */
	const activate = ( customMessage ) => {
		// Show the feedback UI
		setIsActive( true );

		// Set the message for screen readers
		setMessage( customMessage || successMessage );

		// Automatically clear the feedback after the duration
		setTimeout( () => {
			setIsActive( false );
			setMessage( '' );
		}, duration );
	};

	/**
	 * Immediately clear the feedback state
	 */
	const clearFeedback = () => {
		setIsActive( false );
		setMessage( '' );
	};

	return {
		isActive,
		message,
		activate,
		clearFeedback,
	};
};

/**
 * Accessible Button with Visual Feedback
 *
 * A reusable component for buttons that provide both visual feedback
 * and screen reader announcements when activated. Combines the WordPress
 * Button component with accessibility features.
 *
 * @since 2.0.0
 *
 * @param {Object} props Component props
 * @param {ReactNode} props.children Button label content when not in feedback state
 * @param {string} props.feedbackText Text to show when feedback is active
 * @param {string} props.ariaMessage Screen reader announcement when button is activated
 * @param {Function} props.onClick Additional click handler function
 * @param {string} props.ariaLabel Accessible description of the button's action
 * @param {Object} props.icon Icon component to display in the button
 * @param {Object} props.buttonProps Additional props passed to the Button component
 * @param {Object} ref Forwarded ref to the button element
 * @returns {JSX.Element} Accessible button with feedback capability
 *
 * @example
 * ```jsx
 * <FeedbackButton
 *   feedbackText="Copied!"
 *   ariaMessage="Text copied to clipboard"
 *   icon={copyIcon}
 *   onClick={() => copyToClipboard(text)}
 *   ariaLabel="Copy text to clipboard"
 * >
 *   Copy
 * </FeedbackButton>
 * ```
 */
export const FeedbackButton = forwardRef(
	(
		{
			children,
			feedbackText,
			ariaMessage,
			onClick,
			ariaLabel,
			icon,
			...buttonProps
		},
		ref
	) => {
		// Set up feedback management
		const feedback = useFeedback( {
			successMessage: ariaMessage,
		} );

		/**
		 * Handle button click with feedback
		 *
		 * @param {Event} event Click event
		 */
		const handleClick = ( event ) => {
			// Activate feedback
			feedback.activate();

			// Call the provided onClick handler if it exists
			if ( onClick ) {
				onClick( event );
			}
		};

		return (
			<>
				<Button
					onClick={ handleClick }
					aria-label={ ariaLabel }
					icon={ icon }
					ref={ ref }
					{ ...buttonProps }
				>
					{ feedback.isActive ? feedbackText : children }
				</Button>
				<AriaLiveAnnouncement message={ feedback.message } />
			</>
		);
	}
);
