import React, { useState, useContext, useCallback } from 'react';
import { Eye, EyeOff, AlertTriangle } from 'lucide-react';
import { ThemeContext } from '../context/ThemeContext';

/**
 * PasswordInput — Reusable password field with:
 *   • Eye / EyeOff toggle to show / hide the text
 *   • Live Caps Lock warning banner
 *
 * Props:
 *   value        (string)   — controlled value
 *   onChange     (fn)       — change handler
 *   placeholder  (string)   — placeholder text (default: "Password")
 *   name         (string)   — input name attribute
 *   label        (string)   — optional label above the input
 *   disabled     (bool)     — disable the field
 *   className    (string)   — extra wrapper classes
 *   inputClassName (string) — extra classes applied to the <input> itself
 */
export default function PasswordInput({
    value,
    onChange,
    placeholder = 'Password',
    name = 'password',
    label,
    disabled = false,
    className = '',
    inputClassName = '',
    required = false,
}) {
    const { isDarkMode } = useContext(ThemeContext);
    const [showPassword, setShowPassword] = useState(false);
    const [capsLockOn, setCapsLockOn] = useState(false);

    // Detect Caps Lock from both keydown and keyup for reliability
    const handleKeyEvent = useCallback((e) => {
        if (e.getModifierState) {
            setCapsLockOn(e.getModifierState('CapsLock'));
        }
    }, []);

    const baseInput = `w-full pr-12 p-3 rounded-xl outline-none border-2 transition-all duration-200 ${
        isDarkMode
            ? 'bg-white/5 border-white/10 text-white placeholder-gray-600 focus:border-jade-500/80'
            : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:border-jade-500'
    } ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`;

    return (
        <div className={`flex flex-col gap-1.5 ${className}`}>
            {label && (
                <label className="text-xs text-gray-400 uppercase tracking-widest font-bold">
                    {label}
                </label>
            )}

            {/* Input wrapper */}
            <div className="relative">
                <input
                    type={showPassword ? 'text' : 'password'}
                    name={name}
                    value={value}
                    onChange={onChange}
                    onKeyDown={handleKeyEvent}
                    onKeyUp={handleKeyEvent}
                    placeholder={placeholder}
                    disabled={disabled}
                    required={required}
                    className={`${baseInput} ${inputClassName}`}
                />

                {/* Show / Hide toggle button */}
                <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    disabled={disabled}
                    tabIndex={-1} // don't interrupt tab flow
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className={`absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-md transition-colors duration-150 
                        ${isDarkMode
                            ? 'text-gray-400 hover:text-white hover:bg-white/10'
                            : 'text-gray-400 hover:text-gray-700 hover:bg-gray-100'
                        } ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
                >
                    {showPassword
                        ? <EyeOff size={18} strokeWidth={1.8} />
                        : <Eye size={18} strokeWidth={1.8} />
                    }
                </button>
            </div>

            {/* Caps Lock warning */}
            {capsLockOn && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-500/15 border border-amber-500/30 animate-fade-in">
                    <AlertTriangle size={14} className="text-amber-400 shrink-0" />
                    <span className="text-amber-400 text-xs font-semibold tracking-wide">
                        Caps Lock is ON
                    </span>
                </div>
            )}
        </div>
    );
}
