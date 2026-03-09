import * as React from "react";
import {
  DefaultButton,
  Dropdown,
  IDropdownOption,
  Label,
  Text,
  TextField,
} from "@fluentui/react";
import { secondaryButtonStyles, theme } from "../../ui/styles";

type DocCardProps = {
  title: string;
  dateLabel?: string;
  dateValue?: string;
  onDateChange?: (v?: string) => void;
  dateMin?: string;
  dateMax?: string;
  textLabel?: string;
  textValue?: string;
  onTextChange?: (v?: string) => void;
  textAsDropdown?: boolean;
  textOptions?: { key: string; text: string }[];
  file?: File;
  existingFileName?: string;
  onFileChange?: (f?: File) => void;
  invalid?: boolean;
  showValidation?: boolean;
};

export const DocCard: React.FC<DocCardProps> = ({
  title,
  dateLabel,
  dateValue,
  onDateChange,
  dateMin,
  dateMax,
  textLabel,
  textValue,
  onTextChange,
  textAsDropdown,
  textOptions,
  file,
  existingFileName,
  onFileChange,
  invalid,
  showValidation = false,
}) => {
  const showInvalid = !!showValidation && !!invalid;

  const handleFileChange = (): void => {
    const input = document.createElement("input");
    input.type = "file";
    input.onchange = () => {
      const picked = input.files && input.files[0] ? input.files[0] : undefined;
      onFileChange?.(picked);
    };
    input.click();
  };

  const displayedFileName = file ? file.name : existingFileName || "";

  const validateDate = (value: string): boolean => {
    if (dateMax && value && value > dateMax) {
      window.alert("La fecha no puede ser mayor a la fecha actual.");
      return false;
    }
    if (dateMin && value && value < dateMin) {
      window.alert("La fecha no puede ser menor a la fecha actual.");
      return false;
    }
    return true;
  };

  const inputGuard = {
    onKeyDown: (ev: React.KeyboardEvent<HTMLInputElement>): void => {
      const allowed = [
        "Tab",
        "Shift",
        "Escape",
        "ArrowLeft",
        "ArrowRight",
        "ArrowUp",
        "ArrowDown",
        "Home",
        "End",
      ];

      if (allowed.includes(ev.key)) return;
      ev.preventDefault();
    },
    onClick: (ev: React.MouseEvent<HTMLInputElement>): void => {
      const target = ev.currentTarget as HTMLInputElement & {
        showPicker?: () => void;
      };
      if (typeof target.showPicker === "function") {
        target.showPicker();
      }
    },
    onPaste: (ev: React.ClipboardEvent<HTMLInputElement>): void => ev.preventDefault(),
    onDrop: (ev: React.DragEvent<HTMLInputElement>): void => ev.preventDefault(),
  };

  const dropdownOptions: IDropdownOption[] = [
    { key: "", text: "Seleccione..." },
    ...((textOptions || []) as IDropdownOption[]),
  ];
  const controlBorder = showInvalid ? "2px solid #a4262c" : "1px solid #cad9ea";

  return (
    <div
      style={{
        border: controlBorder,
        borderRadius: 22,
        padding: 14,
        background: "linear-gradient(180deg, rgba(255,255,255,.98) 0%, #f6fbff 100%)",
        boxShadow: "0 16px 30px rgba(0,87,166,.08)",
        display: "flex",
        flexDirection: "column",
        gap: 10,
        minHeight: "100%",
      }}
    >
      <Label
        styles={{
          root: {
            fontWeight: 600,
            color: theme.palette.themePrimary,
            marginBottom: 0,
            whiteSpace: "normal",
          },
        }}
      >
        {title}
      </Label>

      {dateLabel && (
        <div>
          <Label styles={{ root: { marginBottom: 4 } }}>{dateLabel}</Label>
          <input
            type="date"
            value={dateValue || ""}
            min={dateMin}
            max={dateMax}
            inputMode="none"
            onKeyDown={inputGuard.onKeyDown}
            onClick={inputGuard.onClick}
            onPaste={inputGuard.onPaste}
            onDrop={inputGuard.onDrop}
            onChange={(ev) => {
              const value = ev.currentTarget.value || "";
              if (!validateDate(value)) return;
              onDateChange?.(value);
            }}
            style={{
              width: "100%",
              minHeight: 44,
              padding: "8px 12px",
              borderRadius: 18,
              border: controlBorder,
              fontSize: 14,
              fontFamily: "inherit",
              boxSizing: "border-box",
              boxShadow: "0 6px 16px rgba(0,87,166,.05)",
            }}
          />
        </div>
      )}

      {textLabel &&
        (textAsDropdown ? (
          <Dropdown
            label={textLabel}
            placeholder="Seleccione..."
            options={dropdownOptions}
            selectedKey={textValue || ""}
            onChange={(_, opt) => onTextChange?.(String(opt?.key || ""))}
            styles={{
              label: { marginBottom: 6, fontWeight: 600 },
              title: {
                minHeight: 44,
                lineHeight: 42,
                borderRadius: 18,
                borderColor: showInvalid ? "#a4262c" : "#cad9ea",
                borderWidth: showInvalid ? 2 : 1,
                background: "#ffffff",
                boxShadow: "0 6px 16px rgba(0,87,166,.05)",
              },
            }}
          />
        ) : (
          <TextField
            label={textLabel}
            value={textValue || ""}
            onChange={(_, nextValue) => onTextChange?.(nextValue || "")}
            styles={{
              fieldGroup: {
                minHeight: 44,
                borderRadius: 18,
                borderColor: showInvalid ? "#a4262c" : "#cad9ea",
                borderWidth: showInvalid ? 2 : 1,
                background: "#ffffff",
                boxShadow: "0 6px 16px rgba(0,87,166,.05)",
              },
            }}
          />
        ))}

      <div>
        <DefaultButton
          text="Adjuntar archivo"
          iconProps={{ iconName: "Upload" }}
          onClick={handleFileChange}
          disabled={!onFileChange}
          styles={secondaryButtonStyles}
        />
        <Text
          variant="small"
          styles={{
            root: {
              display: "block",
              marginTop: 6,
              color: theme.palette.neutralSecondary,
              wordBreak: "break-word",
            },
          }}
        >
          {displayedFileName || "-"}
        </Text>
      </div>
    </div>
  );
};
