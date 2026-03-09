import * as React from "react";

type DocCardProps = {
  title: string;

  dateLabel?: string;
  dateValue?: string;
  onDateChange?: (v?: string) => void;

  // restricciones del calendario
  dateMin?: string; // YYYY-MM-DD
  dateMax?: string; // YYYY-MM-DD

  textLabel?: string;
  textValue?: string;
  onTextChange?: (v?: string) => void;
  textAsDropdown?: boolean;
  textOptions?: { key: string; text: string }[];

  file?: File;
  existingFileName?: string;
  onFileChange?: (f?: File) => void;

  // Marcado visual de requerido faltante
  invalid?: boolean;

  // NUEVO: para NO marcar al cargar, solo después de intentar guardar
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

  const showInvalid = !!showValidation && !!invalid;

  return (
    <div
      style={{
        border: showInvalid ? "2px solid #d13438" : "1px solid #ddd",
        borderRadius: 8,
        padding: 12,
        background: "#fff",
        display: "flex",
        flexDirection: "column",
        gap: 8,
      }}
    >
      <div style={{ fontWeight: 600 }}>{title}</div>

      {dateLabel && (
        <div>
          <label style={{ fontSize: 13 }}>{dateLabel}</label>
          <input
            type="date"
            value={dateValue || ""}
            min={dateMin}
            max={dateMax}
            inputMode="none"
            onKeyDown={(e) => {
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
              if (allowed.includes(e.key)) return;
              e.preventDefault();
            }}
            onClick={(e) => {
              const target = e.currentTarget as HTMLInputElement;
              if (typeof target.showPicker === "function") {
                target.showPicker();
              }
            }}
            onPaste={(e) => e.preventDefault()}
            onDrop={(e) => e.preventDefault()}
            onChange={(e) => {
              const v = e.target.value;

              // Guard rail
              if (dateMax && v && v > dateMax) {
                window.alert("La fecha no puede ser mayor a la fecha actual.");
                return;
              }
              if (dateMin && v && v < dateMin) {
                window.alert("La fecha no puede ser menor a la fecha actual.");
                return;
              }

              onDateChange?.(v);
            }}
            style={{
              width: "100%",
              padding: 6,
              borderRadius: 4,
              border: "1px solid #ccc",
            }}
          />
        </div>
      )}

      {textLabel && (
        <div>
          <label style={{ fontSize: 13 }}>{textLabel}</label>

          {textAsDropdown ? (
            <select
              value={textValue || ""}
              onChange={(e) => onTextChange?.(e.target.value)}
              style={{
                width: "100%",
                padding: 6,
                borderRadius: 4,
                border: "1px solid #ccc",
              }}
            >
              <option value="">Seleccione...</option>
              {textOptions?.map((opt) => (
                <option key={opt.key} value={opt.key}>
                  {opt.text}
                </option>
              ))}
            </select>
          ) : (
            <input
              type="text"
              value={textValue || ""}
              onChange={(e) => onTextChange?.(e.target.value)}
              style={{
                width: "100%",
                padding: 6,
                borderRadius: 4,
                border: "1px solid #ccc",
              }}
            />
          )}
        </div>
      )}

      <div>
        <button type="button" onClick={handleFileChange}>
          Adjuntar archivo
        </button>
        <div style={{ fontSize: 12, marginTop: 4 }}>
          {displayedFileName || "-"}
        </div>
      </div>
    </div>
  );
};
