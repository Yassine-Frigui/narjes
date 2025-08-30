import React from 'react';
import { motion } from 'framer-motion';
import { FaTrash, FaExclamationTriangle, FaTimes } from 'react-icons/fa';

const DeleteConfirmationModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = "Supprimer l'élément", 
  message = "Êtes-vous sûr de vouloir supprimer cet élément ?",
  itemName = "",
  loading = false
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-dialog-centered">
        <motion.div
          className="modal-content"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <div className="modal-header border-0 pb-0">
            <h5 className="modal-title fw-bold text-danger d-flex align-items-center">
              <FaExclamationTriangle className="me-2" />
              {title}
            </h5>
            <button
              type="button"
              className="btn-close"
              onClick={onClose}
              disabled={loading}
            />
          </div>
          
          <div className="modal-body text-center py-4">
            <div className="mb-4">
              <div className="d-flex justify-content-center mb-3">
                <div className="rounded-circle bg-danger bg-opacity-10 p-3">
                  <FaTrash className="text-danger" size={32} />
                </div>
              </div>
              
              <p className="text-dark mb-2">
                {message}
              </p>
              
              {itemName && (
                <div className="alert alert-warning border-0 bg-warning bg-opacity-10 mt-3">
                  <strong>"{itemName}"</strong>
                </div>
              )}
              
              <p className="text-muted small mb-0">
                Cette action est irréversible.
              </p>
            </div>
          </div>
          
          <div className="modal-footer border-0 pt-0">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={loading}
            >
              <FaTimes className="me-2" />
              Annuler
            </button>
            <button
              type="button"
              className="btn btn-danger"
              onClick={onConfirm}
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="spinner-border spinner-border-sm me-2" role="status" />
                  Suppression...
                </>
              ) : (
                <>
                  <FaTrash className="me-2" />
                  Supprimer
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default DeleteConfirmationModal;
