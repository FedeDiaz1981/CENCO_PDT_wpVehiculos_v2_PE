// src/webparts/registroVehicular/ui/styles.ts
import { createTheme, mergeStyleSets, IButtonStyles } from "@fluentui/react";

export const theme = createTheme({
  palette: {
    themePrimary: "#005596",
    themeLighterAlt: "#f2f7fb",
    themeLighter: "#deebf8",
    themeLight: "#c2daf1",
    themeTertiary: "#7eb2db",
    themeSecondary: "#2f7fc0",
    themeDarkAlt: "#004d87",
    themeDark: "#00406f",
    themeDarker: "#002f51",
    neutralLighterAlt: "#f4f9ff",
    neutralLighter: "#edf4fb",
    neutralLight: "#d7e5f3",
    neutralQuaternaryAlt: "#ccdaea",
    neutralQuaternary: "#c1d3e6",
    neutralTertiaryAlt: "#b5c7dc",
    neutralTertiary: "#333333",
    neutralSecondary: "#55687c",
    neutralPrimaryAlt: "#233140",
    neutralPrimary: "#1e2a36",
    neutralDark: "#1f1f1f",
    black: "#1a1a1a",
    white: "#ffffff",
  },
  effects: {
    roundedCorner2: "18px",
    elevation8: "0 12px 28px rgba(0,87,166,.12)" as any,
  },
});

const BRAND = {
  canvas: "#eef4fb",
  shell: "#f7fbff",
  ink: "#1e2a36",
  muted: "#617284",
  border: "#cad9ea",
  soft: "#e6f0fa",
};

const HERO_BG =
  "radial-gradient(circle at 14% 18%, rgba(255,255,255,.18) 0 82px, transparent 83px), radial-gradient(circle at 86% -10%, rgba(255,255,255,.18) 0 128px, transparent 130px), linear-gradient(135deg, #005596 0%, #0067b2 48%, #0072bc 100%)";

