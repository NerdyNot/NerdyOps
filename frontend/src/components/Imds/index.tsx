import React from 'react';
import JSONPretty from 'react-json-pretty';
import 'react-json-pretty/themes/monikai.css';

interface ImdsModalProps {
  isOpen: boolean;
  onClose: () => void;
  json: any;
}

const ImdsModal: React.FC<ImdsModalProps> = ({ isOpen, onClose, json }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-3/4 max-w-4xl overflow-y-auto max-h-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold">IMDS Data</h2>
          <button
            onClick={onClose}
            className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 transition duration-300"
          >
            Close
          </button>
        </div>
        <div className="bg-gray-100 p-4 rounded-lg">
          <JSONPretty data={json} />
        </div>
      </div>
    </div>
  );
};

export default ImdsModal;
