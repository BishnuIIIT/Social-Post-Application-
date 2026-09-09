import React from "react";
import Spinner from "./Spinner.jsx";
import styles from "./shared.module.css";

/**
 * Reusable Button component.
 *
 * @param {object}   props
 * @param {"primary"|"secondary"|"outline"|"ghost"|"danger"} [props.variant="primary"]
 * @param {"sm"|"md"|"lg"} [props.size="md"]
 * @param {boolean}  [props.loading=false]
 * @param {boolean}  [props.disabled=false]
 * @param {boolean}  [props.block=false]
 * @param {React.ReactNode} [props.icon]
 * @param {React.ReactNode} props.children
 * @param {string}   [props.className=""]
 * @param {string}   [props.type="button"]
 */
export default function Button({
  variant = "primary",
  size = "md",
  loading = false,
  disabled = false,
  block = false,
  icon = null,
  children,
  className = "",
  type = "button",
  ...rest
}) {
  const variantClass = {
    primary: styles.btnPrimary,
    secondary: styles.btnSecondary,
    outline: styles.btnOutline,
    ghost: styles.btnGhost,
    danger: styles.btnDanger,
  }[variant] || styles.btnPrimary;

  const sizeClass = {
    sm: styles.btnSm,
    md: styles.btnMd,
    lg: styles.btnLg,
  }[size] || styles.btnMd;

  const classes = [
    styles.btn,
    variantClass,
    sizeClass,
    block ? styles.btnBlock : "",
    loading ? styles.btnLoading : "",
    className,
  ].filter(Boolean).join(" ");

  return (
    <button
      type={type}
      className={classes}
      disabled={disabled || loading}
      aria-busy={loading}
      {...rest}
    >
      {loading ? (
        <>
          <Spinner size={size === "sm" ? 14 : 16} color="currentColor" />
          <span>{children}</span>
        </>
      ) : (
        <>
          {icon && <span aria-hidden="true">{icon}</span>}
          {children}
        </>
      )}
    </button>
  );
}
