import React, { forwardRef } from "react";
import styles from "./shared.module.css";

/**
 * Reusable accessible Input component with label, error message, and helper text.
 *
 * @param {object} props
 * @param {string|React.ReactNode} [props.label]
 * @param {string} [props.error]
 * @param {string} [props.helperText]
 * @param {string} [props.className]
 * @param {string} [props.inputClassName]
 * @param {React.ReactNode} [props.rightElement]
 */
const Input = forwardRef(function Input(
  {
    label,
    error,
    helperText,
    id,
    className = "",
    inputClassName = "",
    rightElement = null,
    type = "text",
    ...rest
  },
  ref
) {
  const inputId = id || (label ? `input-${label.toString().toLowerCase().replace(/\s+/g, "-")}` : undefined);

  return (
    <div className={`${styles.formGroup} ${className}`}>
      {label && (
        <label htmlFor={inputId} className={styles.formLabel}>
          {label}
        </label>
      )}

      <div style={{ position: "relative", width: "100%" }}>
        <input
          ref={ref}
          id={inputId}
          type={type}
          className={`${styles.inputField} ${error ? styles.inputFieldError : ""} ${inputClassName}`}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined}
          {...rest}
        />
        {rightElement}
      </div>

      {error ? (
        <span id={`${inputId}-error`} className={styles.helperText} style={{ color: "var(--color-error)" }} role="alert">
          {error}
        </span>
      ) : helperText ? (
        <span id={`${inputId}-helper`} className={styles.helperText}>
          {helperText}
        </span>
      ) : null}
    </div>
  );
});

export default Input;
