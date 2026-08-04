import React, { useState } from 'react';
import { X, FileCode, Download, Copy, Check, Terminal } from 'lucide-react';

interface PostmanModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PostmanModal: React.FC<PostmanModalProps> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopyCurl = () => {
    const curlCommand = `curl -X POST http://localhost:3000/api/auth/login \\
  -H "Content-Type: application/json" \\
  -d '{"email": "john.doe@gmail.com", "password": "patient123"}'`;
    navigator.clipboard.writeText(curlCommand);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl border border-slate-100 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center">
              <FileCode className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold">Postman API Collection</h3>
              <p className="text-xs text-slate-400">
                Complete REST API schema & endpoint test suite
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

        {/* Modal Body */}
        <div className="p-6 space-y-6 overflow-y-auto">
          <div className="p-4 bg-orange-50 border border-orange-200/80 rounded-2xl flex items-start space-x-3">
            <div className="p-2 bg-orange-100 rounded-lg text-orange-700 shrink-0 mt-0.5">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900">
                Exported v2.1 Postman Collection
              </h4>
              <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                Download the complete JSON Postman collection containing pre-configured request
                payloads for Auth, Doctors, Appointments, and Admin endpoints.
              </p>
              <a
                href="/api/postman-collection"
                download="Book_a_Doctor_Postman_Collection.json"
                className="mt-3 inline-flex items-center space-x-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm shadow-orange-600/20"
              >
                <Download className="w-4 h-4" />
                <span>Download Postman JSON</span>
              </a>
            </div>
          </div>

          {/* Quick API Credentials Cheatsheet */}
          <div>
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Pre-seeded Role Test Credentials
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="text-2xs font-bold text-slate-500 uppercase block">Patient</span>
                <span className="font-mono text-slate-900 block font-semibold">john.doe@gmail.com</span>
                <span className="text-2xs text-slate-500">pass: patient123</span>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="text-2xs font-bold text-teal-600 uppercase block">Doctor</span>
                <span className="font-mono text-slate-900 block font-semibold">dr.smith@bookadoctor.com</span>
                <span className="text-2xs text-slate-500">pass: doctor123</span>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="text-2xs font-bold text-indigo-600 uppercase block">Admin</span>
                <span className="font-mono text-slate-900 block font-semibold">admin@bookadoctor.com</span>
                <span className="text-2xs text-slate-500">pass: admin123</span>
              </div>
            </div>
          </div>

          {/* Sample cURL Request */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center space-x-1">
                <Terminal className="w-3.5 h-3.5 text-slate-500" />
                <span>Quick cURL Example</span>
              </h4>
              <button
                onClick={handleCopyCurl}
                className="text-xs font-semibold text-teal-600 hover:text-teal-700 flex items-center space-x-1"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied!' : 'Copy cURL'}</span>
              </button>
            </div>
            <pre className="p-3 bg-slate-900 text-teal-300 rounded-xl text-xs font-mono overflow-x-auto leading-relaxed">
{`curl -X POST http://localhost:3000/api/auth/login \\
  -H "Content-Type: application/json" \\
  -d '{"email": "john.doe@gmail.com", "password": "patient123"}'`}
            </pre>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 text-right">
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-200 rounded-xl transition-colors"
          >
            Close Window
          </button>
        </div>
      </div>
    </div>
  );
};
