import React from "react";
import styles from "./shared.module.css";

/**
 * Reusable Card container component.
 *
 * @param {object} props
 * @param {React.ReactNode} props.children
 * @param {boolean} [props.elevated=false]
 * @param {boolean} [props.hoverable=false]
 * @param {"none"|"sm"|"md"|"lg"} [props.padding="md"]
 * @param {keyof JSX.IntrinsicElements} [props.as="div"]
 * @param {string} [props.className=""]
 */
export default function Card({
  children,
  elevated = false,
  hoverable = false,
  padding = "md",
  as: Component = "div",
  className = "",
  ...rest
}) {
  const paddingClass = {
    none: "",
    sm: styles.cardPaddingSm,
    md: styles.cardPaddingMd,
    lg: styles.cardPaddingLg,
  }[padding] || styles.cardPaddingMd;

  const classes = [
    styles.cardRoot,
    elevated ? styles.cardElevated : "",
    hoverable ? styles.cardHoverable : "",
    paddingClass,
    className,
  ].filter(Boolean).join(" ");

  return (
    <Component className={classes} {...rest}>
      {children}
    </Component>
  );
}
