import React, { useState } from 'react';
import { X, Upload, FileText, CheckCircle2, AlertCircle, Trash2 } from 'lucide-react';
import { Appointment, MedicalDocument } from '../types';
import { appointmentService } from '../services/api';

interface DocumentUploadModalProps {
  appointment: Appointment | null;
  isOpen: boolean;
  onClose: () => void;
  onUploadSuccess: (updatedAppointment: Appointment) => void;
}

export const DocumentUploadModal: React.FC<DocumentUploadModalProps> = ({
  appointment,
  isOpen,
  onClose,
  onUploadSuccess,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen || !appointment) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setErrorMessage(null);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setErrorMessage('Please select a file to upload.');
      return;
    }

    setIsUploading(true);
    setErrorMessage(null);

    try {
      const updatedApt = await appointmentService.uploadDocument(appointment._id, selectedFile);
      setSuccessMessage(`Document "${selectedFile.name}" attached successfully!`);
      setSelectedFile(null);
      onUploadSuccess(updatedApt);
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || 'Failed to upload document.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteDocument = async (docId: string) => {
    try {
      const updatedApt = await appointmentService.deleteDocument(appointment._id, docId);
      onUploadSuccess(updatedApt);
    } catch (err: any) {
      setErrorMessage('Failed to remove document.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-100 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center">
              <Upload className="w-5 h-5 text-teal-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold">Medical Documents</h3>
              <p className="text-xs text-slate-400">
                Appointment with Dr. {appointment.doctorName} ({appointment.date})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto">
          {/* Status feedback */}
          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center space-x-2 text-xs text-red-700">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center space-x-2 text-xs text-emerald-800">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Existing Attached Documents List */}
          <div>
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Attached Medical Records ({appointment.documents?.length || 0})
            </h4>

            {appointment.documents && appointment.documents.length > 0 ? (
              <div className="space-y-2">
                {appointment.documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between hover:bg-slate-100 transition-colors"
                  >
                    <div className="flex items-center space-x-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center shrink-0">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-slate-900 truncate">{doc.name}</p>
                        <p className="text-3xs text-slate-500">
                          Uploaded by {doc.uploadedBy} on{' '}
                          {new Date(doc.uploadedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <a
                        href={doc.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="px-2.5 py-1 text-2xs font-bold text-teal-700 bg-teal-100/80 rounded-lg hover:bg-teal-200"
                      >
                        View
                      </a>
                      <button
                        onClick={() => handleDeleteDocument(doc.id)}
                        className="p-1 text-slate-400 hover:text-red-600 rounded"
                        title="Remove Document"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500 bg-slate-50 p-3 rounded-xl text-center border border-dashed border-slate-200">
                No reports or prescriptions uploaded yet for this appointment.
              </p>
            )}
          </div>

          {/* Upload Form Area */}
          <form onSubmit={handleUpload} className="space-y-4 pt-2 border-t border-slate-100">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Upload New Document / Prescription
            </h4>

            <div className="border-2 border-dashed border-slate-200 hover:border-teal-400 rounded-2xl p-6 text-center transition-colors bg-slate-50/50">
              <input
                type="file"
                id="doc-upload-input"
                onChange={handleFileChange}
                className="hidden"
                accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
              />
              <label htmlFor="doc-upload-input" className="cursor-pointer block">
                <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2 group-hover:text-teal-600" />
                <span className="text-xs font-bold text-slate-700 block">
                  {selectedFile ? selectedFile.name : 'Click to select a file'}
                </span>
                <span className="text-2xs text-slate-400 block mt-1">
                  Supports PDF, PNG, JPG, DOCX (Max 10MB)
                </span>
              </label>
            </div>

            <div className="flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 rounded-xl"
              >
                Close
              </button>
              <button
                type="submit"
                disabled={!selectedFile || isUploading}
                className="px-5 py-2 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow-md disabled:opacity-50 transition-all flex items-center space-x-1"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>{isUploading ? 'Uploading...' : 'Upload & Attach'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
