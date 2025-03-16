/**
 * ClassAct - Improved Modal State Management
 * 
 * This implementation simplifies the modal state approach by:
 * 1. Using a cleaner context pattern with proper defaults
 * 2. Removing the separate singleton state object and unifying state management
 * 3. Adding TypeScript-like documentation for better code understanding
 * 4. Providing a more straightforward API for consumers
 */
import {
	createContext,
	useState,
	useContext,
	useCallback,
	useEffect,
} from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Modal Context type definition
 * @typedef {Object} ModalContextType
 * @property {boolean} isOpen - Whether the modal is currently open
 * @property {string|null} blockClientId - The client ID of the current block, if any
 * @property {string|null} blockTitle - Optional display title for the block
 * @property {Function} openModal - Function to open the modal
 * @property {Function} closeModal - Function to close the modal
 */

/**
 * Default context value
 * @type {ModalContextType}
 */
const defaultContextValue = {
	isOpen: false,
	blockClientId: null,
	blockTitle: null,
	openModal: () => {},
	closeModal: () => {},
};

// Create a single event emitter for global access
const modalEvents = {
	listeners: new Set(),
	emit: (data) => {
		modalEvents.listeners.forEach((listener) => listener(data));
	},
	subscribe: (listener) => {
		modalEvents.listeners.add(listener);
		return () => {
			modalEvents.listeners.delete(listener);
		};
	},
};

// Create the context with default implementation
const ModalContext = createContext(defaultContextValue);

/**
 * Modal Provider component
 * 
 * Provides modal state management to all child components
 * 
 * @param {Object} props Component props
 * @param {React.ReactNode} props.children Child components
 * @returns {JSX.Element} Provider component
 */
export const ModalProvider = ({ children }) => {
	const [state, setState] = useState({
		isOpen: false,
		blockClientId: null,
		blockTitle: null,
	});

	// Subscribe to global events (useful for keyboard shortcuts)
	useEffect(() => {
		// Handle external open/close requests
		const handleExternalRequest = (data) => {
			setState((prevState) => ({
				...prevState,
				...data,
			}));
		};

		// Subscribe and return unsubscribe function
		return modalEvents.subscribe(handleExternalRequest);
	}, []);

	// Open modal function
	const openModal = useCallback((clientId, title = null) => {
		const newState = {
			isOpen: true,
			blockClientId: clientId,
			blockTitle: title,
		};
		
		setState(newState);
		modalEvents.emit(newState);
	}, []);

	// Close modal function
	const closeModal = useCallback(() => {
		const newState = {
			isOpen: false,
			blockClientId: null,
			blockTitle: null,
		};
		
		setState(newState);
		modalEvents.emit(newState);
	}, []);

	// Combine state and functions into context value
	const value = {
		...state,
		openModal,
		closeModal,
	};

	return (
		<ModalContext.Provider value={value}>
			{children}
		</ModalContext.Provider>
	);
};

/**
 * Custom hook to access the modal context
 * 
 * This hook provides access to the modal state and actions.
 * Will work both inside and outside the provider by using the event system as fallback.
 * 
 * @returns {ModalContextType} Modal context with state and actions
 */
export const useModalContext = () => {
	// Try to get context from provider
	const context = useContext(ModalContext);
	
	// If we have a valid context, return it
	if (context !== defaultContextValue) {
		return context;
	}
	
	// Create a standalone implementation for components outside the provider
	const [state, setState] = useState({
		isOpen: false,
		blockClientId: null,
		blockTitle: null,
	});
	
	// Subscribe to global events on first render
	useEffect(() => {
		return modalEvents.subscribe(setState);
	}, []);
	
	// Provide fallback implementation
	return {
		...state,
		openModal: (clientId, title = null) => {
			const newState = {
				isOpen: true,
				blockClientId: clientId,
				blockTitle: title,
			};
			modalEvents.emit(newState);
		},
		closeModal: () => {
			const newState = {
				isOpen: false,
				blockClientId: null,
				blockTitle: null,
			};
			modalEvents.emit(newState);
		},
	};
};

/**
 * Global function to open the modal from non-React code
 * 
 * @param {string} clientId - Block client ID
 * @param {string|null} title - Optional block title
 */
export const openModalGlobal = (clientId, title = null) => {
	modalEvents.emit({
		isOpen: true,
		blockClientId: clientId,
		blockTitle: title,
	});
};

/**
 * Global function to close the modal from non-React code
 */
export const closeModalGlobal = () => {
	modalEvents.emit({
		isOpen: false,
		blockClientId: null,
		blockTitle: null,
	});
};

// Export direct API for non-React environments
export const ModalAPI = {
	open: openModalGlobal,
	close: closeModalGlobal,
};