export const classes = mergeStyleSets({
  root: {
    position: "relative",
    padding: "16px 0 24px",
    background: "transparent",
  },
  page: {
    maxWidth: 1040,
    margin: "0 auto",
    padding: 18,
    background: `linear-gradient(180deg, ${BRAND.shell} 0%, ${BRAND.canvas} 100%)`,
    border: `1px solid ${BRAND.border}`,
    borderRadius: 32,
    boxShadow: "0 24px 54px rgba(0,87,166,.12)",
    selectors: {
      "@media (max-width: 720px)": {
        padding: 16,
        borderRadius: 24,
      },
    },
  },
  busyMask: {
    pointerEvents: "none",
    opacity: 0.72,
    filter: "grayscale(18%)",
  },
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(238,244,251,0.66)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9999,
    backdropFilter: "blur(3px)",
  },
  progressPanel: {
    width: "min(420px, calc(100vw - 32px))",
    background: "rgba(255,255,255,.96)",
    border: `1px solid ${BRAND.border}`,
    borderRadius: 22,
    boxShadow: "0 18px 32px rgba(0,87,166,.16)",
    padding: "16px 18px",
  },
  heroCard: {
    padding: 24,
    marginBottom: 18,
    background: HERO_BG,
    border: "1px solid rgba(255,255,255,.14)",
    borderRadius: 28,
    boxShadow: "0 24px 44px rgba(0,87,166,.22)",
    overflow: "hidden",
    position: "relative",
    selectors: {
      "&::after": {
        content: "\"\"",
        position: "absolute",
        inset: "auto -64px -96px auto",
        width: 220,
        height: 220,
        borderRadius: "50%",
        background: "rgba(255,255,255,.08)",
        pointerEvents: "none",
      },
    },
  },
  heroHeader: {
    display: "flex",
    alignItems: "center",
    gap: 16,
    flexWrap: "wrap",
    marginBottom: 18,
  },
  heroIcon: {
    width: 56,
    height: 56,
    borderRadius: "50%",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    background: "rgba(255,255,255,.14)",
    border: "1px solid rgba(255,255,255,.22)",
    boxShadow: "0 10px 22px rgba(0,0,0,.12)",
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: 700,
    lineHeight: 1.05,
    color: theme.palette.white,
  },
  heroHint: {
    marginTop: 4,
    fontSize: 13,
    color: "rgba(255,255,255,.82)",
  },
  actions: {
    display: "flex",
    gap: 14,
    flexWrap: "wrap",
    alignItems: "stretch",
  },
  actionWrap: { position: "relative" },
  actionDot: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 12,
    height: 12,
    borderRadius: "50%",
    border: `2px solid ${theme.palette.white}`,
    background: "#0072bc",
    boxShadow: "0 0 0 1px rgba(0,0,0,.12)",
  },
  card: {
    padding: 20,
    marginBottom: 18,
    background: "rgba(255,255,255,.94)",
    border: `1px solid ${BRAND.border}`,
    borderRadius: 24,
    boxShadow: "0 18px 36px rgba(0,87,166,.09)",
    overflow: "hidden",
  },
  cardHeader: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    marginBottom: 16,
    flexWrap: "wrap",
  },
  cardTitle: {
    display: "inline-flex",
    alignItems: "center",
    minHeight: 32,
    padding: "8px 16px",
    borderRadius: 999,
    background: "linear-gradient(135deg, #005596 0%, #0072bc 100%)",
    boxShadow: "0 10px 18px rgba(0,87,166,.18)",
    fontSize: 14,
    fontWeight: 700,
    lineHeight: 1.1,
    color: theme.palette.white,
  },
  grid3: {
    display: "grid",
    gap: 18,
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    selectors: {
      "@media (max-width: 1024px)": {
        gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
      },
      "@media (max-width: 600px)": {
        gridTemplateColumns: "1fr",
      },
    },
  },
  fieldCell: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
    minWidth: 0,
    selectors: {
      ".ms-Label": {
        fontSize: 14,
        fontWeight: 600,
        color: BRAND.ink,
      },
      ".ms-TextField-fieldGroup, .ms-Dropdown-title, .ms-BasePicker-text": {
        minHeight: 46,
        borderRadius: 18,
        borderColor: `${BRAND.border} !important`,
        background: "#ffffff",
        boxShadow: "0 6px 16px rgba(0,87,166,.05)",
      },
      ".ms-DatePicker .ms-TextField-fieldGroup": {
        minHeight: 46,
        borderRadius: 18,
        borderColor: `${BRAND.border} !important`,
        background: "#ffffff",
        boxShadow: "0 6px 16px rgba(0,87,166,.05)",
      },
      ".ms-TextField-fieldGroup:hover, .ms-Dropdown-title:hover, .ms-BasePicker-text:hover, .ms-DatePicker .ms-TextField-fieldGroup:hover": {
        borderColor: "#8bb8df !important",
      },
      ".ms-TextField-field, .ms-ComboBox input, .ms-DatePicker input, .ms-BasePicker-text, .ms-Dropdown-title": {
        fontSize: 14,
        fontWeight: 500,
      },
      ".ms-Dropdown-title": {
        lineHeight: "44px",
      },
      ".ms-Toggle-label, .ms-Toggle-stateText": {
        fontSize: 14,
        fontWeight: 600,
        color: BRAND.ink,
      },
      ".ms-Toggle-background": {
        borderColor: BRAND.border,
      },
    },
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: 700,
    marginBottom: 0,
    color: BRAND.ink,
  },
  footer: {
    display: "flex",
    gap: 12,
    justifyContent: "flex-end",
    marginTop: 12,
    flexWrap: "wrap",
  },
  fileInput: {
    width: "100%",
    padding: "10px 12px",
    border: `1px solid ${BRAND.border}`,
    borderRadius: 18,
    background: "#ffffff",
    whiteSpace: "normal",
    wordBreak: "break-word",
    boxShadow: "0 6px 16px rgba(0,87,166,.05)",
  },
  docsGrid: {
    display: "grid",
    gap: 18,
    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
    width: "100%",
    boxSizing: "border-box",
  },
  docItem: {
    display: "flex",
    alignItems: "stretch",
    minWidth: 0,
    selectors: {
      "> *": { width: "100%", minWidth: 0 },
      ".ms-Stack": {
        flexWrap: "wrap",
        alignItems: "flex-start",
        rowGap: 8,
      },
      ".ms-StackItem": {
        flexBasis: "100% !important",
        maxWidth: "100%",
        minWidth: 0,
      },
      ".ms-Label": {
        whiteSpace: "normal",
        wordBreak: "break-word",
        overflowWrap: "anywhere",
        lineHeight: 1.25,
        marginBottom: 4,
      },
      ".ms-TextField, .ms-DatePicker": { width: "100%" },
      ".ms-TextField-fieldGroup": { width: "100%" },
      ".ms-TextField-field": { whiteSpace: "normal", wordBreak: "break-word" },
    },
  },
  docLabelScope: {
    selectors: {
      ".ms-Label": {
        display: "block !important",
        whiteSpace: "normal !important",
        wordBreak: "break-word !important",
        overflowWrap: "anywhere !important",
        lineHeight: 1.3,
        marginBottom: 4,
      },
    },
  },
  docCardWrap: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  wrapLabel: {
    whiteSpace: "normal",
    wordBreak: "break-word",
    lineHeight: 1.25,
  },
  wrapControl: {
    width: "100%",
    selectors: {
      ".ms-Label": {
        whiteSpace: "normal",
        wordBreak: "break-word",
        lineHeight: 1.25,
      },
      ".ms-TextField-fieldGroup": { alignItems: "center" },
      ".ms-TextField-field": {
        whiteSpace: "normal",
        wordBreak: "break-word",
      },
      ".ms-DatePicker": { width: "100%" },
    },
  },
  certCard: {
    border: `1px solid ${BRAND.border}`,
    borderRadius: 24,
    background: "rgba(255,255,255,.96)",
    boxShadow: "0 18px 36px rgba(0,87,166,.09)",
    padding: 16,
  },
  certToolbar: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    margin: "0 0 14px",
    flexWrap: "wrap",
  },
  certTableWrap: {
    width: "100%",
    overflowX: "auto",
    boxSizing: "border-box",
  },
  certWrapCell: {
    whiteSpace: "normal",
    wordBreak: "break-word",
    lineHeight: 1.25,
  },
  certFileCell: {
    whiteSpace: "normal",
    wordBreak: "break-word",
    lineHeight: 1.25,
    color: BRAND.ink,
  },
  certOk: { color: "#107c10", fontWeight: 700 },
  certPending: { opacity: 0.82 },
  certFileInputHidden: { display: "none" },
  certFileInputName: {
    whiteSpace: "normal",
    wordBreak: "break-word",
    lineHeight: 1.25,
    color: BRAND.ink,
  },
  certTwoLineRow: {
    padding: "14px 0",
    borderBottom: `1px solid ${BRAND.border}`,
  },
  certRowTop: {
    display: "grid",
    gridTemplateColumns: "1fr auto auto",
    gap: 12,
    alignItems: "baseline",
    marginBottom: 8,
    selectors: {
      "@media (max-width: 720px)": {
        gridTemplateColumns: "1fr 1fr",
      },
      "@media (max-width: 480px)": {
        gridTemplateColumns: "1fr",
      },
    },
  },
  certRowBottom: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr auto",
    gap: 12,
    alignItems: "center",
    selectors: {
      "@media (max-width: 720px)": {
        gridTemplateColumns: "1fr",
        alignItems: "start",
      },
    },
  },
  certCell: { minWidth: 0 },
  certCellGrow: { minWidth: 0, width: "100%" },
  certMeta: {
    fontSize: 11,
    fontWeight: 700,
    color: BRAND.muted,
    lineHeight: 1.25,
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: ".04em",
    whiteSpace: "normal",
    wordBreak: "break-word",
  },
  certValue: {
    whiteSpace: "normal",
    wordBreak: "break-word",
    lineHeight: 1.4,
    color: BRAND.ink,
  },
  certActions: {
    display: "flex",
    justifyContent: "flex-end",
    gap: 8,
    flexWrap: "wrap",
  },
  certFilePicker: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  certStaged: {
    color: theme.palette.themePrimary,
    fontStyle: "italic",
  },
});

