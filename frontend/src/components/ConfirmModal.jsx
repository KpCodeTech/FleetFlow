
import { X, AlertTriangle } from 'lucide-react';

/**
 * Reusable confirmation modal — replaces window.confirm()
 * Props:
 *   open      {boolean}   - show/hide
 *   title     {string}    - modal heading
 *   message   {string}    - body text
 *   onConfirm {Function}  - called on confirm click
 *   onCancel  {Function}  - called on cancel / backdrop click
 *   danger    {boolean}   - use red confirm button (default: true)
 *   confirmLabel {string} - button label (default: 'Confirm')
 */
export default function ConfirmModal({ open, title = 'Are you sure?', message, onConfirm, onCancel, danger = true, confirmLabel = 'Confirm' }) {
  if (!open) return null;

  return (
    <div
      onClick={onCancel}
      className="fixed inset-0 z-[1000] bg-gray-900/60 backdrop-blur-sm flex items-center justify-center"
    >
      <div
        onClick={e => e.stopPropagation()}
        className="bg-white border border-gray-100 rounded-xl p-6 w-[420px] max-w-[90vw] shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-3.5">
          <div className="flex items-center gap-2.5">
            <div className={`w-9 h-9 rounded-full shrink-0 flex items-center justify-center ${danger ? 'bg-red-50' : 'bg-amber-50'}`}>
              <AlertTriangle size={18} className={danger ? 'text-red-500' : 'text-amber-500'} />
            </div>
            <h3 className="m-0 font-bold text-base text-gray-900">{title}</h3>
          </div>
          <button onClick={onCancel} className="bg-transparent border-none cursor-pointer text-gray-400 hover:text-gray-600 p-0.5 transition-colors">
            <X size={17} />
          </button>
        </div>

        {/* Message */}
        {message && (
          <p className="m-0 mb-5 text-sm text-gray-500 leading-relaxed">
            {message}
          </p>
        )}

        {/* Buttons */}
        <div className="flex gap-2.5 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 border border-gray-200 text-gray-600 bg-transparent rounded-lg hover:bg-gray-50 text-sm font-medium transition-colors min-w-[80px] flex justify-center items-center cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`min-w-[100px] flex justify-center items-center px-4 py-2 rounded-lg border-none cursor-pointer font-semibold text-sm text-white transition-opacity duration-150 hover:opacity-85 ${danger ? 'bg-red-500' : 'bg-blue-600'}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}