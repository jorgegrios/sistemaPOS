/**
 * Modal Component
 * Base component for POS modals
 */

import React, { ReactNode } from 'react';

interface ModalProps {
    isOpen: boolean;
    onClose?: () => void;
    title: string;
    children: ReactNode;
    footer?: ReactNode;
    maxWidth?: string;
}

export const Modal: React.FC<ModalProps> = ({
    isOpen,
    onClose,
    title,
    children,
    footer,
    maxWidth = 'max-w-md'
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className={`bg-white rounded-2xl shadow-2xl w-full ${maxWidth} overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200`}>
                {/* Header */}
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4 flex items-center justify-between">
                    <h2 className="text-xl font-bold text-white">{title}</h2>
                    {onClose && (
                        <button
                            onClick={onClose}
                            className="text-white hover:bg-white/20 rounded-lg p-2 transition btn-touch"
                        >
                            ✕
                        </button>
                    )}
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto">
                    {children}
                </div>

                {/* Footer */}
                {footer && (
                    <div className="bg-gray-50 px-6 py-4 flex items-center justify-end gap-3 border-t">
                        {footer}
                    </div>
                )}
            </div>
        </div>
    );
};
