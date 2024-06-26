import React, { ReactNode } from 'react';

interface Props {
  onClose: () => void;
  children: ReactNode;
}

const Modal: React.FC<Props> = ({ onClose, children }) => {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white p-4 rounded shadow-lg relative">
        <button
          onClick={onClose}
          className="absolute top-0 right-0 m-2 text-gray-600 hover:text-gray-800"
        >
          &times;
        </button>
        {children}
      </div>
    </div>
  );
};

export default Modal;