export const tileButtonStyles: IButtonStyles = {
  root: {
    minWidth: 176,
    minHeight: 112,
    padding: "16px 18px",
    borderRadius: 24,
    border: "1px solid rgba(255,255,255,.24)",
    background: "rgba(255,255,255,.14)",
    boxShadow: "0 14px 24px rgba(0,0,0,.12)",
    backdropFilter: "blur(10px)",
    color: "#ffffff",
  },
  rootHovered: {
    background: "rgba(255,255,255,.2)",
    borderColor: "rgba(255,255,255,.34)",
    transform: "translateY(-1px)",
  },
  rootPressed: {
    background: "rgba(255,255,255,.28)",
  },
  rootChecked: {
    background: "#ffffff",
    borderColor: "#ffffff",
    boxShadow: "0 12px 22px rgba(0,0,0,.14)",
    color: theme.palette.themePrimary,
  },
  rootCheckedHovered: {
    background: "#ffffff",
    borderColor: "#ffffff",
    boxShadow: "0 12px 22px rgba(0,0,0,.14)",
    color: theme.palette.themePrimary,
  },
  rootCheckedPressed: {
    background: "#ffffff",
    borderColor: "#ffffff",
    color: theme.palette.themePrimary,
  },
  flexContainer: {
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
  },
  icon: {
    fontSize: 34,
    height: 40,
    lineHeight: "40px",
    margin: 0,
    color: "inherit",
  },
  textContainer: {
    width: "100%",
    display: "flex",
    justifyContent: "center",
  },
  label: {
    width: "100%",
    textAlign: "center",
    fontWeight: 600,
    lineHeight: 1.2,
    whiteSpace: "normal",
    margin: 0,
    color: "inherit",
  },
};

export const primaryButtonStyles: IButtonStyles = {
  root: {
    minHeight: 44,
    padding: "0 20px",
    borderRadius: 999,
    border: "none",
    background: "linear-gradient(135deg, #005596 0%, #0072bc 100%)",
    boxShadow: "0 12px 22px rgba(0,87,166,.2)",
  },
  rootHovered: {
    background: "linear-gradient(135deg, #004d87 0%, #0067b2 100%)",
    boxShadow: "0 14px 24px rgba(0,87,166,.24)",
  },
  rootPressed: {
    background: "linear-gradient(135deg, #00406f 0%, #005596 100%)",
  },
  label: {
    fontWeight: 700,
    color: "#ffffff",
  },
  icon: {
    color: "#ffffff",
  },
};

export const secondaryButtonStyles: IButtonStyles = {
  root: {
    minHeight: 44,
    padding: "0 20px",
    borderRadius: 999,
    border: `1px solid ${BRAND.border}`,
    background: "rgba(255,255,255,.94)",
    boxShadow: "0 8px 18px rgba(0,87,166,.08)",
  },
  rootHovered: {
    background: "#ffffff",
    borderColor: "#8bb8df",
  },
  label: {
    fontWeight: 600,
    color: BRAND.ink,
  },
  icon: {
    color: BRAND.ink,
  },
};
